// src/controllers/auth.controller.js
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { getRedis } from '../config/redis.js'

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  })
}

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  })
}

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
}

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.validatedBody

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401))
  }

  const accessToken = generateAccessToken(user._id)
  const refreshToken = generateRefreshToken(user._id)

  // Store refresh token in DB
  user.refreshToken = refreshToken
  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  // Set refresh token cookie
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS)

  // Log activity
  await ActivityLog.log({
    userId: user._id,
    action: 'LOGIN',
    entity: 'auth',
    details: `User logged in`,
    ipAddress: req.ip,
  })

  res.status(200).json({
    status: 'success',
    data: {
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    },
  })
})

export const refresh = catchAsync(async (req, res, next) => {
  const token = req.cookies?.refreshToken

  if (!token) {
    return next(new AppError('No refresh token', 401))
  }

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
  const user = await User.findById(decoded.id).select('+refreshToken')

  if (!user || user.refreshToken !== token) {
    return next(new AppError('Invalid refresh token', 401))
  }

  const accessToken = generateAccessToken(user._id)
  const newRefreshToken = generateRefreshToken(user._id)

  user.refreshToken = newRefreshToken
  await user.save({ validateBeforeSave: false })

  res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS)

  res.status(200).json({
    status: 'success',
    data: { accessToken },
  })
})

export const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken

  if (token) {
    // Blacklist the access token in Redis
    const redis = getRedis()
    if (redis) {
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith('Bearer')) {
        const accessToken = authHeader.split(' ')[1]
        await redis.set(`bl_${accessToken}`, '1', 'EX', 900) // 15 min
      }
    }

    // Clear refresh token from DB
    await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: null })
  }

  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS)

  res.status(200).json({
    status: 'success',
    message: 'Logged out',
  })
})

export const getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: req.user,
  })
})