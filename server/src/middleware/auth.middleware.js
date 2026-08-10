// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { getRedis } from '../config/redis.js'

export const protect = catchAsync(async (req, res, next) => {
  let token = null

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new AppError('Not authenticated. Please log in.', 401))
  }

  // Check if token is blacklisted
  const redis = getRedis()
  if (redis) {
    const isBlacklisted = await redis.get(`bl_${token}`)
    if (isBlacklisted) {
      return next(new AppError('Token has been invalidated. Please log in again.', 401))
    }
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)

  // Check if user still exists
  const user = await User.findById(decoded.id).select('-password')
  if (!user) {
    return next(new AppError('User no longer exists.', 401))
  }

  // A superadmin can deactivate a reviewer; that must end their session too
  if (user.isActive === false) {
    return next(new AppError('This account has been deactivated.', 403))
  }

  req.user = user
  next()
})

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403))
    }
    next()
  }
}