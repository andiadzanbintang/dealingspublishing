// src/middleware/uploadDocument.js
import multer from 'multer'
import { AppError } from '../utils/AppError.js'

const MB = 1024 * 1024

/**
 * Accepted uploads are decided by FILE EXTENSION, with the MIME type used only
 * as a fallback for files that have no extension at all.
 *
 * Why not trust the MIME type: the browser reports whatever content type the
 * operating system has registered for that extension, and that registration
 * belongs to whichever application claimed the file type last. WPS Office,
 * Foxit and older Acrobat installs all register ".pdf" with a non-standard type
 * such as "application/x-pdf" or "applications/vnd.pdf", and some setups send
 * "application/octet-stream" with no real type at all. A MIME-only filter
 * therefore rejects perfectly valid PDFs on those machines while .docx keeps
 * working, because the OOXML type is rarely hijacked.
 *
 * Why the extension is safe to trust here: the files are never executed. They
 * are stored as opaque bytes and served back with a Content-Type this server
 * chooses, so a mislabelled upload is inert.
 */
const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx']
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

const DOCUMENT_MIME_TYPES = [
  // PDF, including the aliases various desktop apps register
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'applications/vnd.pdf',
  'text/pdf',
  'text/x-pdf',
  // Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/x-msword',
  'application/doc',
  'application/vnd.ms-word',
]

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const PROOF_EXTENSIONS = [...DOCUMENT_EXTENSIONS, ...IMAGE_EXTENSIONS]
const PROOF_MIME_TYPES = [...DOCUMENT_MIME_TYPES, ...IMAGE_MIME_TYPES]

const extensionOf = (filename = '') => {
  const parts = String(filename).split('.')
  if (parts.length < 2) return ''
  const candidate = parts.pop().toLowerCase()
  return /^[a-z0-9]{1,8}$/.test(candidate) ? candidate : ''
}

const buildFilter = (extensions, mimeTypes, humanList) => (req, file, cb) => {
  const extension = extensionOf(file.originalname)
  const mimetype = (file.mimetype || '').toLowerCase()

  const reject = () =>
    cb(
      new AppError(
        `"${file.originalname}" is not an accepted file type. Please upload ${humanList}.`,
        400
      ),
      false
    )

  // A file that has an extension is judged on that extension alone. This is
  // what makes a .pdf work no matter what MIME the desktop reports — and it is
  // also what keeps a .exe out even when it arrives as octet-stream.
  if (extension) {
    return extensions.includes(extension) ? cb(null, true) : reject()
  }

  // No extension at all: fall back to a genuinely specific MIME type.
  return mimeTypes.includes(mimetype) ? cb(null, true) : reject()
}

/** Abstract / full paper — Microsoft Word or PDF only. */
export const uploadManuscript = multer({
  storage: multer.memoryStorage(),
  fileFilter: buildFilter(DOCUMENT_EXTENSIONS, DOCUMENT_MIME_TYPES, 'a PDF, DOC or DOCX file'),
  limits: { fileSize: 25 * MB },
})

/** Payment proof — screenshot or PDF receipt. */
export const uploadPaymentProof = multer({
  storage: multer.memoryStorage(),
  fileFilter: buildFilter(
    PROOF_EXTENSIONS,
    PROOF_MIME_TYPES,
    'a JPG, PNG, WEBP or PDF file'
  ),
  limits: { fileSize: 10 * MB },
})

/**
 * Multer reports its own failures (size limits, unexpected fields) through the
 * callback with a MulterError, which never reaches AppError and so surfaces to
 * the participant as a bare 500 "Something went wrong". This wrapper turns them
 * into readable 400s.
 */
export const withUploadErrors = (middleware) => (req, res, next) =>
  middleware(req, res, (error) => {
    if (!error) return next()

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError(
            'That file is too large. Please upload a smaller file, or compress it first.',
            400
          )
        )
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(
          new AppError(`Unexpected upload field "${error.field}". Please try again.`, 400)
        )
      }

      return next(new AppError(`Upload failed: ${error.message}`, 400))
    }

    return next(error)
  })

export {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_MIME_TYPES,
  IMAGE_EXTENSIONS,
  IMAGE_MIME_TYPES,
  PROOF_EXTENSIONS,
  PROOF_MIME_TYPES,
  MB,
}
