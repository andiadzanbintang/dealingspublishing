// /server/src/routes/event.routes.js
import { Router } from 'express'
import * as ctrl from '../controllers/event.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import { createEventSchema, updateEventSchema } from '../validators/event.validator.js'

const router = Router()

// Public
router.get('/public', ctrl.getAllPublic)
router.get('/upcoming', ctrl.getUpcoming)
router.get('/public/:slug', ctrl.getBySlug)

// Admin
router.use(protect)
router.get('/', restrictTo('superadmin', 'editor'), ctrl.getAllAdmin)
router.get('/:id', restrictTo('superadmin', 'editor'), ctrl.getById)
router.post('/', restrictTo('superadmin', 'editor'), validate(createEventSchema), ctrl.create)
router.put('/:id', restrictTo('superadmin', 'editor'), validate(updateEventSchema), ctrl.update)
router.delete('/:id', restrictTo('superadmin'), ctrl.remove)
router.patch('/:id/publish', restrictTo('superadmin', 'editor'), ctrl.togglePublish)
router.patch('/:id/featured', restrictTo('superadmin', 'editor'), ctrl.toggleFeatured)

export default router