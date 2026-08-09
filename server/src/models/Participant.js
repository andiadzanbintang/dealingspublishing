// src/models/Participant.js
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    // Default profile values, pre-filled into every registration form
    phone: { type: String, default: '' },
    affiliation: { type: String, default: '' },
    country: { type: String, default: '' },

    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    refreshToken: { type: String, default: null, select: false },
  },
  { timestamps: true }
)

participantSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

participantSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model('Participant', participantSchema)
