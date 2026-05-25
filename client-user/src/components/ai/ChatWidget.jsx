import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { aiAPI } from '@/services/api'

const suggestedQuestions = [
  'What research topics do you cover?',
  'Tell me about your latest journals',
  'How can I submit a paper?',
  'What is your peer review process?',
]

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('aiSessionId') || null
  })
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! 👋 I'm the ResearchHub AI assistant. I can help you explore our journals, understand research topics, and answer questions about our publications. How can I help you today?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen]) 

  const sendMessage = async (question) => {
    if (!question.trim() || isLoading) return

    const userMessage = question.trim()
    setInput('')
    setError('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await aiAPI.chat({
        message: userMessage,
        sessionId,
      })

      const newSessionId = response?.data?.sessionId
      if (newSessionId && newSessionId !== sessionId) {
        setSessionId(newSessionId)
        localStorage.setItem('aiSessionId', newSessionId)
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response?.data?.message || 'Sorry, I could not generate a response.',
          sources: response?.data?.sources || [],
        },
      ])
    } catch (err) {
      console.error(err)
      setError('AI assistant is currently unavailable. Please try again later.')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I could not process your question right now. Please try again later.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = () => {
    sendMessage(input)
  }

  const handleSuggestedClick = (question) => {
    sendMessage(question)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg shadow-primary-600/30 flex items-center justify-center transition-colors"
            aria-label="Open AI Chat"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 bg-primary-600 text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Research Assistant</h3>
                  <p className="text-xs text-primary-100">Powered by Gemma</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-neutral-100 text-neutral-800 rounded-bl-md'
                    )}
                  >
                    {msg.content}

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-200/50">
                        <p className="text-xs text-neutral-500 mb-1.5">Sources:</p>
                        {msg.sources.map((source, sIdx) => (
                          <a
                            key={sIdx}
                            href={`/journals/${source.slug}`}
                            className="block text-xs text-primary-600 hover:underline truncate"
                          >
                            📄 {source.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-neutral-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-danger-500 text-center">{error}</p>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 2 && !isLoading && (
              <div className="px-5 pb-3 flex-shrink-0">
                <p className="text-xs text-neutral-400 mb-2">Suggested questions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedClick(q)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-600 rounded-full transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-4 py-3 border-t border-neutral-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}