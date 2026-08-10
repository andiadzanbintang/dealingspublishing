// src/middleware/eventScope.middleware.js
import { AppError } from '../utils/AppError.js'

/**
 * Reviewers only exist inside the events a superadmin assigned to them. Every
 * admin-side handler that touches event data runs through these two helpers so
 * the scope is enforced in one place rather than remembered per route.
 */

/** Array of allowed event ids for a reviewer, or null for unrestricted roles. */
export const scopedEventIds = (user) => {
  if (!user || user.role !== 'reviewer') return null
  return (user.assignedEvents || []).map((id) => String(id))
}

/** Merges the reviewer scope into a Mongo filter on the given field. */
export const applyEventScope = (filter, user, field = 'event') => {
  const scope = scopedEventIds(user)
  if (scope === null) return filter

  const existing = filter[field]

  if (existing) {
    // A reviewer asked for one specific event — keep it only if it is theirs
    const requested = String(existing)
    filter[field] = scope.includes(requested) ? existing : { $in: [] }
    return filter
  }

  filter[field] = { $in: scope }
  return filter
}

/** Throws when a reviewer reaches for an event outside their assignment. */
export const assertEventAccess = (user, eventId) => {
  const scope = scopedEventIds(user)
  if (scope === null) return

  if (!eventId || !scope.includes(String(eventId))) {
    throw new AppError(
      'You do not have access to this event. Ask a superadmin to assign it to your account.',
      403
    )
  }
}
