// src/utils/apiFeatures.js
export class APIFeatures {
  constructor(query, queryString) {
    this.query = query
    this.queryString = queryString
    this.totalDocs = 0
  }

  filter() {
    const queryObj = { ...this.queryString }
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'q']
    excludedFields.forEach((el) => delete queryObj[el])

    // Advanced filtering: { price: { gte: 5 } } → { price: { $gte: 5 } }
    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)

    this.query = this.query.find(JSON.parse(queryStr))
    return this
  }

  search(fields = ['title']) {
    if (this.queryString.q) {
      const searchRegex = new RegExp(this.queryString.q, 'i')
      const searchConditions = fields.map((field) => ({ [field]: searchRegex }))
      this.query = this.query.find({ $or: searchConditions })
    }
    return this
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ')
      this.query = this.query.sort(sortBy)
    } else {
      this.query = this.query.sort('-createdAt')
    }
    return this
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ')
      this.query = this.query.select(fields)
    } else {
      this.query = this.query.select('-__v')
    }
    return this
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1
    const limit = parseInt(this.queryString.limit, 10) || 10
    const skip = (page - 1) * limit

    this.query = this.query.skip(skip).limit(limit)
    this.page = page
    this.limit = limit
    return this
  }

  async countTotal(Model, filter = {}) {
    this.totalDocs = await Model.countDocuments(filter)
    return this
  }
}