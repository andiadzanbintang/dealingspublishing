// src/controllers/subscriber.controller.js
import Subscriber from '../models/Subscriber.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { sendVerificationEmail, sendNewsletterEmail } from '../services/email.service.js'

// ═══ PUBLIC ═══

export const subscribe = catchAsync(async (req, res, next) => {
  
  const { email, name } = req.validatedBody

  // Check if already subscribed
  const existing = await Subscriber.findOne({ email })

  if (existing) {
    if (existing.status === 'active' && existing.isVerified) {
      return res.status(200).json({
        status: 'success',
        message: 'You are already subscribed!',
      })
    }

    // Re-send verification if not verified
    if (!existing.isVerified) {
      const emailSent = await sendVerificationEmail(email, existing.verificationToken)

      if (!emailSent) {
        return next(
          new AppError(
            'Subscription exists, but verification email could not be sent. Please try again later.',
            502
          )
        )
      }

      return res.status(200).json({
        status: 'success',
        message: 'Verification email resent. Please check your inbox.',
      })
    }

    // Resubscribe if previously unsubscribed
    existing.status = 'active'
    existing.unsubscribedAt = null
    await existing.save()

    const emailSent = await sendVerificationEmail(email, existing.verificationToken)

    if (!emailSent) {
      return next(
        new AppError(
          'You have been resubscribed, but verification email could not be sent. Please try again later.',
          502
        )
      )
    }

    return res.status(200).json({
      status: 'success',
      message: 'Welcome back! You have been resubscribed.',
    })
  }

  const subscriber = await Subscriber.create({ email, name })
  const emailSent = await sendVerificationEmail(email, subscriber.verificationToken)

  if (!emailSent) {
    await Subscriber.findByIdAndDelete(subscriber._id)

    return next(
      new AppError(
        'Subscription could not be completed because the verification email failed to send. Please try again later.',
        502
      )
    )
  }

  res.status(201).json({
    status: 'success',
    message: 'Subscribed! Please check your email to verify.',
  })
})

export const verify = catchAsync(async (req, res, next) => {
  const query = req.sanitizedQuery || req.query
  const { token } = query

  if (!token) return next(new AppError('Verification token is required', 400))

  const subscriber = await Subscriber.findOne({ verificationToken: token })

  if (!subscriber) return next(new AppError('Invalid or expired verification token', 400))

  subscriber.isVerified = true
  subscriber.verificationToken = null
  await subscriber.save()

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully! You are now subscribed.',
  })
})

export const unsubscribe = catchAsync(async (req, res, next) => {
  const query = req.sanitizedQuery || req.query
  const { token } = query

  if (!token) return next(new AppError('Unsubscribe token is required', 400))

  const subscriber = await Subscriber.findOne({ unsubscribeToken: token })

  if (!subscriber) return next(new AppError('Invalid unsubscribe token', 400))

  subscriber.status = 'unsubscribed'
  subscriber.unsubscribedAt = new Date()
  await subscriber.save()

  res.status(200).json({
    status: 'success',
    message: 'You have been unsubscribed.',
  })
})

// ═══ ADMIN ═══

export const getAllAdmin = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query
  const page = parseInt(query.page, 10) || 1
  const limit = parseInt(query.limit, 10) || 20
  const skip = (page - 1) * limit

  const filter = {}
  if (query.status) filter.status = query.status
  if (query.q) {
    filter.$or = [
      { email: new RegExp(query.q, 'i') },
      { name: new RegExp(query.q, 'i') },
    ]
  }

  const total = await Subscriber.countDocuments(filter)
  const subscribers = await Subscriber.find(filter)
    .sort('-subscribedAt')
    .skip(skip)
    .limit(limit)

  res.status(200).json({
    status: 'success',
    results: subscribers.length,
    total,
    page,
    data: subscribers,
  })
})

export const getStats = catchAsync(async (req, res) => {
  const [total, active, unsubscribed, unverified] = await Promise.all([
    Subscriber.countDocuments(),
    Subscriber.countDocuments({ status: 'active', isVerified: true }),
    Subscriber.countDocuments({ status: 'unsubscribed' }),
    Subscriber.countDocuments({ isVerified: false }),
  ])

  res.status(200).json({
    status: 'success',
    data: { total, active, unsubscribed, unverified },
  })
})

export const remove = catchAsync(async (req, res, next) => {
  const subscriber = await Subscriber.findByIdAndDelete(req.params.id)
  if (!subscriber) return next(new AppError('Subscriber not found', 404))

  res.status(200).json({ status: 'success', message: 'Subscriber removed' })
})

export const sendNewsletter = catchAsync(async (req, res, next) => {
  const { subject, content } = req.body

  if (!subject || !content) {
    return next(new AppError('Subject and content are required', 400))
  }

  const subscribers = await Subscriber.find({ status: 'active', isVerified: true })

  let sent = 0
  let failed = 0

  for (const sub of subscribers) {
    const success = await sendNewsletterEmail(sub.email, subject, content, sub.unsubscribeToken)
    if (success) sent++
    else failed++
  }

  res.status(200).json({
    status: 'success',
    message: `Newsletter sent to ${sent} subscribers. ${failed} failed.`,
    data: { sent, failed, total: subscribers.length },
  })
})