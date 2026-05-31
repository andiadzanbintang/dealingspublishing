import mongoose from 'mongoose'

const partnershipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    photo: {
      type: String,
      required: true,
      trim: true,
    },

    externalUrl: {
      type: String,
      default: '',
      trim: true,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

partnershipSchema.index({ isPublished: 1, displayOrder: 1, createdAt: -1 })
partnershipSchema.index({ name: 'text', description: 'text' })

export default mongoose.model('Partnership', partnershipSchema)