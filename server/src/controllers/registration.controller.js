// src/controllers/registration.controller.js
import mongoose from 'mongoose'
import Event from '../models/Event.js'
import EventRegistration from '../models/EventRegistration.js'
import ActivityLog from '../models/ActivityLog.js'
import User from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { applyEventScope, assertEventAccess } from '../middleware/eventScope.middleware.js'
import { Readable } from 'node:stream'
import { uploadDocument, resolveContentType } from '../services/storage.service.js'
import {
  buildRegistrationCode,
  buildTicketCode,
  buildInvoiceNumber,
  attendanceLabel,
} from '../utils/registrationCodes.js'
import {
  sendAdminSubmissionNotification,
  sendAdminPaymentNotification,
  sendRegistrationSubmittedEmail,
  sendRegistrationAcceptedEmail,
  sendRegistrationRejectedEmail,
  sendPaymentReceivedEmail,
  sendPaymentRejectedEmail,
  sendTicketEmail,
} from '../services/registrationEmail.service.js'

const MB = 1024 * 1024

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const notify = (promise) => {
  // Email delivery must never turn a successful write into a 500.
  Promise.resolve(promise).catch(() => {})
}

const str = (value) => (value === undefined || value === null ? '' : String(value).trim())

/**
 * Who gets told when something happens on an event: the organiser addresses
 * configured on the event, a global fallback from the environment, and every
 * active reviewer assigned to that event. Duplicates are collapsed.
 */
const collectOrganiserRecipients = async (event) => {
  const recipients = new Set()

  ;(event?.registration?.notifyEmails || []).forEach((email) => {
    const clean = str(email).toLowerCase()
    if (clean) recipients.add(clean)
  })

  str(process.env.ADMIN_NOTIFICATION_EMAIL)
    .split(',')
    .forEach((email) => {
      const clean = str(email).toLowerCase()
      if (clean) recipients.add(clean)
    })

  if (event?._id) {
    try {
      const reviewers = await User.find({
        role: 'reviewer',
        isActive: true,
        assignedEvents: event._id,
      }).select('email')

      reviewers.forEach((reviewer) => {
        if (reviewer.email) recipients.add(reviewer.email.toLowerCase())
      })
    } catch {
      // A lookup failure must not block the participant's submission
    }
  }

  return [...recipients]
}

const parseKeywords = (raw) => {
  if (Array.isArray(raw)) return raw.map(str).filter(Boolean)
  const value = str(raw)
  if (!value) return []

  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(str).filter(Boolean)
    } catch {
      // fall through to comma split
    }
  }

  return value
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}

const findEventOrFail = async (identifier) => {
  const query = mongoose.isValidObjectId(identifier)
    ? { _id: identifier }
    : { slug: String(identifier).toLowerCase() }

  const event = await Event.findOne(query)
  if (!event) throw new AppError('Event not found', 404)
  return event
}

const assertRegistrationOpen = (event) => {
  if (!event.registration?.enabled) {
    throw new AppError('Registration is not available for this event.', 400)
  }
  if (!event.isPublished) {
    throw new AppError('This event is not published yet.', 400)
  }

  const now = new Date()
  if (event.registration.opensAt && now < event.registration.opensAt) {
    throw new AppError('Registration for this event has not opened yet.', 400)
  }
  if (event.registration.closesAt && now > event.registration.closesAt) {
    throw new AppError('Registration for this event is already closed.', 400)
  }
}

const resolveFee = (event, role, mode) => {
  const fees = event.registration?.fees || []
  const match = fees.find((f) => f.role === role && f.mode === mode)

  if (!match) {
    throw new AppError(
      `No fee is configured for "${role} / ${mode}". Please contact the organiser.`,
      400
    )
  }

  return {
    label: match.label || attendanceLabel(role, mode),
    amountIdr: match.amountIdr || 0,
    amountUsd: match.amountUsd || 0,
  }
}

/** Strips bank details — those are only revealed once a submission is accepted. */
const publicEventConfig = (event) => {
  const cfg = event.registration?.toObject ? event.registration.toObject() : { ...event.registration }
  delete cfg.bank
  return cfg
}

const createUniqueRegistration = async (payload, prefix) => {
  // The unique index on registrationCode is the source of truth; retry on the
  // (very unlikely) collision rather than pre-checking.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await EventRegistration.create({
        ...payload,
        registrationCode: buildRegistrationCode(prefix),
      })
    } catch (error) {
      const isDuplicateCode = error?.code === 11000 && error?.keyPattern?.registrationCode
      if (!isDuplicateCode) throw error
    }
  }
  throw new AppError('Could not allocate a registration code. Please try again.', 500)
}

const validateManuscript = (event, body, keywords) => {
  const cfg = event.registration || {}
  if (!cfg.requireManuscript) return

  if (!str(body.manuscriptTitle)) throw new AppError('Article / journal title is required', 400)
  if (!str(body.abstract)) throw new AppError('Abstract is required', 400)

  const min = cfg.keywordsMin ?? 3
  const max = cfg.keywordsMax ?? 5

  if (keywords.length < min || keywords.length > max) {
    throw new AppError(`Please provide between ${min} and ${max} keywords.`, 400)
  }

  const allowedOutputs = (cfg.outputTypes || []).map((o) => o.value)
  const outputType = str(body.outputType)
  if (allowedOutputs.length && !allowedOutputs.includes(outputType)) {
    throw new AppError('Please choose a valid output type.', 400)
  }
}

const assertFileSize = (file, maxMb, label) => {
  if (!file) return
  if (file.size > maxMb * MB) {
    throw new AppError(`${label} must not exceed ${maxMb} MB.`, 400)
  }
}

// ═══════════════════════════════════════════════════════════
// PUBLIC — form configuration
// ═══════════════════════════════════════════════════════════

export const getEventRegistrationConfig = catchAsync(async (req, res) => {
  const event = await findEventOrFail(req.params.eventIdOrSlug)

  const cfg = publicEventConfig(event)
  const now = new Date()
  const isOpen =
    Boolean(event.registration?.enabled) &&
    event.isPublished &&
    (!event.registration?.opensAt || now >= event.registration.opensAt) &&
    (!event.registration?.closesAt || now <= event.registration.closesAt)

  let myRegistration = null
  if (req.participant) {
    myRegistration = await EventRegistration.findOne({
      event: event._id,
      participant: req.participant._id,
    })
  }

  res.status(200).json({
    status: 'success',
    data: {
      event: {
        _id: event._id,
        title: event.title,
        slug: event.slug,
        eventDate: event.eventDate,
        endDate: event.endDate,
        location: event.location,
        locationType: event.locationType,
        coverImage: event.coverImage,
        description: event.description,
      },
      registration: cfg,
      isOpen,
      myRegistration,
    },
  })
})

// ═══════════════════════════════════════════════════════════
// PARTICIPANT
// ═══════════════════════════════════════════════════════════

export const submitRegistration = catchAsync(async (req, res, next) => {
  const event = await findEventOrFail(req.params.eventIdOrSlug)
  assertRegistrationOpen(event)

  const cfg = event.registration
  const body = req.body || {}
  const keywords = parseKeywords(body.keywords)

  const role = str(body.attendanceRole)
  const mode = str(body.attendanceMode)

  if (!['presenter', 'participant'].includes(role)) {
    return next(new AppError('Please choose an attendance type.', 400))
  }
  if (!['online', 'offline'].includes(mode)) {
    return next(new AppError('Please choose online or offline attendance.', 400))
  }

  const fullName = str(body.fullName)
  const affiliation = str(body.affiliation)
  const email = str(body.email).toLowerCase()
  const phone = str(body.phone)

  if (!fullName) return next(new AppError('Full name is required', 400))
  if (!affiliation) return next(new AppError('Affiliation is required', 400))
  if (!email) return next(new AppError('Email is required', 400))
  if (!/^\+[1-9]\d{0,3}[\s-]?\d[\d\s-]{5,17}$/.test(phone)) {
    return next(
      new AppError('Phone must start with a country code, e.g. +6281234567890', 400)
    )
  }

  validateManuscript(event, body, keywords)

  const existing = await EventRegistration.findOne({
    event: event._id,
    participant: req.participant._id,
  })

  const isResubmission = Boolean(existing)

  if (existing && existing.submissionStatus !== 'rejected') {
    return next(
      new AppError(
        'You already have an active registration for this event. Open it from "My Registrations" to continue.',
        409
      )
    )
  }

  // ── Abstract file ──
  assertFileSize(req.file, cfg.maxAbstractSizeMb ?? 15, 'Abstract file')

  if (cfg.requireAbstractFile && !req.file && !existing?.abstractFile?.url) {
    return next(new AppError('Please upload your abstract (PDF or Microsoft Word).', 400))
  }

  // Re-use the previously uploaded abstract when a revision does not attach a
  // new file. Convert the subdocument to a plain object so Mongoose re-casts it
  // cleanly instead of re-assigning a live subdocument to itself.
  let abstractFile = existing?.abstractFile
    ? existing.abstractFile.toObject?.() || existing.abstractFile
    : null

  if (req.file) {
    abstractFile = await uploadDocument(req.file, {
      folder: `dealings/registrations/${event.slug}/abstracts`,
      publicIdHint: 'abstract',
    })
  }

  const fee = resolveFee(event, role, mode)

  const payload = {
    event: event._id,
    participant: req.participant._id,
    profile: { fullName, affiliation, email, phone, country: str(body.country) },
    manuscript: {
      title: str(body.manuscriptTitle),
      abstract: str(body.abstract),
      keywords,
      outputType: str(body.outputType),
    },
    attendance: { role, mode },
    fee,
    abstractFile,
    submissionStatus: 'submitted',
    submittedAt: new Date(),
    reviewNote: '',
    reviewedAt: null,
    reviewedBy: null,
    ticket: { ...(existing?.ticket?.toObject?.() || {}), attendanceLabel: attendanceLabel(role, mode) },
  }

  let registration

  if (isResubmission) {
    Object.assign(existing, payload)
    existing.submissionCount = (existing.submissionCount || 1) + 1
    existing.pushHistory({
      action: 'RESUBMITTED',
      actorType: 'participant',
      actorId: req.participant._id,
      note: `Resubmission #${existing.submissionCount}`,
    })
    registration = await existing.save()
  } else {
    registration = await createUniqueRegistration(
      {
        ...payload,
        submissionCount: 1,
        history: [
          {
            action: 'SUBMITTED',
            actorType: 'participant',
            actorId: req.participant._id,
            note: 'Initial submission',
            at: new Date(),
          },
        ],
      },
      cfg.ticketPrefix || event.slug
    )
  }

  notify(sendRegistrationSubmittedEmail(registration, event))

  if (cfg.notifyOnSubmission !== false) {
    notify(
      collectOrganiserRecipients(event).then((recipients) =>
        sendAdminSubmissionNotification(recipients, registration, event, { isResubmission })
      )
    )
  }

  res.status(isResubmission ? 200 : 201).json({ status: 'success', data: registration })
})

export const getMyRegistrations = catchAsync(async (req, res) => {
  const registrations = await EventRegistration.find({ participant: req.participant._id })
    .populate('event', 'title slug eventDate endDate location coverImage locationType')
    .sort('-createdAt')

  res.status(200).json({ status: 'success', results: registrations.length, data: registrations })
})

export const getMyRegistration = catchAsync(async (req, res, next) => {
  const registration = await EventRegistration.findOne({
    _id: req.params.id,
    participant: req.participant._id,
  }).populate(
    'event',
    'title slug eventDate endDate location locationType coverImage registration'
  )

  if (!registration) return next(new AppError('Registration not found', 404))

  const payload = registration.toObject()

  // Bank details are revealed only once the abstract has been accepted.
  if (payload.event?.registration && registration.submissionStatus !== 'accepted') {
    delete payload.event.registration.bank
  }

  res.status(200).json({ status: 'success', data: payload })
})

export const submitPayment = catchAsync(async (req, res, next) => {
  const registration = await EventRegistration.findOne({
    _id: req.params.id,
    participant: req.participant._id,
  })

  if (!registration) return next(new AppError('Registration not found', 404))

  if (registration.submissionStatus !== 'accepted') {
    return next(
      new AppError('Payment opens after your submission has been accepted by the committee.', 400)
    )
  }

  if (registration.paymentStatus === 'confirmed') {
    return next(new AppError('This registration has already been paid and confirmed.', 400))
  }

  const event = await Event.findById(registration.event)
  const method = str(req.body?.method) || 'manual'

  if (method === 'gateway') {
    if (!event?.registration?.paymentMethods?.gateway) {
      return next(
        new AppError(
          event?.registration?.paymentMethods?.gatewayNote ||
            'Online payment gateway is not available yet. Please use manual transfer.',
          400
        )
      )
    }
  }

  const body = req.body || {}
  const bankName = str(body.bankName)
  const accountName = str(body.accountName)
  const accountNumber = str(body.accountNumber)

  if (!bankName) return next(new AppError('Bank name is required', 400))
  if (!accountName) return next(new AppError('Account name (as printed on the transfer) is required', 400))
  if (!accountNumber) return next(new AppError('Account number is required', 400))
  if (!req.file) return next(new AppError('Please attach your transfer receipt (screenshot or PDF).', 400))

  assertFileSize(req.file, 10, 'Payment proof')

  const proofFile = await uploadDocument(req.file, {
    folder: `dealings/registrations/${event?.slug || 'event'}/payments`,
    publicIdHint: `proof-${registration.registrationCode}`,
  })

  // Every earlier attempt is invalidated so a participant can never be counted
  // as having paid twice.
  registration.payments.forEach((payment) => {
    if (payment.status === 'pending') {
      payment.status = 'failed'
      payment.adminNote = payment.adminNote || 'Superseded by a newer payment submission'
    }
  })

  registration.payments.push({
    method,
    status: 'pending',
    bankName,
    accountName,
    accountNumber,
    swiftCode: str(body.swiftCode),
    country: str(body.country),
    amountDeclared: Number(body.amountDeclared) || registration.fee?.amountIdr || 0,
    currency: str(body.currency) === 'USD' ? 'USD' : 'IDR',
    proofFile,
    note: str(body.note),
    submittedAt: new Date(),
  })

  registration.paymentStatus = 'pending'
  registration.paymentMethod = method
  registration.pushHistory({
    action: 'PAYMENT_SUBMITTED',
    actorType: 'participant',
    actorId: req.participant._id,
    note: `Attempt #${registration.payments.length} via ${method}`,
  })

  await registration.save()

  notify(sendPaymentReceivedEmail(registration, event))

  if (event?.registration?.notifyOnPayment !== false) {
    notify(
      collectOrganiserRecipients(event).then((recipients) =>
        sendAdminPaymentNotification(recipients, registration, event)
      )
    )
  }

  res.status(200).json({ status: 'success', data: registration })
})

export const uploadFullPaper = catchAsync(async (req, res, next) => {
  const registration = await EventRegistration.findOne({
    _id: req.params.id,
    participant: req.participant._id,
  })

  if (!registration) return next(new AppError('Registration not found', 404))
  if (registration.paymentStatus !== 'confirmed') {
    return next(new AppError('The full paper upload opens once your payment is confirmed.', 400))
  }
  if (!req.file) return next(new AppError('Please attach your full chapter (PDF or Microsoft Word).', 400))

  const event = await Event.findById(registration.event)
  const maxMb = event?.registration?.maxFullPaperSizeMb ?? 25
  assertFileSize(req.file, maxMb, 'Full paper')

  registration.fullPaperFile = await uploadDocument(req.file, {
    folder: `dealings/registrations/${event?.slug || 'event'}/full-papers`,
    publicIdHint: `fullpaper-${registration.registrationCode}`,
  })

  registration.pushHistory({
    action: 'FULL_PAPER_UPLOADED',
    actorType: 'participant',
    actorId: req.participant._id,
  })

  await registration.save()

  res.status(200).json({ status: 'success', data: registration })
})

// ═══════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════

export const listRegistrations = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query
  const limit = Math.min(parseInt(query.limit, 10) || 50, 500)
  const page = parseInt(query.page, 10) || 1

  const filter = {}
  if (query.event && mongoose.isValidObjectId(query.event)) filter.event = query.event
  applyEventScope(filter, req.user)
  if (query.submissionStatus) filter.submissionStatus = query.submissionStatus
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus
  if (query.role) filter['attendance.role'] = query.role
  if (query.mode) filter['attendance.mode'] = query.mode

  if (query.q) {
    const regex = new RegExp(query.q, 'i')
    filter.$or = [
      { registrationCode: regex },
      { 'profile.fullName': regex },
      { 'profile.email': regex },
      { 'profile.affiliation': regex },
      { 'manuscript.title': regex },
      { 'ticket.code': regex },
    ]
  }

  const total = await EventRegistration.countDocuments(filter)
  const registrations = await EventRegistration.find(filter)
    .populate('event', 'title slug eventDate')
    .populate('participant', 'name email')
    .sort(query.sort || '-createdAt')
    .skip((page - 1) * limit)
    .limit(limit)

  res.status(200).json({
    status: 'success',
    results: registrations.length,
    total,
    page,
    data: registrations,
  })
})

export const getRegistrationStats = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query
  const match = {}
  if (query.event && mongoose.isValidObjectId(query.event)) {
    match.event = new mongoose.Types.ObjectId(query.event)
  }

  const scoped = applyEventScope({ ...match }, req.user)
  if (scoped.event && scoped.event.$in) {
    match.event = { $in: scoped.event.$in.map((id) => new mongoose.Types.ObjectId(id)) }
  } else if (scoped.event) {
    match.event = scoped.event
  }

  const [byStatus] = await EventRegistration.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        submitted: { $sum: { $cond: [{ $eq: ['$submissionStatus', 'submitted'] }, 1, 0] } },
        accepted: { $sum: { $cond: [{ $eq: ['$submissionStatus', 'accepted'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$submissionStatus', 'rejected'] }, 1, 0] } },
        paymentPending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } },
        paymentConfirmed: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'confirmed'] }, 1, 0] } },
        presenters: { $sum: { $cond: [{ $eq: ['$attendance.role', 'presenter'] }, 1, 0] } },
        offline: { $sum: { $cond: [{ $eq: ['$attendance.mode', 'offline'] }, 1, 0] } },
        revenueIdr: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'confirmed'] }, '$fee.amountIdr', 0] },
        },
      },
    },
  ])

  res.status(200).json({
    status: 'success',
    data: byStatus || {
      total: 0,
      submitted: 0,
      accepted: 0,
      rejected: 0,
      paymentPending: 0,
      paymentConfirmed: 0,
      presenters: 0,
      offline: 0,
      revenueIdr: 0,
    },
  })
})

export const getRegistration = catchAsync(async (req, res, next) => {
  const registration = await EventRegistration.findById(req.params.id)
    .populate('event', 'title slug eventDate location registration')
    .populate('participant', 'name email phone affiliation country createdAt')
    .populate('reviewedBy', 'name email')

  if (!registration) return next(new AppError('Registration not found', 404))
  assertEventAccess(req.user, registration.event?._id || registration.event)

  res.status(200).json({ status: 'success', data: registration })
})

export const reviewRegistration = catchAsync(async (req, res, next) => {
  const { decision, note = '' } = req.body || {}

  if (!['accept', 'deny'].includes(decision)) {
    return next(new AppError('Decision must be either "accept" or "deny".', 400))
  }

  const registration = await EventRegistration.findById(req.params.id)
  if (!registration) return next(new AppError('Registration not found', 404))
  assertEventAccess(req.user, registration.event)

  if (registration.paymentStatus === 'confirmed') {
    return next(new AppError('This registration is already paid and cannot be re-reviewed.', 400))
  }

  const event = await Event.findById(registration.event)

  registration.submissionStatus = decision === 'accept' ? 'accepted' : 'rejected'
  registration.reviewNote = str(note)
  registration.reviewedAt = new Date()
  registration.reviewedBy = req.user._id
  registration.pushHistory({
    action: decision === 'accept' ? 'ACCEPTED' : 'REJECTED',
    actorType: 'admin',
    actorId: req.user._id,
    note: str(note),
  })

  await registration.save()

  await ActivityLog.log({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'registration',
    entityId: registration._id,
    details: `${decision === 'accept' ? 'Accepted' : 'Denied'} ${registration.registrationCode}`,
    ipAddress: req.ip,
  })

  notify(
    decision === 'accept'
      ? sendRegistrationAcceptedEmail(registration, event)
      : sendRegistrationRejectedEmail(registration, event, str(note))
  )

  res.status(200).json({ status: 'success', data: registration })
})

export const reviewPayment = catchAsync(async (req, res, next) => {
  const { decision, note = '' } = req.body || {}

  if (!['confirm', 'reject'].includes(decision)) {
    return next(new AppError('Decision must be either "confirm" or "reject".', 400))
  }

  const registration = await EventRegistration.findById(req.params.id)
  if (!registration) return next(new AppError('Registration not found', 404))
  assertEventAccess(req.user, registration.event)

  const latest = [...registration.payments].reverse().find((p) => p.status === 'pending')
  if (!latest) return next(new AppError('There is no pending payment to review.', 400))

  const event = await Event.findById(registration.event)

  latest.status = decision === 'confirm' ? 'confirmed' : 'failed'
  latest.adminNote = str(note)
  latest.reviewedAt = new Date()
  latest.reviewedBy = req.user._id

  if (decision === 'confirm') {
    registration.paymentStatus = 'confirmed'
    registration.paidAt = new Date()

    if (!registration.ticket?.code) {
      const issued = await EventRegistration.countDocuments({
        event: registration.event,
        'ticket.code': { $nin: ['', null] },
      })

      const prefix = event?.registration?.ticketPrefix || event?.slug || 'REG'

      registration.ticket = {
        code: buildTicketCode(
          prefix,
          registration.attendance.role,
          registration.attendance.mode,
          issued + 1
        ),
        issuedAt: new Date(),
        attendanceLabel: attendanceLabel(registration.attendance.role, registration.attendance.mode),
      }

      registration.invoice = {
        number: buildInvoiceNumber(event?.registration?.invoicePrefix || 'INV', issued + 1),
        issuedAt: new Date(),
        amountIdr: registration.fee?.amountIdr || 0,
        amountUsd: registration.fee?.amountUsd || 0,
        currency: latest.currency || 'IDR',
      }
    }

    registration.pushHistory({
      action: 'PAYMENT_CONFIRMED',
      actorType: 'admin',
      actorId: req.user._id,
      note: str(note),
    })
  } else {
    registration.paymentStatus = 'failed'
    registration.pushHistory({
      action: 'PAYMENT_REJECTED',
      actorType: 'admin',
      actorId: req.user._id,
      note: str(note),
    })
  }

  await registration.save()

  await ActivityLog.log({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'registration',
    entityId: registration._id,
    details: `Payment ${decision === 'confirm' ? 'confirmed' : 'rejected'} for ${registration.registrationCode}`,
    ipAddress: req.ip,
  })

  if (decision === 'confirm') {
    notify(
      sendTicketEmail(registration, event).then(async (result) => {
        if (result?.ok) {
          await EventRegistration.updateOne(
            { _id: registration._id },
            { ticketEmailSentAt: new Date() }
          )
        }
      })
    )
  } else {
    notify(sendPaymentRejectedEmail(registration, event, str(note)))
  }

  res.status(200).json({ status: 'success', data: registration })
})

export const resendTicketEmail = catchAsync(async (req, res, next) => {
  const registration = await EventRegistration.findById(req.params.id)
  if (!registration) return next(new AppError('Registration not found', 404))
  assertEventAccess(req.user, registration.event)

  if (registration.paymentStatus !== 'confirmed' || !registration.ticket?.code) {
    return next(new AppError('No ticket has been issued for this registration yet.', 400))
  }

  const event = await Event.findById(registration.event)
  const result = await sendTicketEmail(registration, event)

  if (result?.ok) {
    registration.ticketEmailSentAt = new Date()
    await registration.save()
  }

  // Report what actually happened. Claiming "sent" for a message the mail
  // server refused is how a delivery problem stays invisible for weeks.
  res.status(result?.ok ? 200 : 502).json({
    status: result?.ok ? 'success' : 'fail',
    message: result?.ok
      ? `Ticket email sent to ${registration.profile.email}`
      : `Delivery failed: ${result?.error?.response || 'unknown error'}`,
    hint: result?.ok ? undefined : result?.error?.hint,
  })
})

/** Attendance recap: name, affiliation, article title, ticket number. */
export const getRecap = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query
  const filter = {}
  if (query.event && mongoose.isValidObjectId(query.event)) filter.event = query.event
  applyEventScope(filter, req.user)
  if (query.onlyPaid !== 'false') filter.paymentStatus = 'confirmed'

  const registrations = await EventRegistration.find(filter)
    .populate('event', 'title slug')
    .sort('ticket.code')

  const rows = registrations.map((r) => ({
    ticketCode: r.ticket?.code || '',
    registrationCode: r.registrationCode,
    fullName: r.profile.fullName,
    affiliation: r.profile.affiliation,
    email: r.profile.email,
    phone: r.profile.phone,
    articleTitle: r.manuscript?.title || '',
    outputType: r.manuscript?.outputType || '',
    role: r.attendance.role,
    mode: r.attendance.mode,
    amountIdr: r.fee?.amountIdr || 0,
    paymentStatus: r.paymentStatus,
    invoiceNumber: r.invoice?.number || '',
    event: r.event?.title || '',
  }))

  if (query.format === 'csv') {
    const headers = Object.keys(
      rows[0] || {
        ticketCode: '',
        registrationCode: '',
        fullName: '',
        affiliation: '',
        email: '',
        phone: '',
        articleTitle: '',
        outputType: '',
        role: '',
        mode: '',
        amountIdr: '',
        paymentStatus: '',
        invoiceNumber: '',
        event: '',
      }
    )

    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(',')),
    ].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="registration-recap.csv"')
    return res.status(200).send(csv)
  }

  res.status(200).json({ status: 'success', results: rows.length, data: rows })
})

// ═══════════════════════════════════════════════════════════
// FILE DOWNLOADS
// ═══════════════════════════════════════════════════════════

/**
 * Files are streamed through the API rather than linked to directly, so that
 * every download carries the right Content-Type and the participant's original
 * filename. A raw Cloudinary link hands the browser an opaque blob, which the
 * operating system then cannot associate with Word or a PDF reader.
 * Streaming also keeps abstracts and payment receipts behind authentication
 * instead of a public CDN URL.
 */
const pickStoredFile = (registration, kind) => {
  if (kind === 'abstract') return registration.abstractFile
  if (kind === 'full-paper') return registration.fullPaperFile

  const paymentMatch = /^payment-(\d+)$/.exec(kind)
  if (paymentMatch) {
    const index = Number(paymentMatch[1])
    return registration.payments?.[index]?.proofFile || null
  }

  return null
}

const asciiFallbackName = (name) =>
  (name || 'download').replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')

const streamStoredFile = async (res, next, storedFile) => {
  if (!storedFile?.url) {
    return next(new AppError('File not found for this registration.', 404))
  }

  if (typeof fetch !== 'function') {
    return next(new AppError('This Node.js version cannot proxy downloads. Node 18+ is required.', 500))
  }

  let upstream
  try {
    upstream = await fetch(storedFile.url)
  } catch {
    return next(new AppError('Storage is unreachable. Please try again.', 502))
  }

  if (!upstream.ok || !upstream.body) {
    return next(new AppError('The file could not be retrieved from storage.', 502))
  }

  const filename = storedFile.originalName || `download.${storedFile.format || 'bin'}`
  const length = upstream.headers.get('content-length')

  res.setHeader('Content-Type', resolveContentType(storedFile))
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${asciiFallbackName(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  )
  res.setHeader('Cache-Control', 'private, no-store')
  if (length) res.setHeader('Content-Length', length)

  Readable.fromWeb(upstream.body).pipe(res)
}

/** Participant downloading their own abstract, full paper or payment proof. */
export const downloadMyFile = catchAsync(async (req, res, next) => {
  const registration = await EventRegistration.findOne({
    _id: req.params.id,
    participant: req.participant._id,
  })

  if (!registration) return next(new AppError('Registration not found', 404))

  await streamStoredFile(res, next, pickStoredFile(registration, req.params.kind))
})

/** Admin downloading any file attached to a registration. */
export const downloadRegistrationFile = catchAsync(async (req, res, next) => {
  const registration = await EventRegistration.findById(req.params.id)
  if (!registration) return next(new AppError('Registration not found', 404))
  assertEventAccess(req.user, registration.event)

  await streamStoredFile(res, next, pickStoredFile(registration, req.params.kind))
})
