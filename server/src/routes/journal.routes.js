// src/routes/journal.routes.js
import { Router } from 'express'
import * as ctrl from '../controllers/journal.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import { createJournalSchema, updateJournalSchema } from '../validators/journal.validator.js'

const router = Router()

// Public
router.get('/public', ctrl.getAllPublic)
router.get('/featured', ctrl.getFeatured)
router.get('/search', ctrl.searchJournals)
router.get('/public/:slug', ctrl.getBySlug)

// Admin
router.use(protect)
router.get('/', restrictTo('superadmin', 'editor'), ctrl.getAllAdmin)
router.get('/:id', restrictTo('superadmin', 'editor'), ctrl.getById)
router.post('/', restrictTo('superadmin', 'editor'), validate(createJournalSchema), ctrl.create)
router.put('/:id', restrictTo('superadmin', 'editor'), validate(updateJournalSchema), ctrl.update)
router.delete('/:id', restrictTo('superadmin'), ctrl.remove)
router.patch('/:id/featured', restrictTo('superadmin', 'editor'), ctrl.toggleFeatured)
router.patch('/:id/status', restrictTo('superadmin', 'editor'), ctrl.toggleStatus)

export default router