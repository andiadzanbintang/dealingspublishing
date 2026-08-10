// src/controllers/participant.controller.js
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import Participant from '../models/Participant.js'
import EventRegistration from '../models/EventRegistration.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { getRedis } from '../config/redis.js'
import { sendParticipantWelcomeEmail } from '../services/registrationEmail.service.js'

const generateAccessToken = (id) =>
  jwt.sign({ id, type: 'participant' }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  })

const generateRefreshToken = (id) =>
  jwt.sign({ id, type: 'participant' }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  })

// Distinct cookie name so an admin session and a participant session can
// coexist in one browser (they share `localhost` during development).
const REFRESH_COOKIE = 'participantRefreshToken'

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
}

const publicProfile = (participant) => ({
  _id: participant._id,
  name: participant.name,
  email: participant.email,
  phone: participant.phone,
  affiliation: participant.affiliation,
  country: participant.country,
  createdAt: participant.createdAt,
})

export const register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, affiliation, country } = req.validatedBody

  const existing = await Participant.findOne({ email })
  if (existing) {
    return next(new AppError('An account with this email already exists. Please log in instead.', 409))
  }

  const participant = await Participant.create({
    name,
    email,
    password,
    phone: phone || '',
    affiliation: affiliation || '',
    country: country || '',
    lastLogin: new Date(),
  })

  const accessToken = generateAccessToken(participant._id)
  const refreshToken = generateRefreshToken(participant._id)

  participant.refreshToken = refreshToken
  await participant.save({ validateBeforeSave: false })

  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS)

  // Fire and forget — a failed welcome email must not fail the signup
  sendParticipantWelcomeEmail(participant).catch(() => {})

  res.status(201).json({
    status: 'success',
    data: { accessToken, participant: publicProfile(participant) },
  })
})

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.validatedBody

  const participant = await Participant.findOne({ email }).select('+password')
  if (!participant || !(await participant.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401))
  }

  if (!participant.isActive) {
    return next(new AppError('This account has been deactivated. Please contact the organiser.', 403))
  }

  const accessToken = generateAccessToken(participant._id)
  const refreshToken = generateRefreshToken(participant._id)

  participant.refreshToken = refreshToken
  participant.lastLogin = new Date()
  await participant.save({ validateBeforeSave: false })

  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTIONS)

  res.status(200).json({
    status: 'success',
    data: { accessToken, participant: publicProfile(participant) },
  })
})

export const refresh = catchAsync(async (req, res, next) => {
  const token = req.cookies?.[REFRESH_COOKIE]
  if (!token) return next(new AppError('No refresh token', 401))

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
  if (decoded.type !== 'participant') return next(new AppError('Invalid refresh token', 401))

  const participant = await Participant.findById(decoded.id).select('+refreshToken')
  if (!participant || participant.refreshToken !== token) {
    return next(new AppError('Invalid refresh token', 401))
  }

  const accessToken = generateAccessToken(participant._id)
  const newRefreshToken = generateRefreshToken(participant._id)

  participant.refreshToken = newRefreshToken
  await participant.save({ validateBeforeSave: false })

  res.cookie(REFRESH_COOKIE, newRefreshToken, REFRESH_COOKIE_OPTIONS)

  res.status(200).json({ status: 'success', data: { accessToken } })
})

export const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE]

  if (token) {
    const redis = getRedis()
    if (redis && req.headers.authorization?.startsWith('Bearer')) {
      const accessToken = req.headers.authorization.split(' ')[1]
      await redis.set(`bl_${accessToken}`, '1', 'EX', 900)
    }
    await Participant.findOneAndUpdate({ refreshToken: token }, { refreshToken: null })
  }

  res.clearCookie(REFRESH_COOKIE, REFRESH_COOKIE_OPTIONS)
  res.status(200).json({ status: 'success', message: 'Logged out' })
})

export const getMe = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', data: publicProfile(req.participant) })
})

export const updateMe = catchAsync(async (req, res) => {
  const updates = req.validatedBody
  const participant = req.participant

  if (updates.name !== undefined) participant.name = updates.name
  if (updates.phone !== undefined) participant.phone = updates.phone
  if (updates.affiliation !== undefined) participant.affiliation = updates.affiliation
  if (updates.country !== undefined) participant.country = updates.country

  await participant.save({ validateBeforeSave: false })

  res.status(200).json({ status: 'success', data: publicProfile(participant) })
})

export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.validatedBody

  const participant = await Participant.findById(req.participant._id).select('+password')
  if (!participant || !(await participant.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401))
  }

  participant.password = newPassword
  await participant.save()

  res.status(200).json({ status: 'success', message: 'Password updated' })
})

// ═══════════════════════════════════════════════════════════
// ADMIN — participant directory
// ═══════════════════════════════════════════════════════════

/**
 * One row per participant, enriched with everything the Users screen shows:
 * how many events they registered for, how many are paid, how much they have
 * paid in total, and when they were last active. Done as a single aggregation
 * so the list stays one round trip no matter how many participants exist.
 */
export const listParticipants = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query
  const limit = Math.min(parseInt(query.limit, 10) || 100, 500)
  const page = parseInt(query.page, 10) || 1

  const match = {}
  if (query.q) {
    const regex = new RegExp(query.q, 'i')
    match.$or = [{ name: regex }, { email: regex }, { affiliation: regex }]
  }

  const total = await Participant.countDocuments(match)

  const participants = await Participant.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: 'eventregistrations',
        localField: '_id',
        foreignField: 'participant',
        as: 'registrations',
      },
    },
    {
      $addFields: {
        registrationCount: { $size: '$registrations' },
        awaitingReviewCount: {
          $size: {
            $filter: {
              input: '$registrations',
              as: 'r',
              cond: { $eq: ['$$r.submissionStatus', 'submitted'] },
            },
          },
        },
        pendingPaymentCount: {
          $size: {
            $filter: {
              input: '$registrations',
              as: 'r',
              cond: { $eq: ['$$r.paymentStatus', 'pending'] },
            },
          },
        },
        confirmedCount: {
          $size: {
            $filter: {
              input: '$registrations',
              as: 'r',
              cond: { $eq: ['$$r.paymentStatus', 'confirmed'] },
            },
          },
        },
        totalPaidIdr: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$registrations',
                  as: 'r',
                  cond: { $eq: ['$$r.paymentStatus', 'confirmed'] },
                },
              },
              as: 'paid',
              in: { $ifNull: ['$$paid.fee.amountIdr', 0] },
            },
          },
        },
        lastActivityAt: { $max: '$registrations.updatedAt' },
      },
    },
    {
      $project: {
        password: 0,
        refreshToken: 0,
        registrations: 0,
        __v: 0,
      },
    },
  ])

  res.status(200).json({
    status: 'success',
    results: participants.length,
    total,
    page,
    data: participants,
  })
})

/** Aggregate figures for the cards at the top of the Users screen. */
export const getParticipantStats = catchAsync(async (req, res) => {
  const [totalParticipants, withRegistration] = await Promise.all([
    Participant.countDocuments(),
    EventRegistration.distinct('participant'),
  ])

  const [totals] = await EventRegistration.aggregate([
    {
      $group: {
        _id: null,
        registrations: { $sum: 1 },
        confirmed: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'confirmed'] }, 1, 0] } },
        revenueIdr: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'confirmed'] }, '$fee.amountIdr', 0] },
        },
      },
    },
  ])

  res.status(200).json({
    status: 'success',
    data: {
      totalParticipants,
      participantsWithRegistration: withRegistration.length,
      registrations: totals?.registrations || 0,
      confirmed: totals?.confirmed || 0,
      revenueIdr: totals?.revenueIdr || 0,
    },
  })
})

/** A single participant plus every event they signed up for. */
export const getParticipantById = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid participant id', 400))
  }

  const participant = await Participant.findById(req.params.id)
  if (!participant) return next(new AppError('Participant not found', 404))

  const registrations = await EventRegistration.find({ participant: participant._id })
    .populate('event', 'title slug eventDate location locationType')
    .sort('-createdAt')

  const summary = registrations.reduce(
    (acc, registration) => {
      acc.total += 1
      if (registration.submissionStatus === 'submitted') acc.awaitingReview += 1
      if (registration.submissionStatus === 'rejected') acc.needsRevision += 1
      if (registration.paymentStatus === 'pending') acc.pendingPayment += 1
      if (registration.paymentStatus === 'confirmed') {
        acc.confirmed += 1
        acc.totalPaidIdr += registration.fee?.amountIdr || 0
        acc.totalPaidUsd += registration.fee?.amountUsd || 0
      }
      return acc
    },
    {
      total: 0,
      awaitingReview: 0,
      needsRevision: 0,
      pendingPayment: 0,
      confirmed: 0,
      totalPaidIdr: 0,
      totalPaidUsd: 0,
    }
  )

  res.status(200).json({
    status: 'success',
    data: { participant, registrations, summary },
  })
})
