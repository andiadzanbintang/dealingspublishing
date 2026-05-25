// src/controllers/topic.controller.js
import Topic from '../models/Topic.js'
import Journal from '../models/Journal.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js'

export const getAllPublic = catchAsync(async (req, res) => {
  const cached = await cacheGet('topics:public')
  if (cached) return res.status(200).json(cached)

  const topics = await Topic.find({ isActive: true })
    .populate('journalCount')
    .sort('sortOrder')

  const response = { status: 'success', data: topics }
  await cacheSet('topics:public', response, 600)
  res.status(200).json(response)
})

export const getTopicJournals = catchAsync(async (req, res, next) => {
  const query = req.sanitizedQuery || req.query
  const topic = await Topic.findOne({ slug: req.params.slug })
  if (!topic) return next(new AppError('Topic not found', 404))

  const page = parseInt(query.page, 10) || 1
  const limit = parseInt(query.limit, 10) || 10
  const skip = (page - 1) * limit

  const filter = { topic: topic._id, status: 'published' }
  const total = await Journal.countDocuments(filter)
  const journals = await Journal.find(filter)
    .populate('topic', 'name slug color icon')
    .sort('-publicationDate')
    .skip(skip)
    .limit(limit)

  res.status(200).json({
    status: 'success',
    results: journals.length,
    total,
    page,
    data: journals,
  })
})

export const getAllAdmin = catchAsync(async (req, res) => {
  const topics = await Topic.find().populate('journalCount').sort('sortOrder')
  res.status(200).json({ status: 'success', data: topics })
})

export const create = catchAsync(async (req, res) => {
  const topic = await Topic.create(req.validatedBody)
  await cacheDel('topics:*')
  res.status(201).json({ status: 'success', data: topic })
})

export const update = catchAsync(async (req, res, next) => {
  const topic = await Topic.findByIdAndUpdate(req.params.id, req.validatedBody, {
    new: true,
    runValidators: true,
  })
  if (!topic) return next(new AppError('Topic not found', 404))
  await cacheDel('topics:*')
  res.status(200).json({ status: 'success', data: topic })
})

export const remove = catchAsync(async (req, res, next) => {
  const topic = await Topic.findByIdAndDelete(req.params.id)
  if (!topic) return next(new AppError('Topic not found', 404))
  await cacheDel('topics:*')
  res.status(200).json({ status: 'success', message: 'Topic deleted' })
})