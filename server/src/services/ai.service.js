// src/services/ai.service.js
import { GoogleGenAI } from '@google/genai'
import Journal from '../models/Journal.js'
import Conversation from '../models/Conversation.js'
import { logger } from '../config/logger.js'

let genAI = null

const getChatModelName = () => process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it'
const getEmbeddingModelName = () => process.env.EMBEDDING_MODEL || 'text-embedding-004'

export const initAI = () => {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      logger.warn('GOOGLE_AI_API_KEY not set. AI features disabled.')
      return
    }

    genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    })

    logger.info(`Google GenAI initialized with model: ${getChatModelName()}`)
  } catch (error) {
    logger.warn(`AI init failed: ${error.message}`)
  }
}

export const generateEmbedding = async (text) => {
  if (!genAI) return []

  try {
    const result = await genAI.models.embedContent({
      model: getEmbeddingModelName(),
      contents: [text],
    })

    return result?.embeddings?.[0]?.values || []
  } catch (error) {
    logger.error(`Embedding failed: ${error.message}`)
    return []
  }
}

export const embedJournal = async (journal) => {
  const textToEmbed = [
    journal.title,
    journal.abstract,
    journal.keywords?.join(', '),
    journal.authors?.join(', '),
  ]
    .filter(Boolean)
    .join('. ')

  const embedding = await generateEmbedding(textToEmbed)

  if (embedding.length > 0) {
    await Journal.findByIdAndUpdate(journal._id, {
      embedding,
      embeddingText: textToEmbed,
    })
    logger.info(`Embedded journal: ${journal.title}`)
  }

  return embedding
}

const findRelevantJournals = async (query, limit = 5) => {
  try {
    const journals = await Journal.find(
      {
        status: 'published',
        $text: { $search: query },
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .populate('topic', 'name')
      .select('title slug abstract authors publicationDate topic keywords')

    return journals
  } catch (error) {
    logger.warn(`Text search failed, using regex fallback: ${error.message}`)

    const safeWords = query
      .split(/\s+/)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(Boolean)

    const regex = new RegExp(safeWords.join('|') || query, 'i')

    return Journal.find({
      status: 'published',
      $or: [{ title: regex }, { abstract: regex }, { keywords: regex }],
    })
      .limit(limit)
      .populate('topic', 'name')
      .select('title slug abstract authors publicationDate topic keywords')
  }
}

const generateAIText = async (prompt) => {
  if (!genAI) {
    throw new Error('Google GenAI client is not initialized.')
  }

  const primaryModel = getChatModelName()

  try {
    const response = await genAI.models.generateContent({
      model: primaryModel,
      contents: prompt,
    })

    return response.text
  } catch (error) {
    logger.error(`Primary model failed (${primaryModel}): ${error.message}`)

    // Fallback model for development/testing.
    // This helps separate “Gemma model/API issue” from “our app is broken”.
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.0-flash'

    if (fallbackModel && fallbackModel !== primaryModel) {
      logger.warn(`Trying fallback model: ${fallbackModel}`)

      const fallbackResponse = await genAI.models.generateContent({
        model: fallbackModel,
        contents: prompt,
      })

      return fallbackResponse.text
    }

    throw error
  }
}

export const chat = async ({ message, sessionId, journalId = null }) => {
  if (!genAI) {
    return {
      content:
        'AI assistant is currently unavailable. Please try again later or contact us directly.',
      sources: [],
    }
  }

  try {
    let conversation = await Conversation.findOne({ sessionId })
    if (!conversation) {
      conversation = new Conversation({ sessionId, messages: [] })
    }

    let contextJournals = []

    if (journalId) {
      const journal = await Journal.findById(journalId)
        .populate('topic', 'name')
        .select('title slug abstract authors publicationDate topic keywords')

      if (journal) contextJournals = [journal]
    } else {
      contextJournals = await findRelevantJournals(message)
    }

    const journalContext = contextJournals
      .map(
        (j, i) =>
          `[Journal ${i + 1}] "${j.title}" by ${
            j.authors?.join(', ') || 'Unknown author'
          }. Topic: ${j.topic?.name || 'N/A'}. Abstract: ${
            j.abstract || 'No abstract available.'
          }`
      )
      .join('\n\n')

    const historyMessages = conversation.messages
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n')

    const systemPrompt = `You are a knowledgeable research assistant for ResearchHub, a research publishing company. Your role is to help users understand published journals, research topics, and the company's work.

RULES:
- Only answer based on the provided context.
- If no relevant journal context is provided, say that you do not have specific information in the published journals yet.
- Always mention which journal(s) your answer is based on when sources are available.
- Be professional, clear, and helpful.
- Keep responses concise but thorough.
- Use markdown formatting.

CONTEXT (Published Journals):
${journalContext || 'No specific journals found for this query.'}

CONVERSATION HISTORY:
${historyMessages || 'No previous messages.'}

USER QUESTION:
${message}`

    const responseText = await generateAIText(systemPrompt)

    const sources = contextJournals.map((j) => ({
      journalId: j._id,
      title: j.title,
      slug: j.slug,
      relevanceScore: 1,
    }))

    conversation.messages.push({ role: 'user', content: message })
    conversation.messages.push({
      role: 'assistant',
      content: responseText,
      sources,
    })

    if (conversation.messages.length > 20) {
      conversation.messages = conversation.messages.slice(-20)
    }

    await conversation.save()

    return { content: responseText, sources }
  } catch (error) {
    logger.error(`AI chat error: ${error.message}`)
    logger.error(error.stack || JSON.stringify(error))

    return {
      content:
        'I encountered an error processing your request. Please try again.',
      sources: [],
    }
  }
}

export const reindexAllJournals = async () => {
  const journals = await Journal.find({ status: 'published' })
  let count = 0

  for (const journal of journals) {
    await embedJournal(journal)
    count++
  }

  logger.info(`Reindexed ${count} journals`)
  return count
}