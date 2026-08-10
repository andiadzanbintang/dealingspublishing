// src/controllers/reviewer.controller.js
import mongoose from 'mongoose'
import User from '../models/User.js'
import Event from '../models/Event.js'
import EventRegistration from '../models/EventRegistration.js'
import ActivityLog from '../models/ActivityLog.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { sendReviewerAccountEmail } from '../services/registrationEmail.service.js'

/**
 * Reviewer accounts are ordinary User documents with role 'reviewer' and a list
 * of events they are allowed to work on. Only a superadmin can create or change
 * them — an editor managing content should not be able to mint credentials.
 *
 * The account itself is the source of truth (one person, one login, many
 * events). The Event form offers the same assignment from the other direction
 * as a convenience, but both write to this same field.
 */

const publicReviewer = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  assignedEvents: user.assignedEvents,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
})

const normalizeEventIds = async (ids) => {
  if (!Array.isArray(ids)) return []

  const valid = ids.filter((id) => mongoose.isValidObjectId(id))
  if (valid.length === 0) return []

  const found = await Event.find({ _id: { $in: valid } }).select('_id')
  return found.map((event) => event._id)
}

// ═══════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════
export const listReviewers = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query

  const filter = { role: 'reviewer' }
  if (query.q) {
    const regex = new RegExp(query.q, 'i')
    filter.$or = [{ name: regex }, { email: regex }]
  }
  if (query.event && mongoose.isValidObjectId(query.event)) {
    filter.assignedEvents = query.event
  }

  const reviewers = await User.find(filter)
    .populate('assignedEvents', 'title slug eventDate')
    .sort('-createdAt')

  // How much work is waiting in each reviewer's events
  const withWorkload = await Promise.all(
    reviewers.map(async (reviewer) => {
      const eventIds = (reviewer.assignedEvents || []).map((event) => event._id)

      const [awaitingReview, pendingPayment] = eventIds.length
        ? await Promise.all([
            EventRegistration.countDocuments({
              event: { $in: eventIds },
              submissionStatus: 'submitted',
            }),
            EventRegistration.countDocuments({
              event: { $in: eventIds },
              paymentStatus: 'pending',
            }),
          ])
        : [0, 0]

      return { ...publicReviewer(reviewer), awaitingReview, pendingPayment }
    })
  )

  res.status(200).json({
    status: 'success',
    results: withWorkload.length,
    data: withWorkload,
  })
})

// ═══════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════
export const createReviewer = catchAsync(async (req, res, next) => {
  const { name, email, password, assignedEvents = [], sendEmail = false } = req.body || {}

  if (!String(name || '').trim()) return next(new AppError('Name is required', 400))
  if (!String(email || '').trim()) return next(new AppError('Email is required', 400))
  if (String(password || '').length < 6) {
    return next(new AppError('Password must be at least 6 characters', 400))
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  const existing = await User.findOne({ email: normalizedEmail })
  if (existing) {
    return next(new AppError('An account with this email already exists.', 409))
  }

  const events = await normalizeEventIds(assignedEvents)

  const reviewer = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password,
    role: 'reviewer',
    assignedEvents: events,
    isActive: true,
    createdBy: req.user._id,
  })

  await ActivityLog.log({
    userId: req.user._id,
    action: 'CREATE',
    entity: 'reviewer',
    entityId: reviewer._id,
    details: `Created reviewer account: ${reviewer.email}`,
    ipAddress: req.ip,
  })

  if (sendEmail) {
    const assigned = await Event.find({ _id: { $in: events } }).select('title')
    sendReviewerAccountEmail(reviewer, password, assigned).catch(() => {})
  }

  const populated = await reviewer.populate('assignedEvents', 'title slug eventDate')

  res.status(201).json({ status: 'success', data: publicReviewer(populated) })
})

// ═══════════════════════════════════════════════════════════
// UPDATE (name, assignment, active state)
// ═══════════════════════════════════════════════════════════
export const updateReviewer = catchAsync(async (req, res, next) => {
  const reviewer = await User.findOne({ _id: req.params.id, role: 'reviewer' })
  if (!reviewer) return next(new AppError('Reviewer not found', 404))

  const { name, assignedEvents, isActive } = req.body || {}

  if (name !== undefined) reviewer.name = String(name).trim()
  if (isActive !== undefined) reviewer.isActive = Boolean(isActive)
  if (assignedEvents !== undefined) {
    reviewer.assignedEvents = await normalizeEventIds(assignedEvents)
  }

  // Revoking access should also end the current session
  if (isActive === false) reviewer.refreshToken = null

  await reviewer.save({ validateBeforeSave: false })

  await ActivityLog.log({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'reviewer',
    entityId: reviewer._id,
    details: `Updated reviewer: ${reviewer.email}`,
    ipAddress: req.ip,
  })

  const populated = await reviewer.populate('assignedEvents', 'title slug eventDate')
  res.status(200).json({ status: 'success', data: publicReviewer(populated) })
})

// ═══════════════════════════════════════════════════════════
// RESET PASSWORD
// ═══════════════════════════════════════════════════════════
export const resetReviewerPassword = catchAsync(async (req, res, next) => {
  const { password, sendEmail = false } = req.body || {}

  if (String(password || '').length < 6) {
    return next(new AppError('Password must be at least 6 characters', 400))
  }

  const reviewer = await User.findOne({ _id: req.params.id, role: 'reviewer' }).select('+password')
  if (!reviewer) return next(new AppError('Reviewer not found', 404))

  reviewer.password = password
  reviewer.refreshToken = null // force a fresh sign-in
  await reviewer.save()

  await ActivityLog.log({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'reviewer',
    entityId: reviewer._id,
    details: `Reset password for reviewer: ${reviewer.email}`,
    ipAddress: req.ip,
  })

  if (sendEmail) {
    const assigned = await Event.find({ _id: { $in: reviewer.assignedEvents } }).select('title')
    sendReviewerAccountEmail(reviewer, password, assigned).catch(() => {})
  }

  res.status(200).json({ status: 'success', message: 'Password updated' })
})

// ═══════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════
export const deleteReviewer = catchAsync(async (req, res, next) => {
  const reviewer = await User.findOneAndDelete({ _id: req.params.id, role: 'reviewer' })
  if (!reviewer) return next(new AppError('Reviewer not found', 404))

  await ActivityLog.log({
    userId: req.user._id,
    action: 'DELETE',
    entity: 'reviewer',
    entityId: reviewer._id,
    details: `Deleted reviewer account: ${reviewer.email}`,
    ipAddress: req.ip,
  })

  res.status(200).json({ status: 'success', message: 'Reviewer deleted' })
})

// ═══════════════════════════════════════════════════════════
// EVENT-SIDE ASSIGNMENT (used by the Event form)
// ═══════════════════════════════════════════════════════════
export const setEventReviewers = catchAsync(async (req, res, next) => {
  const { eventId } = req.params
  const { reviewerIds = [] } = req.body || {}

  if (!mongoose.isValidObjectId(eventId)) {
    return next(new AppError('Invalid event id', 400))
  }

  const event = await Event.findById(eventId)
  if (!event) return next(new AppError('Event not found', 404))

  const valid = reviewerIds.filter((id) => mongoose.isValidObjectId(id))

  // Add the event to everyone selected, remove it from everyone else
  await User.updateMany(
    { role: 'reviewer', _id: { $in: valid } },
    { $addToSet: { assignedEvents: event._id } }
  )
  await User.updateMany(
    { role: 'reviewer', _id: { $nin: valid } },
    { $pull: { assignedEvents: event._id } }
  )

  const reviewers = await User.find({ role: 'reviewer', assignedEvents: event._id })
    .populate('assignedEvents', 'title slug')
    .sort('name')

  await ActivityLog.log({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'event',
    entityId: event._id,
    details: `Updated reviewer assignment for: ${event.title}`,
    ipAddress: req.ip,
  })

  res.status(200).json({
    status: 'success',
    data: reviewers.map(publicReviewer),
  })
})

// ═══════════════════════════════════════════════════════════
// REVIEWER SELF — the events I am responsible for
// ═══════════════════════════════════════════════════════════
export const getMyAssignedEvents = catchAsync(async (req, res) => {
  const eventIds =
    req.user.role === 'reviewer'
      ? req.user.assignedEvents || []
      : (await Event.find().select('_id')).map((event) => event._id)

  const events = await Event.find({ _id: { $in: eventIds } })
    .select('title slug eventDate endDate location locationType coverImage isPublished registration.enabled')
    .sort('-eventDate')

  const withCounts = await Promise.all(
    events.map(async (event) => {
      const [total, awaitingReview, pendingPayment, confirmed] = await Promise.all([
        EventRegistration.countDocuments({ event: event._id }),
        EventRegistration.countDocuments({ event: event._id, submissionStatus: 'submitted' }),
        EventRegistration.countDocuments({ event: event._id, paymentStatus: 'pending' }),
        EventRegistration.countDocuments({ event: event._id, paymentStatus: 'confirmed' }),
      ])

      return {
        _id: event._id,
        title: event.title,
        slug: event.slug,
        eventDate: event.eventDate,
        endDate: event.endDate,
        location: event.location,
        locationType: event.locationType,
        coverImage: event.coverImage,
        isPublished: event.isPublished,
        registrationEnabled: Boolean(event.registration?.enabled),
        counts: { total, awaitingReview, pendingPayment, confirmed },
      }
    })
  )

  res.status(200).json({ status: 'success', results: withCounts.length, data: withCounts })
})
