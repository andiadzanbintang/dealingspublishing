// src/routes/auth.routes.js
import { Router } from 'express'
import { login, refresh, logout, getMe } from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import { loginSchema } from '../validators/auth.validator.js'
import { authLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/refresh', refresh)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)

export default router 