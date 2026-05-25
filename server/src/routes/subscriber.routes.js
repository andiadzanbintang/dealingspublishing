// src/routes/subscriber.routes.js
import { Router } from 'express'
import * as ctrl from '../controllers/subscriber.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import { subscribeSchema } from '../validators/subscriber.validator.js'

const router = Router()

// Public
router.post('/subscribe', validate(subscribeSchema), ctrl.subscribe) 
router.get('/verify', ctrl.verify)
router.get('/unsubscribe', ctrl.unsubscribe)

// Admin
router.use(protect, restrictTo('superadmin'))
router.get('/', ctrl.getAllAdmin)
router.get('/stats', ctrl.getStats)
router.delete('/:id', ctrl.remove)
router.post('/newsletter', ctrl.sendNewsletter)

export default router