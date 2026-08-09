// src/models/Event.js
import mongoose from 'mongoose'

/**
 * One price row. The pair (role, mode) is the key the registration form uses
 * to resolve what a participant owes.
 */
const registrationFeeSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['presenter', 'participant'], required: true },
    mode: { type: String, enum: ['online', 'offline'], required: true },
    label: { type: String, default: '' },
    amountIdr: { type: Number, default: 0 },
    amountUsd: { type: Number, default: 0 },
  },
  { _id: false }
)

/**
 * Per-event registration configuration. Nothing here is hardcoded to a single
 * conference: an admin turns `enabled` on for any event and fills the rest in
 * from the Event form, and the whole participant flow becomes available.
 */
const registrationConfigSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    ctaLabel: { type: String, default: 'Register Event' },
    opensAt: { type: Date, default: null },
    closesAt: { type: Date, default: null },

    // Which sections of the wizard apply to this event
    requireManuscript: { type: Boolean, default: true },
    requireAbstractFile: { type: Boolean, default: true },

    fees: { type: [registrationFeeSchema], default: [] },

    outputTypes: {
      type: [
        {
          _id: false,
          value: { type: String, required: true },
          label: { type: String, required: true },
        },
      ],
      default: [],
    },

    keywordsMin: { type: Number, default: 3 },
    keywordsMax: { type: Number, default: 5 },
    maxAbstractSizeMb: { type: Number, default: 15 },
    maxFullPaperSizeMb: { type: Number, default: 25 },

    abstractDeadline: { type: Date, default: null },
    fullPaperDeadline: { type: Date, default: null },

    paymentMethods: {
      manual: { type: Boolean, default: true },
      gateway: { type: Boolean, default: false }, // pending licensing approval
      gatewayNote: {
        type: String,
        default: 'Online payment gateway is not available yet. Please use manual transfer.',
      },
    },

    // Shown only to a participant whose submission has been accepted.
    bank: {
      accountNumber: { type: String, default: '' },
      accountName: { type: String, default: '' },
      bankName: { type: String, default: '' },
      swiftCode: { type: String, default: '' },
      branch: { type: String, default: '' },
    },

    ticketPrefix: { type: String, default: 'REG' },
    invoicePrefix: { type: String, default: 'INV' },

    whatsappGroupUrl: { type: String, default: '' },
    fullPaperUploadUrl: { type: String, default: '' },

    contactEmail: { type: String, default: '' },
    contactWhatsapp: { type: String, default: '' },

    instructions: { type: String, default: '' },
  },
  { _id: false }
)

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    gallery: [{ type: String }],
    eventDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    location: { type: String, default: '' },
    locationType: { type: String, enum: ['in-person', 'virtual', 'hybrid'], default: 'in-person' },
    eventType: { type: String, enum: ['conference', 'webinar', 'workshop', 'seminar'], default: 'conference' },
    externalUrl: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    tags: [{ type: String }],
    registration: { type: registrationConfigSchema, default: () => ({}) },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

eventSchema.index({ eventDate: -1 })

/**
 * True when the event accepts new registrations right now.
 */
eventSchema.methods.isRegistrationOpen = function () {
  const cfg = this.registration
  if (!cfg?.enabled) return false

  const now = new Date()
  if (cfg.opensAt && now < cfg.opensAt) return false
  if (cfg.closesAt && now > cfg.closesAt) return false

  return true
}

export default mongoose.model('Event', eventSchema)
