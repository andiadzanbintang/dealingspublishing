// src/middleware/validate.js
import { AppError } from '../utils/AppError.js'

const collectIssues = (error) => {
  // zod v4 exposes `.issues`; older builds exposed `.errors`
  const issues = error?.issues || error?.errors || []
  return issues.map((e) => {
    const path = Array.isArray(e.path) ? e.path.join('.') : ''
    return path ? `${path}: ${e.message}` : e.message
  })
}

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)

  if (!result.success) {
    const messages = collectIssues(result.error)
    return next(new AppError(messages.join(', ') || 'Invalid request body', 400))
  }

  req.validatedBody = result.data
  next()
}
