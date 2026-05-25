// src/controllers/news.controller.js
import News from '../models/News.js'
import ActivityLog from '../models/ActivityLog.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { APIFeatures } from '../utils/apiFeatures.js'
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js'

export const getAllPublic = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query
  const cacheKey = `news:public:${JSON.stringify(query)}`
  const cached = await cacheGet(cacheKey)
  if (cached) return res.status(200).json(cached)

  const filter = { isPublished: true }
  const features = new APIFeatures(News.find(filter), query)
    .filter()
    .search(['title', 'excerpt', 'tags'])
    .sort()
    .limitFields()
    .paginate()

  const total = await News.countDocuments(filter)
  const news = await features.query

  const response = {
    status: 'success',
    results: news.length,
    total,
    page: features.page,
    data: news,
  }

  await cacheSet(cacheKey, response, 120)
  res.status(200).json(response)
})

export const getFeatured = catchAsync(async (req, res) => {
  const cached = await cacheGet('news:featured')
  if (cached) return res.status(200).json(cached)

  const news = await News.find({ isPublished: true, isFeatured: true })
    .sort('-publishedAt')
    .limit(6)

  const response = { status: 'success', data: news }
  await cacheSet('news:featured', response, 300)
  res.status(200).json(response)
})

export const getBySlug = catchAsync(async (req, res, next) => {
  const article = await News.findOneAndUpdate(
    { slug: req.params.slug, isPublished: true },
    { $inc: { viewCount: 1 } },
    { new: true }
  )

  if (!article) return next(new AppError('News article not found', 404))
  res.status(200).json({ status: 'success', data: article })
})

// ═══ ADMIN ═══

export const getAllAdmin = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query
  const features = new APIFeatures(
    News.find().populate('createdBy', 'name'),
    query
  )
    .search(['title', 'excerpt'])
    .sort()
    .paginate()

  const total = await News.countDocuments()
  const news = await features.query

  res.status(200).json({
    status: 'success',
    results: news.length,
    total,
    page: features.page,
    data: news,
  })
})

export const getById = catchAsync(async (req, res, next) => {
  const article = await News.findById(req.params.id).populate('createdBy', 'name')
  if (!article) return next(new AppError('News article not found', 404))
  res.status(200).json({ status: 'success', data: article })
})

export const create = catchAsync(async (req, res) => {
  const data = req.validatedBody

  const article = await News.create({
    ...data,
    createdBy: req.user._id,
    publishedAt: data.isPublished ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null,
  })

  await ActivityLog.log({
    userId: req.user._id,
    action: 'CREATE',
    entity: 'news',
    entityId: article._id,
    details: `Created news: ${article.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('news:*')
  res.status(201).json({ status: 'success', data: article })
})

export const update = catchAsync(async (req, res, next) => {
  const data = req.validatedBody

  // If publishing for the first time, set publishedAt
  if (data.isPublished && data.publishedAt) {
    data.publishedAt = new Date(data.publishedAt)
  }

  const article = await News.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  })

  if (!article) return next(new AppError('News article not found', 404))

  await ActivityLog.log({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'news',
    entityId: article._id,
    details: `Updated news: ${article.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('news:*')
  res.status(200).json({ status: 'success', data: article })
})

export const remove = catchAsync(async (req, res, next) => {
  const article = await News.findByIdAndDelete(req.params.id)
  if (!article) return next(new AppError('News article not found', 404))

  await ActivityLog.log({
    userId: req.user._id,
    action: 'DELETE',
    entity: 'news',
    entityId: article._id,
    details: `Deleted news: ${article.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('news:*')
  res.status(200).json({ status: 'success', message: 'News article deleted' })
})

export const togglePublish = catchAsync(async (req, res, next) => {
  const article = await News.findById(req.params.id)
  if (!article) return next(new AppError('News article not found', 404))

  article.isPublished = !article.isPublished
  if (article.isPublished && !article.publishedAt) {
    article.publishedAt = new Date()
  }
  await article.save()
  await cacheDel('news:*')

  res.status(200).json({ status: 'success', data: article })
})

export const toggleFeatured = catchAsync(async (req, res, next) => {
  const article = await News.findById(req.params.id)
  if (!article) return next(new AppError('News article not found', 404))

  article.isFeatured = !article.isFeatured
  await article.save()
  await cacheDel('news:*')

  res.status(200).json({ status: 'success', data: article })
})