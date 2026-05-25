// src/middleware/validate.js
import { AppError } from '../utils/AppError.js'

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)

  if (!result.success) {
    const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    return next(new AppError(messages.join(', '), 400))
  }

  req.validatedBody = result.data
  next()
}