// src/config/redis.js
import Redis from 'ioredis'
import { logger } from './logger.js'

let redis = null

export const connectRedis = () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis: Max retries reached, running without cache')
          return null
        }
        return Math.min(times * 200, 2000)
      },
    })

    redis.on('connect', () => logger.info('Redis connected'))
    redis.on('error', (err) => logger.warn(`Redis error: ${err.message}`))

    return redis
  } catch (error) {
    logger.warn(`Redis init failed: ${error.message}. Running without cache.`)
    return null
  }
}

export const getRedis = () => redis

// Cache helpers
export const cacheGet = async (key) => {
  if (!redis) return null
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export const cacheSet = async (key, data, ttlSeconds = 300) => {
  if (!redis) return
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds)
  } catch {
    // Silently fail
  }
}

export const cacheDel = async (pattern) => {
  if (!redis) return
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  } catch {
    // Silently fail
  }
}