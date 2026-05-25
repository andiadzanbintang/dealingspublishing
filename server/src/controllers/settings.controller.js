// src/controllers/settings.controller.js
import SiteSetting from '../models/SiteSetting.js'
import { catchAsync } from '../utils/catchAsync.js'
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js'

// Get settings (public)
export const getSettings = catchAsync(async (req, res) => {
  const cached = await cacheGet('site:settings')
  if (cached) return res.status(200).json(cached)

  let settings = await SiteSetting.findOne()

  // Create default if none exists
  if (!settings) {
    settings = await SiteSetting.create({})
  }

  const response = { status: 'success', data: settings }
  await cacheSet('site:settings', response, 600)
  res.status(200).json(response)
})

// Update settings (admin)
export const updateSettings = catchAsync(async (req, res) => {
  let settings = await SiteSetting.findOne()

  if (!settings) {
    settings = await SiteSetting.create(req.body)
  } else {
    Object.assign(settings, req.body)
    await settings.save()
  }

  await cacheDel('site:*')

  res.status(200).json({ status: 'success', data: settings })
})