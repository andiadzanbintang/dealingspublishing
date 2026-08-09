// src/middleware/participantAuth.middleware.js
import jwt from 'jsonwebtoken'
import Participant from '../models/Participant.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { getRedis } from '../config/redis.js'

/**
 * Participant tokens are signed with the same secret as admin tokens but carry
 * `type: 'participant'`, so an admin token can never authenticate as a
 * participant and vice versa.
 */
export const protectParticipant = catchAsync(async (req, res, next) => {
  let token = null

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new AppError('Not authenticated. Please log in.', 401))
  }

  const redis = getRedis()
  if (redis) {
    const isBlacklisted = await redis.get(`bl_${token}`)
    if (isBlacklisted) {
      return next(new AppError('Session expired. Please log in again.', 401))
    }
  }

  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)

  if (decoded.type !== 'participant') {
    return next(new AppError('Invalid token for this resource.', 401))
  }

  const participant = await Participant.findById(decoded.id)
  if (!participant || !participant.isActive) {
    return next(new AppError('Account no longer available.', 401))
  }

  req.participant = participant
  next()
})

/** Attaches req.participant when a valid token is present, but never blocks. */
export const optionalParticipant = catchAsync(async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer')) return next()

  try {
    const token = req.headers.authorization.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    if (decoded.type === 'participant') {
      req.participant = await Participant.findById(decoded.id)
    }
  } catch {
    // Ignore — this route works fine for anonymous visitors
  }

  next()
})
