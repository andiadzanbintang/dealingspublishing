// src/utils/registrationCodes.js
import crypto from 'crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 — avoids read-back mistakes

export const randomCode = (length = 6) => {
  const bytes = crypto.randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return out
}

export const normalizePrefix = (value, fallback = 'REG') => {
  const cleaned = (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return cleaned.slice(0, 12) || fallback
}

/**
 * Public-facing registration code, e.g. ICUCE26-K7M2QX.
 * Uniqueness is enforced by the unique index; the caller retries on collision.
 */
export const buildRegistrationCode = (prefix) => `${normalizePrefix(prefix)}-${randomCode(6)}`

/**
 * Ticket code encodes the attendance type so it can be read at the door:
 * ICUCE26-PR-OFF-0007
 */
export const buildTicketCode = (prefix, role, mode, sequence) => {
  const rolePart = role === 'presenter' ? 'PR' : 'PT'
  const modePart = mode === 'offline' ? 'OFF' : 'ONL'
  const seq = String(sequence).padStart(4, '0')
  return `${normalizePrefix(prefix)}-${rolePart}-${modePart}-${seq}`
}

/** INV/ICUCE26/2026/0007 */
export const buildInvoiceNumber = (prefix, sequence, date = new Date()) =>
  `${normalizePrefix(prefix, 'INV')}/${date.getFullYear()}/${String(sequence).padStart(4, '0')}`

export const attendanceLabel = (role, mode) => {
  const rolePart = role === 'presenter' ? 'Presenter' : 'Participant'
  const modePart = mode === 'offline' ? 'Offline' : 'Online'
  return `${rolePart} · ${modePart}`
}
