// src/models/ActivityLog.js
import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'], required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    details: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true }
)

activityLogSchema.index({ createdAt: -1 })

// Static method for easy logging
activityLogSchema.statics.log = async function (data) {
  return this.create(data)
}

export default mongoose.model('ActivityLog', activityLogSchema)