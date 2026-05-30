// src/controllers/book.controller.js
import Book from '../models/Book.js'
import ActivityLog from '../models/ActivityLog.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { APIFeatures } from '../utils/apiFeatures.js'
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js'

// ═══ PUBLIC ═══

export const getAllPublic = catchAsync(async (req, res) => {
  const cacheKey = `books:public:${JSON.stringify(req.query)}`
  const cached = await cacheGet(cacheKey)
  if (cached) return res.status(200).json(cached)

  const filter = { isPublished: true }

  const features = new APIFeatures(Book.find(filter), req.query)
    .filter()
    .search(['title', 'description', 'writers', 'isbn', 'category', 'tags'])
    .sort()
    .limitFields()
    .paginate()

  const books = await features.query
  const total = await Book.countDocuments(filter)

  const response = {
    status: 'success',
    results: books.length,
    total,
    page: features.page,
    data: books,
  }

  await cacheSet(cacheKey, response, 300)
  res.status(200).json(response)
})

export const getFeatured = catchAsync(async (req, res) => {
  const cached = await cacheGet('books:featured')
  if (cached) return res.status(200).json(cached)

  const books = await Book.find({
    isPublished: true,
    isFeatured: true,
  })
    .sort('-createdAt')
    .limit(8)

  const response = {
    status: 'success',
    data: books,
  }

  await cacheSet('books:featured', response, 300)
  res.status(200).json(response)
})

export const getBySlug = catchAsync(async (req, res, next) => {
  const book = await Book.findOne({
    slug: req.params.slug,
    isPublished: true,
  })

  if (!book) return next(new AppError('Book not found', 404))

  book.viewCount += 1
  await book.save({ validateBeforeSave: false })

  res.status(200).json({
    status: 'success',
    data: book,
  })
})

// ═══ ADMIN ═══

export const getAllAdmin = catchAsync(async (req, res) => {
  const features = new APIFeatures(Book.find(), req.query)
    .filter()
    .search(['title', 'description', 'writers', 'isbn', 'category', 'tags'])
    .sort()
    .limitFields()
    .paginate()

  const books = await features.query
  const total = await Book.countDocuments()

  res.status(200).json({
    status: 'success',
    results: books.length,
    total,
    page: features.page,
    data: books,
  })
})

export const getById = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id)

  if (!book) return next(new AppError('Book not found', 404))

  res.status(200).json({
    status: 'success',
    data: book,
  })
})

export const create = catchAsync(async (req, res) => {
  const book = await Book.create({
    ...req.validatedBody,
    createdBy: req.user._id,
  })

  await ActivityLog.log({
    userId: req.user._id,
    action: 'CREATE',
    entity: 'book',
    entityId: book._id,
    details: `Created book: ${book.title}`, 
    ipAddress: req.ip,
  })

  await cacheDel('books:*')
  await cacheDel('dashboard:*')

  res.status(201).json({
    status: 'success',
    data: book,
  })
})

export const update = catchAsync(async (req, res, next) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.validatedBody, {
    new: true,
    runValidators: true,
  })

  if (!book) return next(new AppError('Book not found', 404))

  await ActivityLog.log({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'book',
    entityId: book._id,
    details: `Updated book: ${book.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('books:*')
  await cacheDel('dashboard:*')

  res.status(200).json({
    status: 'success',
    data: book,
  })
})

export const remove = catchAsync(async (req, res, next) => {
  const book = await Book.findByIdAndDelete(req.params.id)

  if (!book) return next(new AppError('Book not found', 404))

  await ActivityLog.log({
    userId: req.user._id,
    action: 'DELETE',
    entity: 'book',
    entityId: book._id,
    details: `Deleted book: ${book.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('books:*')
  await cacheDel('dashboard:*')

  res.status(200).json({
    status: 'success',
    message: 'Book deleted',
  })
})

export const togglePublish = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id)

  if (!book) return next(new AppError('Book not found', 404))

  book.isPublished = !book.isPublished
  await book.save()

  await ActivityLog.log({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'book',
    entityId: book._id,
    details: `${book.isPublished ? 'Published' : 'Unpublished'} book: ${book.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('books:*')
  await cacheDel('dashboard:*')

  res.status(200).json({
    status: 'success',
    data: book,
  })
})

export const toggleFeatured = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id)

  if (!book) return next(new AppError('Book not found', 404))

  book.isFeatured = !book.isFeatured
  await book.save()

  await ActivityLog.log({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'book',
    entityId: book._id,
    details: `${book.isFeatured ? 'Featured' : 'Unfeatured'} book: ${book.title}`,
    ipAddress: req.ip,
  })

  await cacheDel('books:*')
  await cacheDel('dashboard:*')

  res.status(200).json({
    status: 'success',
    data: book,
  })
})