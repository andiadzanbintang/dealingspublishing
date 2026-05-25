// src/controllers/ai.controller.js
import { chat, reindexAllJournals } from '../services/ai.service.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'
import { v4 as uuidv4 } from 'uuid'
import Conversation from '../models/Conversation.js'

// Public: Chat with AI
export const chatWithAI = catchAsync(async (req, res, next) => {
  const { message, sessionId, journalId } = req.body 

  if (!message || message.trim().length === 0) {
    return next(new AppError('Message is required', 400))
  }

  if (message.length > 2000) {
    return next(new AppError('Message too long. Max 2000 characters.', 400))
  }

  const activeSessionId = sessionId || uuidv4()

  const response = await chat({
    message: message.trim(),
    sessionId: activeSessionId,
    journalId,
  })

  res.status(200).json({
    status: 'success',
    data: {
      sessionId: activeSessionId,
      message: response.content,
      sources: response.sources,
    },
  })
})

// Public: Get conversation history
export const getConversation = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params

  const conversation = await Conversation.findOne({ sessionId })

  if (!conversation) {
    return res.status(200).json({
      status: 'success',
      data: { sessionId, messages: [] },
    })
  }

  res.status(200).json({
    status: 'success',
    data: {
      sessionId,
      messages: conversation.messages,
    },
  })
})

// Admin: Reindex all journals for AI
export const reindex = catchAsync(async (req, res) => {
  const count = await reindexAllJournals()

  res.status(200).json({
    status: 'success',
    message: `Reindexed ${count} journals for AI search`,
  })
})