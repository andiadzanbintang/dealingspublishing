// src/app.js
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import hpp from 'hpp'
import { sanitizeRequest } from './middleware/sanitize.js'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

import routes from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { globalLimiter } from './middleware/rateLimiter.js'
import { AppError } from './utils/AppError.js'

const app = express()

// ═══ GLOBAL MIDDLEWARE ═══

// CORS
app.use(
  cors({
    origin: [
      process.env.CLIENT_USER_URL || 'http://localhost:5173',
      process.env.CLIENT_ADMIN_URL || 'http://localhost:5174',
    ],
    credentials: true,
  })
)

// Security
app.use(helmet())
app.use(hpp())
app.use(sanitizeRequest)

// Rate limiting
app.use('/api', globalLimiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// ═══ ROUTES ═══

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ResearchHub API is running 🚀',
    timestamp: new Date().toISOString(),
  })
})

// API routes
app.use('/api/v1', routes)

// Ignore browser favicon request
app.get('/favicon.ico', (req, res) => {
  res.status(204).end()
})

// 404 handler
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404))
})

// Global error handler
app.use(errorHandler)

export default app