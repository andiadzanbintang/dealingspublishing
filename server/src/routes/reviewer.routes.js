// src/routes/reviewer.routes.js
import { Router } from 'express'
import * as ctrl from '../controllers/reviewer.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

// Any signed-in admin account can ask which events it is responsible for.
// Superadmin and editor get every event; a reviewer gets only their assignment.
router.get('/me/events', restrictTo('superadmin', 'editor', 'reviewer'), ctrl.getMyAssignedEvents)

// Account management is superadmin only — an editor manages content, not credentials.
router.use(restrictTo('superadmin'))

router.get('/', ctrl.listReviewers)
router.post('/', ctrl.createReviewer)
router.put('/:id', ctrl.updateReviewer)
router.patch('/:id/password', ctrl.resetReviewerPassword)
router.delete('/:id', ctrl.deleteReviewer)

// Assignment from the Event form side
router.patch('/event/:eventId', ctrl.setEventReviewers)

export default router
