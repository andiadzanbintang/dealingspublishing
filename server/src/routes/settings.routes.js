// src/routes/settings.routes.js
import { Router } from 'express'
import * as ctrl from '../controllers/settings.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', ctrl.getSettings) // Public
router.put('/', protect, restrictTo('superadmin'), ctrl.updateSettings)

export default router