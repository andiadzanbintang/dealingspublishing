// src/routes/topic.routes.js
import { Router } from 'express'
import * as ctrl from '../controllers/topic.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import { createTopicSchema, updateTopicSchema } from '../validators/topic.validator.js'

const router = Router()

// Public
router.get('/public', ctrl.getAllPublic)
router.get('/public/:slug/journals', ctrl.getTopicJournals)

// Admin
router.use(protect, restrictTo('superadmin', 'editor'))
router.get('/', ctrl.getAllAdmin)
router.post('/', validate(createTopicSchema), ctrl.create)
router.put('/:id', validate(updateTopicSchema), ctrl.update)
router.delete('/:id', restrictTo('superadmin'), ctrl.remove)

export default router