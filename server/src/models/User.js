// src/models/User.js
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },

    /**
     * superadmin — full access, the only role that can manage other accounts
     * editor     — full content access, no account management
     * reviewer   — scoped to `assignedEvents`: may review submissions, verify
     *              payments and issue tickets for those events only, and sees
     *              nothing else in the dashboard
     */
    role: { type: String, enum: ['superadmin', 'editor', 'reviewer'], default: 'editor' },

    /** Only meaningful for role 'reviewer'. Empty means they can see nothing. */
    assignedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],

    isActive: { type: Boolean, default: true },
    avatar: { type: String, default: null },
    lastLogin: { type: Date, default: null },
    refreshToken: { type: String, default: null, select: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

/** Event ids this user may act on, or null when they are not scoped at all. */
userSchema.methods.scopedEventIds = function () {
  if (this.role !== 'reviewer') return null
  return (this.assignedEvents || []).map((id) => String(id))
}

userSchema.methods.canAccessEvent = function (eventId) {
  const scope = this.scopedEventIds()
  if (scope === null) return true
  return scope.includes(String(eventId))
}

export default mongoose.model('User', userSchema)
