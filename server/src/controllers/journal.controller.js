// src/controllers/journal.controller.js
import Journal from '../models/Journal.js'
import ActivityLog from '../models/ActivityLog.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { APIFeatures } from '../utils/apiFeatures.js'
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js'
import { embedJournal } from '../services/ai.service.js'

// ═══ PUBLIC ═══

export const getAllPublic = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query
  const cacheKey = `journals:public:${JSON.stringify(query)}`
  const cached = await cacheGet(cacheKey)
  if (cached) return res.status(200).json(cached)

  const filter = { status: 'published' }
  const features = new APIFeatures(Journal.find(filter).populate('topic', 'name slug color icon'), query)
    .filter()
    .search(['title', 'abstract', 'keywords'])
    .sort()
    .limitFields()
    .paginate()

  const total = await Journal.countDocuments(filter)
  const journals = await features.query

  const response = {
    status: 'success',
    results: journals.length,
    total,
    page: features.page,
    data: journals,
  }

  await cacheSet(cacheKey, response, 120)
  res.status(200).json(response)
})

export const getFeatured = catchAsync(async (req, res) => {
  const cached = await cacheGet('journals:featured')
  if (cached) return res.status(200).json(cached)

  const journals = await Journal.find({ status: 'published', isFeatured: true })
    .populate('topic', 'name slug color icon')
    .sort('-publicationDate')
    .limit(10)

  const response = { status: 'success', data: journals }
  await cacheSet('journals:featured', response, 300)
  res.status(200).json(response)
})

export const getBySlug = catchAsync(async (req, res, next) => {
  const journal = await Journal.findOneAndUpdate(
    { slug: req.params.slug, status: 'published' },
    { $inc: { viewCount: 1 } },
    { new: true }
  ).populate('topic', 'name slug color icon')

  if (!journal) return next(new AppError('Journal not found', 404))

  res.status(200).json({ status: 'success', data: journal })
})

export const searchJournals = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query
  const { q, issn } = query
  let filter = { status: 'published' }

  if (issn) {
    filter.issn = new RegExp(issn, 'i')
  } else if (q) {
    filter.$or = [
      { title: new RegExp(q, 'i') },
      { abstract: new RegExp(q, 'i') },
      { keywords: new RegExp(q, 'i') },
    ]
  }

  const journals = await Journal.find(filter)
    .populate('topic', 'name slug color icon')
    .sort('-publicationDate')
    .limit(20)

  res.status(200).json({ status: 'success', results: journals.length, data: journals })
})

// ═══ ADMIN ═══

export const getAllAdmin = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query
  const features = new APIFeatures(
    Journal.find().populate('topic', 'name slug color icon').populate('createdBy', 'name'),
    query
  )
    .search(['title', 'issn', 'abstract'])
    .sort()
    .paginate()

  const total = await Journal.countDocuments()
  const journals = await features.query

  res.status(200).json({
    status: 'success',
    results: journals.length,
    total,
    page: features.page,
    data: journals,
  })
})

export const getById = catchAsync(async (req, res, next) => {
  const journal = await Journal.findById(req.params.id)
    .populate('topic', 'name slug color icon')
    .populate('createdBy', 'name')

  if (!journal) return next(new AppError('Journal not found', 404))
  res.status(200).json({ status: 'success', data: journal })
})

export const create = catchAsync(async (req, res) => {
  const data = req.validatedBody

  const journal = await Journal.create({
    ...data,
    topic: data.topicId,
    createdBy: req.user._id,
    publicationDate: data.publicationDate ? new Date(data.publicationDate) : null,
  })

  // Embed for AI (async, non-blocking)
  embedJournal(journal).catch(() => {})

  await ActivityLog.log({
    userId: req.user._id,
    action: 'CREATE',
    entity: 'journal',
    entityId: journal._id,
    details: `Created journal: ${journal.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('journals:*')

  res.status(201).json({ status: 'success', data: journal })
})

export const update = catchAsync(async (req, res, next) => {
  const data = req.validatedBody

  const journal = await Journal.findByIdAndUpdate(
    req.params.id,
    {
      ...data,
      topic: data.topicId || undefined,
      publicationDate: data.publicationDate ? new Date(data.publicationDate) : undefined,
    },
    { new: true, runValidators: true }
  )

  if (!journal) return next(new AppError('Journal not found', 404))

  // Re-embed
  embedJournal(journal).catch(() => {})

  await ActivityLog.log({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'journal',
    entityId: journal._id,
    details: `Updated journal: ${journal.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('journals:*')

  res.status(200).json({ status: 'success', data: journal })
})

export const remove = catchAsync(async (req, res, next) => {
  const journal = await Journal.findByIdAndDelete(req.params.id)
  if (!journal) return next(new AppError('Journal not found', 404))

  await ActivityLog.log({
    userId: req.user._id,
    action: 'DELETE',
    entity: 'journal',
    entityId: journal._id,
    details: `Deleted journal: ${journal.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('journals:*')

  res.status(200).json({ status: 'success', message: 'Journal deleted' })
})

export const toggleFeatured = catchAsync(async (req, res, next) => {
  const journal = await Journal.findById(req.params.id)
  if (!journal) return next(new AppError('Journal not found', 404))

  journal.isFeatured = !journal.isFeatured
  await journal.save()
  await cacheDel('journals:*')

  res.status(200).json({ status: 'success', data: journal })
})

export const toggleStatus = catchAsync(async (req, res, next) => {
  const journal = await Journal.findById(req.params.id)
  if (!journal) return next(new AppError('Journal not found', 404))

  journal.status = journal.status === 'published' ? 'draft' : 'published'
  await journal.save()
  await cacheDel('journals:*')

  res.status(200).json({ status: 'success', data: journal })
})