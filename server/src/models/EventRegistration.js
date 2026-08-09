// src/models/EventRegistration.js
import mongoose from 'mongoose'

/**
 * Stored file reference (Cloudinary).
 * Documents (abstract / full paper) are uploaded with resource_type: 'raw',
 * payment proofs may be image or raw.
 */
const storedFileSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
    resourceType: { type: String, default: 'raw' },
    originalName: { type: String, default: '' },
    format: { type: String, default: '' },
    bytes: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

/**
 * One payment attempt. When a participant submits a NEW proof, every previous
 * attempt is flipped to 'failed' so the amount is never counted twice.
 */
const paymentAttemptSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ['manual', 'gateway'], default: 'manual' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending',
    },
    bankName: { type: String, default: '' },
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    swiftCode: { type: String, default: '' },
    country: { type: String, default: '' },
    amountDeclared: { type: Number, default: 0 },
    currency: { type: String, enum: ['IDR', 'USD'], default: 'IDR' },
    proofFile: { type: storedFileSchema, default: null },
    note: { type: String, default: '' },
    adminNote: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: false }
)

const historySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    note: { type: String, default: '' },
    actorType: { type: String, enum: ['participant', 'admin', 'system'], default: 'system' },
    actorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
)

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: true,
      index: true,
    },
    registrationCode: { type: String, required: true, unique: true, uppercase: true },

    // ═══ 1. PROFILE ═══
    profile: {
      fullName: { type: String, required: true, trim: true },
      affiliation: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true }, // stored with country code, e.g. +6281234567890
      country: { type: String, default: '' },
    },

    // ═══ 2. MANUSCRIPT ═══
    manuscript: {
      title: { type: String, default: '' },
      abstract: { type: String, default: '' },
      keywords: [{ type: String, trim: true }],
      outputType: {
        type: String,
        enum: ['book-series-scopus', 'journal-nasional-sinta', ''],
        default: '',
      },
    },

    // ═══ 3. ATTENDANCE ═══
    attendance: {
      role: { type: String, enum: ['presenter', 'participant'], required: true },
      mode: { type: String, enum: ['online', 'offline'], required: true },
    },

    // Fee snapshot taken at submit time so later config changes never
    // retroactively alter what a participant owes.
    fee: {
      label: { type: String, default: '' },
      amountIdr: { type: Number, default: 0 },
      amountUsd: { type: Number, default: 0 },
    },

    // ═══ 4. DOCUMENTS ═══
    abstractFile: { type: storedFileSchema, default: null },
    fullPaperFile: { type: storedFileSchema, default: null },

    // ═══ 5. WAITING ROOM (review) ═══
    submissionStatus: {
      type: String,
      enum: ['submitted', 'accepted', 'rejected'],
      default: 'submitted',
      index: true,
    },
    submittedAt: { type: Date, default: Date.now },
    submissionCount: { type: Number, default: 1 },
    reviewNote: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // ═══ 6. PAYMENT ═══
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'confirmed', 'failed'],
      default: 'unpaid',
      index: true,
    },
    paymentMethod: { type: String, enum: ['manual', 'gateway', ''], default: '' },
    payments: [paymentAttemptSchema],
    paidAt: { type: Date, default: null },

    // ═══ TICKET & INVOICE ═══
    ticket: {
      code: { type: String, default: '' },
      issuedAt: { type: Date, default: null },
      attendanceLabel: { type: String, default: '' }, // e.g. "Presenter · Offline"
    },
    invoice: {
      number: { type: String, default: '' },
      issuedAt: { type: Date, default: null },
      amountIdr: { type: Number, default: 0 },
      amountUsd: { type: Number, default: 0 },
      currency: { type: String, default: 'IDR' },
    },

    ticketEmailSentAt: { type: Date, default: null },
    history: [historySchema],
  },
  { timestamps: true }
)

// One participant may only hold one registration per event.
eventRegistrationSchema.index({ event: 1, participant: 1 }, { unique: true })
eventRegistrationSchema.index({ event: 1, submissionStatus: 1, paymentStatus: 1 })
eventRegistrationSchema.index({ createdAt: -1 })

eventRegistrationSchema.methods.pushHistory = function (entry) {
  this.history.push({ at: new Date(), ...entry })
}

/**
 * The single "where am I?" value the client-user UI renders as a step.
 */
eventRegistrationSchema.virtual('stage').get(function () {
  if (this.submissionStatus === 'submitted') return 'waiting-review'
  if (this.submissionStatus === 'rejected') return 'revision-required'
  if (this.paymentStatus === 'confirmed') return 'completed'
  if (this.paymentStatus === 'pending') return 'waiting-payment-confirmation'
  return 'awaiting-payment'
})

eventRegistrationSchema.set('toJSON', { virtuals: true })
eventRegistrationSchema.set('toObject', { virtuals: true })

export default mongoose.model('EventRegistration', eventRegistrationSchema)
