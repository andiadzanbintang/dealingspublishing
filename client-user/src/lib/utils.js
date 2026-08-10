import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString(
        'en-US',
        {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }
    )
}

export function truncateText(text, maxLength=120) {
    if(!text) return ""
    if(text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
}

export function slugify(text){
    return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export const formatBookPrice = (price, currency = 'IDR') => {
  if (price === null || price === undefined || price === '') return ''

  const numericPrice = Number(price)

  if (Number.isNaN(numericPrice)) return ''
  if (numericPrice === 0) return 'Free'

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(numericPrice)
}

// ═══════════════════════════════════════
// EVENT REGISTRATION HELPERS
// ═══════════════════════════════════════

export const formatIDR = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

export const formatUSD = (value) =>
  `$${(Number(value) || 0).toLocaleString('en-US')} USD`

export function formatDateTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFileSize(bytes) {
  const size = Number(bytes) || 0
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Saves a Blob returned by the API as a file download.
 * Used instead of a plain <a href> so the request carries the auth header and
 * the server can set the correct Content-Type and filename.
 */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename || 'download'
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Give the browser a tick to start the download before revoking
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Index of the last payment attempt with the given status, or -1. */
export function lastPaymentIndex(payments = [], status) {
  for (let i = payments.length - 1; i >= 0; i -= 1) {
    if (payments[i]?.status === status) return i
  }
  return -1
}

/** Human label for an attendance pair, e.g. "Presenter · Offline". */
export function attendanceLabel(role, mode) {
  if (!role || !mode) return ''
  const rolePart = role === 'presenter' ? 'Presenter' : 'Participant'
  const modePart = mode === 'offline' ? 'Offline' : 'Online'
  return `${rolePart} · ${modePart}`
}

/**
 * Maps a registration document onto the six steps the participant sees.
 * Keep in sync with EventRegistration.stage on the server.
 */
export const REGISTRATION_STAGES = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'waiting-review', label: 'Under review' },
  { key: 'awaiting-payment', label: 'Payment' },
  { key: 'waiting-payment-confirmation', label: 'Verifying payment' },
  { key: 'completed', label: 'Confirmed' },
]

export function registrationStage(registration) {
  if (!registration) return null
  if (registration.submissionStatus === 'submitted') return 'waiting-review'
  if (registration.submissionStatus === 'rejected') return 'revision-required'
  if (registration.paymentStatus === 'confirmed') return 'completed'
  if (registration.paymentStatus === 'pending') return 'waiting-payment-confirmation'
  return 'awaiting-payment'
}

export const statusTone = {
  submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  unpaid: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
}
