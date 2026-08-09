// src/middleware/uploadDocument.js
import multer from 'multer'
import { AppError } from '../utils/AppError.js'

const MB = 1024 * 1024

const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]

const PROOF_MIME_TYPES = [...DOCUMENT_MIME_TYPES, 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const buildFilter = (allowed, label) => (req, file, cb) => {
  if (allowed.includes(file.mimetype)) return cb(null, true)
  return cb(new AppError(`Invalid file type for ${label}. Allowed: ${label === 'payment proof' ? 'JPG, PNG, WEBP or PDF' : 'PDF, DOC or DOCX'}.`, 400), false)
}

/** Abstract / full paper — Microsoft Word or PDF only. */
export const uploadManuscript = multer({
  storage: multer.memoryStorage(),
  fileFilter: buildFilter(DOCUMENT_MIME_TYPES, 'manuscript'),
  limits: { fileSize: 25 * MB },
})

/** Payment proof — screenshot or PDF receipt. */
export const uploadPaymentProof = multer({
  storage: multer.memoryStorage(),
  fileFilter: buildFilter(PROOF_MIME_TYPES, 'payment proof'),
  limits: { fileSize: 10 * MB },
})

export { DOCUMENT_MIME_TYPES, PROOF_MIME_TYPES, MB }
