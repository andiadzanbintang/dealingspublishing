// src/routes/upload.routes.js
import { Router } from 'express'
import * as ctrl from '../controllers/upload.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'
import { upload } from '../middleware/upload.js'

const router = Router()

router.use(protect, restrictTo('superadmin', 'editor'))

router.post('/image', upload.single('image'), ctrl.uploadImage)
router.post('/images', upload.array('images', 10), ctrl.uploadMultiple)
router.delete('/image', ctrl.deleteImage)

export default router