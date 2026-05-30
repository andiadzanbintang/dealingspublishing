import { Router } from 'express'
import * as ctrl from '../controllers/partnership.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import {
  createPartnershipSchema,
  updatePartnershipSchema,
} from '../validators/partnership.validator.js'

const router = Router()

// Public
router.get('/public', ctrl.getAllPublic)

// Admin
router.use(protect)

router.get('/', restrictTo('superadmin', 'editor'), ctrl.getAllAdmin)
router.get('/:id', restrictTo('superadmin', 'editor'), ctrl.getById)

router.post(
  '/',
  restrictTo('superadmin', 'editor'),
  validate(createPartnershipSchema),
  ctrl.create
)

router.put(
  '/:id',
  restrictTo('superadmin', 'editor'),
  validate(updatePartnershipSchema),
  ctrl.update
)

router.delete('/:id', restrictTo('superadmin'), ctrl.remove)

router.patch(
  '/:id/publish',
  restrictTo('superadmin', 'editor'),
  ctrl.togglePublish
)

export default router