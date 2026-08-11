// src/routes/email.routes.js
import { Router } from 'express'
import * as ctrl from '../controllers/email.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'

const router = Router()

// Configuration and delivery testing exposes the SMTP setup, so superadmin only.
router.use(protect, restrictTo('superadmin'))

router.get('/health', ctrl.getEmailHealth)
router.post('/test', ctrl.sendTest)

export default router
