// src/pages/AIConfigPage.jsx
import { useState } from 'react'
import {
  Bot,
  RefreshCw,
  Save,
  Loader2,
  MessageCircle,
  Zap,
  Database,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import { aiConfigAPI } from '@/services/api'

const defaultSystemPrompt = `You are a knowledgeable research assistant for ResearchHub, a research publishing company. Your role is to help users understand published journals, research topics, and the company's work.

RULES:
- Only answer based on the provided context (retrieved journals)
- If you don't know, say "I don't have information about that in our published journals"
- Always cite which journal(s) your answer is based on
- Be professional, clear, and helpful
- Keep responses concise but thorough`

export default function AIConfigPage() {
  const [loading, setLoading] = useState(false)
  const [reindexing, setReindexing] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState(defaultSystemPrompt)
  const [maxMessages, setMaxMessages] = useState('20')
  const [temperature, setTemperature] = useState('0.7')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      // Backend does not yet have an endpoint for saving AI config.
      // This keeps the UI state editable without pretending it is persisted.
      setSuccessMessage(
        'AI configuration is updated locally only. Backend config persistence is not implemented yet.'
      )
    } catch (err) {
      console.error(err)
      setError('Failed to update AI configuration.')
    } finally {
      setLoading(false)
    }
  }

  const handleReindex = async () => {
    setReindexing(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await aiConfigAPI.reindex()

      setSuccessMessage(
        response?.message ||
          'All published journals have been reindexed successfully.'
      )
    } catch (err) {
      console.error('Failed to reindex journals:', err)
      setError(
        err.response?.data?.message ||
          'Failed to reindex journals. Please check your AI API key, model, quota, and server logs.'
      )
    } finally {
      setReindexing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            AI Configuration
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your research assistant settings and journal reindexing.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Config
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 bg-success-50 border border-success-200 text-success-600 rounded-xl px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Conversations"
          value="—"
          icon={MessageCircle}
          color="primary"
        />
        <StatCard
          title="Messages Today"
          value="—"
          icon={Zap}
          color="success"
        />
        <StatCard
          title="Indexed Journals"
          value="Use Reindex"
          icon={Database}
          color="warning"
        />
      </div>

      {/* Backend Status Note */}
      <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
        <p className="text-sm text-warning-700">
          Current backend support is limited to journal reindexing. AI prompt,
          temperature, message limits, and conversation analytics need additional
          backend endpoints before they can be persisted or reported accurately.
        </p>
      </div>

      {/* System Prompt */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              System Prompt
            </h2>
            <p className="text-xs text-neutral-500">
              Editable in the UI, but not persisted to backend yet.
            </p>
          </div>
        </div>

        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Parameters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-neutral-900">Parameters</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Max Messages per Session (per hour)
            </label>
            <input
              type="number"
              value={maxMessages}
              onChange={(e) => setMaxMessages(e.target.value)}
              min="5"
              max="100"
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Current backend rate limit is still controlled in server
              middleware.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Temperature (creativity: 0.0 - 1.0)
            </label>
            <input
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              min="0"
              max="1"
              step="0.1"
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-neutral-400">
              This requires backend AI service support before it affects
              responses.
            </p>
          </div>
        </div>
      </div>

      {/* Reindex */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Vector Index
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Re-embed all published journal content for AI retrieval. Run this
              after adding, editing, or bulk-updating journals.
            </p>
          </div>

          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="flex items-center gap-2 px-5 py-2.5 bg-warning-500 hover:bg-warning-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 ${reindexing ? 'animate-spin' : ''}`}
            />
            {reindexing ? 'Reindexing...' : 'Reindex All Journals'}
          </button>
        </div>
      </div>
    </div>
  )
}