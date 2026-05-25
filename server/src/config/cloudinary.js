// src/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary'
import { logger } from './logger.js'

export const connectCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  logger.info('Cloudinary configured')
}

export default cloudinary