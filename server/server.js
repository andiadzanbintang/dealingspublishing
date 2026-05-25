// server.js
import dotenv from 'dotenv'
dotenv.config()

import app from './src/app.js'
import { connectDB } from './src/config/db.js'
import { connectRedis } from './src/config/redis.js'
import { connectCloudinary } from './src/config/cloudinary.js'
import { initAI } from './src/services/ai.service.js'
import { logger } from './src/config/logger.js'

const PORT = process.env.PORT || 5000

const startServer = async () => {
  // Connect to services
  await connectDB()
  connectRedis()
  connectCloudinary()
  initAI()

  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
  })
}

startServer().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`)
  process.exit(1)
})

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`)
  process.exit(1)
}) 