// src/services/storage.service.js
import cloudinary from '../config/cloudinary.js'
import streamifier from 'streamifier'
import { AppError } from '../utils/AppError.js'
import { logger } from '../config/logger.js'

/**
 * Why Cloudinary and not GridFS / local disk:
 * - Cloudinary is already configured for this project (cover images), so no
 *   new credentials, no new bill, no new failure mode.
 * - Documents are stored with resource_type: 'raw', which keeps DOCX/PDF bytes
 *   untouched (no image transformation pipeline) and serves them over CDN.
 * - MongoDB only stores the URL + publicId, so the Atlas document stays small
 *   and the free-tier 512MB quota is not eaten by binaries.
 */

export const MIME_TO_EXTENSION = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const EXTENSION_TO_MIME = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const uploadBufferToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) return resolve(result)
      return reject(error)
    })
    streamifier.createReadStream(buffer).pipe(stream)
  })

const sanitizeBaseName = (name = '') =>
  name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'document'

/** Extension taken from the original filename, falling back to the MIME type. */
export const resolveExtension = (file) => {
  const parts = (file?.originalname || '').split('.')

  if (parts.length > 1) {
    const candidate = parts.pop().toLowerCase()
    if (/^[a-z0-9]{1,8}$/.test(candidate)) return candidate
  }

  return MIME_TO_EXTENSION[file?.mimetype] || ''
}

/** MIME type to send back when the browser downloads a stored file. */
export const resolveContentType = (storedFile) => {
  const byFormat = EXTENSION_TO_MIME[(storedFile?.format || '').toLowerCase()]
  if (byFormat) return byFormat

  const fromName = (storedFile?.originalName || '').split('.').pop()?.toLowerCase()
  return EXTENSION_TO_MIME[fromName] || 'application/octet-stream'
}

/**
 * Uploads a multer memory-storage file and returns the shape stored in
 * EventRegistration.abstractFile / fullPaperFile / payments[].proofFile.
 *
 * IMPORTANT: for resource_type 'raw' the extension must be part of the
 * public_id, otherwise the delivery URL has no extension and the browser saves
 * an extensionless blob that Windows/macOS cannot associate with Word or a PDF
 * reader. Images are different — Cloudinary appends the format itself, so
 * adding it here would produce "file.jpg.jpg".
 */
export const uploadDocument = async (file, { folder, publicIdHint } = {}) => {
  if (!file?.buffer) throw new AppError('No file uploaded', 400)

  const isImage = file.mimetype?.startsWith('image/')
  const resourceType = isImage ? 'image' : 'raw'
  const extension = resolveExtension(file)

  const baseId = `${publicIdHint ? `${publicIdHint}-` : ''}${sanitizeBaseName(file.originalname)}-${Date.now()}`

  const options = {
    folder: folder || 'dealings/registrations/documents',
    resource_type: resourceType,
    public_id: isImage || !extension ? baseId : `${baseId}.${extension}`,
    use_filename: false,
    unique_filename: false,
    overwrite: false,
  }

  if (isImage) {
    options.transformation = [{ quality: 'auto', fetch_format: 'auto' }, { width: 1600, crop: 'limit' }]
  }

  let result
  try {
    result = await uploadBufferToCloudinary(file.buffer, options)
  } catch (error) {
    // Cloudinary rejections (quota, blocked media type, bad credentials) would
    // otherwise surface as a bare 500. Log the detail, tell the user something
    // actionable.
    logger.error(
      `Cloudinary upload failed for "${file.originalname}" (${resourceType}): ${error?.message || error}`
    )
    throw new AppError(
      `Upload to storage failed for "${file.originalname}". ${error?.message || 'Please try again.'}`,
      502
    )
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType,
    originalName: file.originalname || '',
    format: result.format || extension || '',
    bytes: result.bytes || file.size || 0,
    uploadedAt: new Date(),
  }
}

export const destroyDocument = async (storedFile) => {
  if (!storedFile?.publicId) return
  try {
    await cloudinary.uploader.destroy(storedFile.publicId, {
      resource_type: storedFile.resourceType || 'raw',
    })
  } catch (error) {
    logger.warn(`Failed to destroy Cloudinary asset ${storedFile.publicId}: ${error.message}`)
  }
}

export { uploadBufferToCloudinary }
