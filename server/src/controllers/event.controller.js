// src/controllers/event.controller.js
import Event from '../models/Event.js'
import ActivityLog from '../models/ActivityLog.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { APIFeatures } from '../utils/apiFeatures.js'
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js'

// ═══ PUBLIC ═══ 

export const getAllPublic = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query
  const cacheKey = `events:public:${JSON.stringify(query)}`
  const cached = await cacheGet(cacheKey)
  if (cached) return res.status(200).json(cached)

  const filter = { isPublished: true }

  // Optional: filter upcoming vs past
  if (query.upcoming === 'true') {
    filter.eventDate = { $gte: new Date() }
  } else if (query.past === 'true') {
    filter.eventDate = { $lt: new Date() }
  }

  const features = new APIFeatures(Event.find(filter), query)
    .search(['title', 'description', 'tags'])
    .sort()
    .paginate()

  const total = await Event.countDocuments(filter)
  const events = await features.query

  const response = {
    status: 'success',
    results: events.length,
    total,
    page: features.page,
    data: events,
  }

  await cacheSet(cacheKey, response, 120)
  res.status(200).json(response)
})

export const getUpcoming = catchAsync(async (req, res) => {
  const cached = await cacheGet('events:upcoming')
  if (cached) return res.status(200).json(cached)

  const events = await Event.find({
    isPublished: true,
    eventDate: { $gte: new Date() },
  })
    .sort('eventDate')
    .limit(6)

  const response = { status: 'success', data: events }
  await cacheSet('events:upcoming', response, 300)
  res.status(200).json(response)
})

export const getBySlug = catchAsync(async (req, res, next) => {
  const event = await Event.findOne({ slug: req.params.slug, isPublished: true })
  if (!event) return next(new AppError('Event not found', 404))
  res.status(200).json({ status: 'success', data: event })
})

// ═══ ADMIN ═══

export const getAllAdmin = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query

  const features = new APIFeatures(
    Event.find().populate('createdBy', 'name'),
    query
  )
    .search(['title', 'description'])
    .sort()
    .paginate()

  const total = await Event.countDocuments()
  const events = await features.query

  res.status(200).json({
    status: 'success',
    results: events.length,
    total,
    page: features.page,
    data: events,
  })
})

export const getById = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id).populate('createdBy', 'name')
  if (!event) return next(new AppError('Event not found', 404))
  res.status(200).json({ status: 'success', data: event })
})

export const create = catchAsync(async (req, res) => {
  const data = req.validatedBody

  const event = await Event.create({
    ...data,
    createdBy: req.user._id,
    eventDate: new Date(data.eventDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
  })

  await ActivityLog.log({
    userId: req.user._id,
    action: 'CREATE',
    entity: 'event',
    entityId: event._id,
    details: `Created event: ${event.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('events:*')
  res.status(201).json({ status: 'success', data: event })
})

export const update = catchAsync(async (req, res, next) => {
  const data = req.validatedBody

  if (data.eventDate) data.eventDate = new Date(data.eventDate)
  if (data.endDate) data.endDate = new Date(data.endDate)

  const event = await Event.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  })

  if (!event) return next(new AppError('Event not found', 404))

  await ActivityLog.log({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'event',
    entityId: event._id,
    details: `Updated event: ${event.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('events:*')
  res.status(200).json({ status: 'success', data: event })
})

export const remove = catchAsync(async (req, res, next) => {
  const event = await Event.findByIdAndDelete(req.params.id)
  if (!event) return next(new AppError('Event not found', 404))

  await ActivityLog.log({
    userId: req.user._id,
    action: 'DELETE',
    entity: 'event',
    entityId: event._id,
    details: `Deleted event: ${event.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('events:*')
  res.status(200).json({ status: 'success', message: 'Event deleted' })
})

export const togglePublish = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id)
  if (!event) return next(new AppError('Event not found', 404))

  event.isPublished = !event.isPublished
  await event.save()
  await cacheDel('events:*')

  res.status(200).json({ status: 'success', data: event })
})

export const toggleFeatured = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id)
  if (!event) return next(new AppError('Event not found', 404))

  event.isFeatured = !event.isFeatured
  await event.save()
  await cacheDel('events:*')

  res.status(200).json({ status: 'success', data: event })
})