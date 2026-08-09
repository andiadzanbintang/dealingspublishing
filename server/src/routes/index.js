// src/routes/index.js
import { Router } from 'express'
import authRoutes from './auth.routes.js'
import journalRoutes from './journal.routes.js'
import topicRoutes from './topic.routes.js'
import newsRoutes from './news.routes.js'
import eventRoutes from './event.routes.js'
import subscriberRoutes from './subscriber.routes.js'
import uploadRoutes from './upload.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import settingsRoutes from './settings.routes.js'
import aiRoutes from './ai.routes.js'
import bookRoutes from './book.routes.js'
import partnershipRoutes from './partnership.routes.js'
import participantRoutes from './participant.routes.js'
import registrationRoutes from './registration.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/journals', journalRoutes)
router.use('/topics', topicRoutes)
router.use('/news', newsRoutes)
router.use('/events', eventRoutes)
router.use('/books', bookRoutes)
router.use('/subscribers', subscriberRoutes)
router.use('/upload', uploadRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/settings', settingsRoutes)
router.use('/ai', aiRoutes)
router.use('/partnerships', partnershipRoutes)
router.use('/participants', participantRoutes)
router.use('/registrations', registrationRoutes)

export default router
