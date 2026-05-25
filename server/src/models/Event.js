// src/models/Event.js
import mongoose from 'mongoose'

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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

eventSchema.index({ eventDate: -1 })

export default mongoose.model('Event', eventSchema)