// src/routes/ai.routes.js
import { Router } from 'express'
import * as ctrl from '../controllers/ai.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'
import { aiLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// Public (rate limited)
router.post('/chat', aiLimiter, ctrl.chatWithAI)
router.get('/conversation/:sessionId', ctrl.getConversation)

// Admin
router.post('/reindex', protect, restrictTo('superadmin'), ctrl.reindex)

export default router 