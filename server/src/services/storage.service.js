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

/**
 * Uploads a multer memory-storage file and returns the shape stored in
 * EventRegistration.abstractFile / fullPaperFile / payments[].proofFile.
 */
export const uploadDocument = async (file, { folder, publicIdHint } = {}) => {
  if (!file?.buffer) throw new AppError('No file uploaded', 400)

  const isImage = file.mimetype?.startsWith('image/')
  const resourceType = isImage ? 'image' : 'raw'

  const options = {
    folder: folder || 'dealings/registrations/documents',
    resource_type: resourceType,
    // Keeps the original extension in the delivery URL so browsers download
    // "abstract.pdf" instead of an extensionless blob.
    public_id: `${publicIdHint ? `${publicIdHint}-` : ''}${sanitizeBaseName(file.originalname)}-${Date.now()}`,
    use_filename: false,
    unique_filename: false,
    overwrite: false,
  }

  if (isImage) {
    options.transformation = [{ quality: 'auto', fetch_format: 'auto' }, { width: 1600, crop: 'limit' }]
  }

  const result = await uploadBufferToCloudinary(file.buffer, options)

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType,
    originalName: file.originalname || '',
    format: result.format || file.originalname?.split('.').pop() || '',
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
