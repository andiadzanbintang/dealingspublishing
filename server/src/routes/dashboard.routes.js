// src/routes/dashboard.routes.js
import { Router } from 'express'
import * as ctrl from '../controllers/dashboard.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect, restrictTo('superadmin', 'editor'))

router.get('/stats', ctrl.getStats)
router.get('/activity', ctrl.getRecentActivity)
router.get('/popular-journals', ctrl.getPopularJournals)
router.get('/journals-by-topic', ctrl.getJournalsByTopic)
router.get('/analytics', ctrl.getAnalytics)

export default router