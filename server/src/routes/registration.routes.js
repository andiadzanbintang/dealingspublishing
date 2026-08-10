// src/routes/registration.routes.js
import { Router } from 'express'
import * as ctrl from '../controllers/registration.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'
import {
  protectParticipant,
  optionalParticipant,
} from '../middleware/participantAuth.middleware.js'
import {
  uploadManuscript,
  uploadPaymentProof,
  withUploadErrors,
} from '../middleware/uploadDocument.js'

const router = Router()

// ═══════════════════════════════════════════════════════════
// PUBLIC — what the registration form for an event looks like
// (accepts an event id or slug; adds `myRegistration` when logged in)
// ═══════════════════════════════════════════════════════════
router.get('/events/:eventIdOrSlug/config', optionalParticipant, ctrl.getEventRegistrationConfig)

// ═══════════════════════════════════════════════════════════
// PARTICIPANT
// ═══════════════════════════════════════════════════════════
router.post(
  '/events/:eventIdOrSlug',
  protectParticipant,
  withUploadErrors(uploadManuscript.single('abstractFile')),
  ctrl.submitRegistration
)

router.get('/me', protectParticipant, ctrl.getMyRegistrations)
router.get('/me/:id', protectParticipant, ctrl.getMyRegistration)

// kind: 'abstract' | 'full-paper' | 'payment-<index>'
router.get('/me/:id/download/:kind', protectParticipant, ctrl.downloadMyFile)

router.post(
  '/me/:id/payment',
  protectParticipant,
  withUploadErrors(uploadPaymentProof.single('proofFile')),
  ctrl.submitPayment
)

router.post(
  '/me/:id/full-paper',
  protectParticipant,
  withUploadErrors(uploadManuscript.single('fullPaperFile')),
  ctrl.uploadFullPaper
)

// ═══════════════════════════════════════════════════════════
// ADMIN — superadmin and editor see everything;
// reviewers are scoped to their assigned events inside the controller.
// ═══════════════════════════════════════════════════════════
router.use(protect, restrictTo('superadmin', 'editor', 'reviewer'))

router.get('/', ctrl.listRegistrations)
router.get('/stats', ctrl.getRegistrationStats)
router.get('/recap', ctrl.getRecap)
router.get('/:id', ctrl.getRegistration)
router.get('/:id/download/:kind', ctrl.downloadRegistrationFile)
router.patch('/:id/review', ctrl.reviewRegistration)
router.patch('/:id/payment', ctrl.reviewPayment)
router.post('/:id/resend-ticket', ctrl.resendTicketEmail)

export default router
