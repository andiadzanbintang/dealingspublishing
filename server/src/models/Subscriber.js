// src/models/Subscriber.js
import mongoose from 'mongoose'
import crypto from 'crypto'

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    unsubscribeToken: { type: String, default: null },
    status: { type: String, enum: ['active', 'unsubscribed', 'bounced'], default: 'active' },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

subscriberSchema.pre('save', function () {
  if (this.isNew) {
    this.verificationToken = crypto.randomBytes(32).toString('hex')
    this.unsubscribeToken = crypto.randomBytes(32).toString('hex')
  }
})

export default mongoose.model('Subscriber', subscriberSchema)