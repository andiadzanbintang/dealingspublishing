// src/models/Conversation.js
import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sources: [
    {
      journalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Journal' },
      title: String,
      relevanceScore: Number,
    },
  ],
  timestamp: { type: Date, default: Date.now },
})

const conversationSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    messages: [messageSchema],
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
)

// TTL index — auto-delete after expiry
conversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Conversation', conversationSchema)