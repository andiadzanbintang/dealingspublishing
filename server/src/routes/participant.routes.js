// src/routes/participant.routes.js
import { Router } from 'express'
import * as ctrl from '../controllers/participant.controller.js'
import { protectParticipant } from '../middleware/participantAuth.middleware.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import {
  participantRegisterSchema,
  participantLoginSchema,
  participantUpdateSchema,
  participantPasswordSchema,
} from '../validators/participant.validator.js'

const router = Router()

// ═══ Participant auth (public) ═══
router.post('/register', authLimiter, validate(participantRegisterSchema), ctrl.register)
router.post('/login', authLimiter, validate(participantLoginSchema), ctrl.login)
router.post('/refresh', ctrl.refresh)
router.post('/logout', ctrl.logout)

// ═══ Participant self-service ═══
router.get('/me', protectParticipant, ctrl.getMe)
router.put('/me', protectParticipant, validate(participantUpdateSchema), ctrl.updateMe)
router.put('/me/password', protectParticipant, validate(participantPasswordSchema), ctrl.changePassword)

// ═══ Admin — participant directory ═══
router.use(protect, restrictTo('superadmin', 'editor'))

router.get('/', ctrl.listParticipants)
router.get('/stats', ctrl.getParticipantStats)
router.get('/:id', ctrl.getParticipantById)

export default router
