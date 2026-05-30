import Partnership from '../models/Partnership.js'
import ActivityLog from '../models/ActivityLog.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { APIFeatures } from '../utils/apiFeatures.js'
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js'

const clearPartnershipCache = async () => {
  await cacheDel('partnerships:*')
  await cacheDel('dashboard:*')
}

// Public: /partnerships/public
export const getAllPublic = catchAsync(async (req, res) => {
  const cacheKey = `partnerships:public:${JSON.stringify(req.query)}`

  const cached = await cacheGet(cacheKey)
  if (cached) {
    return res.status(200).json(cached)
  }

  const features = new APIFeatures(
    Partnership.find({ isPublished: true }),
    req.query
  )
    .filter()
    .search(['name', 'description'])
    .sort()
    .limitFields()
    .paginate()

  const partnerships = await features.query

  const response = {
    status: 'success',
    results: partnerships.length,
    data: partnerships,
  }

  await cacheSet(cacheKey, response, 300)

  res.status(200).json(response)
})

// Admin: /partnerships
export const getAllAdmin = catchAsync(async (req, res) => {
  const features = new APIFeatures(Partnership.find(), req.query)
    .filter()
    .search(['name', 'description'])
    .sort()
    .limitFields()
    .paginate()

  const partnerships = await features.query

  res.status(200).json({
    status: 'success',
    results: partnerships.length,
    data: partnerships,
  })
})

// Admin: /partnerships/:id
export const getById = catchAsync(async (req, res, next) => {
  const partnership = await Partnership.findById(req.params.id)

  if (!partnership) {
    return next(new AppError('Partnership not found', 404))
  }

  res.status(200).json({
    status: 'success',
    data: partnership,
  })
})

// Admin: POST /partnerships
export const create = catchAsync(async (req, res) => {
  const partnership = await Partnership.create({
    ...req.validatedBody,
    createdBy: req.user._id,
  })

  await ActivityLog.log({
    userId: req.user._id,
    action: 'CREATE',
    entity: 'partnership',
    entityId: partnership._id,
    details: `Created partnership: ${partnership.name}`,
    ipAddress: req.ip,
  })

  await clearPartnershipCache()

  res.status(201).json({
    status: 'success',
    data: partnership,
  })
})

// Admin: PUT /partnerships/:id
export const update = catchAsync(async (req, res, next) => {
  const partnership = await Partnership.findByIdAndUpdate(
    req.params.id,
    req.validatedBody,
    {
      new: true,
      runValidators: true,
    }
  )

  if (!partnership) {
    return next(new AppError('Partnership not found', 404))
  }

  await ActivityLog.log({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'partnership',
    entityId: partnership._id,
    details: `Updated partnership: ${partnership.name}`,
    ipAddress: req.ip,
  })

  await clearPartnershipCache()

  res.status(200).json({
    status: 'success',
    data: partnership,
  })
})

// Admin: DELETE /partnerships/:id
export const remove = catchAsync(async (req, res, next) => {
  const partnership = await Partnership.findByIdAndDelete(req.params.id)

  if (!partnership) {
    return next(new AppError('Partnership not found', 404))
  }

  await ActivityLog.log({
    userId: req.user._id,
    action: 'DELETE',
    entity: 'partnership',
    entityId: partnership._id,
    details: `Deleted partnership: ${partnership.name}`,
    ipAddress: req.ip,
  })

  await clearPartnershipCache()

  res.status(204).json({
    status: 'success',
    data: null,
  })
})

// Admin: PATCH /partnerships/:id/publish
export const togglePublish = catchAsync(async (req, res, next) => {
  const partnership = await Partnership.findById(req.params.id)

  if (!partnership) {
    return next(new AppError('Partnership not found', 404))
  }

  partnership.isPublished = !partnership.isPublished
  await partnership.save()

  await clearPartnershipCache()

  res.status(200).json({
    status: 'success',
    data: partnership,
  })
})