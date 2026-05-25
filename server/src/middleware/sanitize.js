import sanitize from 'mongo-sanitize'

const sanitizeDeep = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeep(item))
  }

  if (value && typeof value === 'object') {
    const cleaned = {}

    for (const [key, val] of Object.entries(value)) {
      const safeKey = sanitize(key)
      if (!safeKey) continue

      cleaned[safeKey] = sanitizeDeep(val)
    }

    return sanitize(cleaned)
  }

  return sanitize(value)
}

export const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeDeep(req.body)
  }

  if (req.params) {
    req.params = sanitizeDeep(req.params)
  }

  // Express 5: do not overwrite req.query.
  req.sanitizedQuery = sanitizeDeep({ ...req.query })

  next()
}