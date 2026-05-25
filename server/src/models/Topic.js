// src/models/Topic.js
import mongoose from 'mongoose'

const topicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '📄' },
    color: { type: String, default: '#6366F1' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Virtual: journal count
topicSchema.virtual('journalCount', {
  ref: 'Journal',
  localField: '_id',
  foreignField: 'topic',
  count: true,
})

export default mongoose.model('Topic', topicSchema)