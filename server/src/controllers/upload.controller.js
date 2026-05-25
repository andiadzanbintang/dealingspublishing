// src/controllers/upload.controller.js
import cloudinary from '../config/cloudinary.js'
import streamifier from 'streamifier'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'

const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) resolve(result)
      else reject(error)
    })
    streamifier.createReadStream(buffer).pipe(stream)
  })
}

export const uploadImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded', 400))

  const query = req.sanitizedQuery || req.query
  const folder = query.folder || 'researchhub/general'

  const result = await uploadToCloudinary(req.file.buffer, {
    folder,
    resource_type: 'image',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 1200, crop: 'limit' },
    ],
  })

  res.status(200).json({
    status: 'success',
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    },
  })
})

export const uploadMultiple = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next(new AppError('No files uploaded', 400))

  const query = req.sanitizedQuery || req.query
  const folder = query.folder || 'researchhub/gallery'

  const uploadPromises = req.files.map((file) =>
    uploadToCloudinary(file.buffer, {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 1200, crop: 'limit' },
      ],
    })
  )

  const results = await Promise.all(uploadPromises)

  const images = results.map((r) => ({
    url: r.secure_url,
    publicId: r.public_id,
    width: r.width,
    height: r.height,
  }))

  res.status(200).json({ status: 'success', data: images })
})

export const deleteImage = catchAsync(async (req, res, next) => {
  const query = req.sanitizedQuery || req.query
  const { publicId } = query

  if (!publicId) return next(new AppError('Public ID is required', 400))

  await cloudinary.uploader.destroy(publicId)

  res.status(200).json({ status: 'success', message: 'Image deleted' })
})