// src/pages/EmailDeliveryPage.jsx
import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Info,
  Mail,
  RefreshCw,
  Send,
  ServerCog,
  XCircle,
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { emailAPI } from '@/services/api'

const inputClass =
  'w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'

/**
 * Answers "is outgoing email actually working?" without anyone having to read
 * the server logs. Everything here reports what the mail server really said —
 * a message the SMTP host refused is never shown as sent.
 */
export default function EmailDeliveryPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [recipient, setRecipient] = useState('')
  const [sending, setSending] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [showPresets, setShowPresets] = useState(false)

  const fetchHealth = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await emailAPI.getHealth()
      setHealth(response?.data || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not read the email configuration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  const handleTest = async (e) => {
    e.preventDefault()
    setSending(true)
    setTestResult(null)

    try {
      const response = await emailAPI.sendTest(recipient.trim())
      setTestResult({ ok: true, message: response.message, data: response.data })
    } catch (err) {
      const body = err.response?.data
      setTestResult({
        ok: false,
        message: body?.message || 'The test could not be sent.',
        data: body?.data,
      })
    } finally {
      setSending(false)
      fetchHealth()
    }
  }

  const config = health?.config
  const verification = health?.verification

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-neutral-900">Email delivery</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Every ticket, invoice, reviewer credential and organiser alert leaves
            through the SMTP account configured in <code>server/.env</code>. Use this
            page to confirm it works before an event opens.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Re-check
        </button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && !health ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Testing the connection...</p>
          </div>
        </div>
      ) : (
        health && (
          <>
            {/* ═══ Connection status ═══ */}
            <div
              className={`rounded-xl border p-6 ${
                verification?.ok
                  ? 'bg-success-50 border-success-200'
                  : 'bg-danger-50 border-danger-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {verification?.ok ? (
                  <CheckCircle2 className="w-6 h-6 text-success-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-danger-600 flex-shrink-0 mt-0.5" />
                )}

                <div className="min-w-0">
                  <p
                    className={`font-semibold ${
                      verification?.ok ? 'text-success-700' : 'text-danger-700'
                    }`}
                  >
                    {verification?.ok
                      ? 'Connected — the mail server accepted these credentials'
                      : 'Not connected — nothing can be sent right now'}
                  </p>

                  {!verification?.ok && verification?.error && (
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="text-danger-800">
                        <span className="text-danger-500">Server said: </span>
                        <span className="font-mono text-xs break-all">
                          {verification.error.response}
                        </span>
                      </p>
                      {verification.error.hint && (
                        <p className="text-danger-700 leading-relaxed">
                          {verification.error.hint}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ Current configuration ═══ */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
                <ServerCog className="w-4 h-4 text-neutral-400" />
                <h2 className="text-sm font-semibold text-neutral-900">
                  Current configuration
                </h2>
              </div>

              <dl className="divide-y divide-neutral-100">
                <Row label="SMTP host" value={config?.host} mono />
                <Row label="Port" value={config?.port} mono />
                <Row label="Encryption" value={config?.encryption} />
                <Row label="Username" value={config?.user} mono />
                <Row
                  label="Password"
                  value={config?.hasPassword ? 'Set' : 'Not set'}
                  tone={config?.hasPassword ? '' : 'text-danger-600'}
                />
                <Row label="Sends from" value={config?.from} mono />
                <Row label="Display name" value={config?.fromName} />
                {config?.replyTo && <Row label="Reply-To" value={config.replyTo} mono />}
              </dl>

              {config?.missing?.length > 0 && (
                <div className="px-6 py-4 bg-danger-50 border-t border-danger-200">
                  <p className="text-sm text-danger-700">
                    Missing from <code>.env</code>: {config.missing.join(', ')}
                  </p>
                </div>
              )}

              <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100">
                <p className="text-xs text-neutral-500">
                  These come from <code>server/.env</code>. Changing them needs a server
                  restart — the settings are read once at startup.
                </p>
              </div>
            </div>

            {/* ═══ Send a test ═══ */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center gap-2 mb-1">
                <Send className="w-4 h-4 text-neutral-400" />
                <h2 className="text-sm font-semibold text-neutral-900">
                  Send a test message
                </h2>
              </div>
              <p className="text-sm text-neutral-500 mb-5">
                Sends one real email and shows exactly what the mail server replied.
              </p>

              <form onSubmit={handleTest} className="flex flex-wrap gap-3">
                <input
                  type="email"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="you@example.com"
                  className={`${inputClass} flex-1 min-w-[260px]`}
                />
                <button
                  type="submit"
                  disabled={sending || !recipient.trim()}
                  className="flex items-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {sending ? 'Sending…' : 'Send test'}
                </button>
              </form>

              {testResult && (
                <div
                  className={`mt-5 rounded-xl border p-4 ${
                    testResult.ok
                      ? 'bg-success-50 border-success-200'
                      : 'bg-danger-50 border-danger-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {testResult.ok ? (
                      <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 text-sm">
                      <p
                        className={
                          testResult.ok
                            ? 'text-success-800 font-medium'
                            : 'text-danger-800 font-medium'
                        }
                      >
                        {testResult.message}
                      </p>

                      {testResult.data?.error?.hint && (
                        <p className="mt-2 text-danger-700 leading-relaxed">
                          {testResult.data.error.hint}
                        </p>
                      )}

                      {testResult.data?.messageId && (
                        <p className="mt-2 text-xs font-mono text-success-700 break-all">
                          {testResult.data.messageId}
                        </p>
                      )}

                      {testResult.ok && (
                        <p className="mt-2 text-xs text-success-700">
                          Accepted by the mail server. If it never arrives, it was
                          dropped after acceptance — check the provider dashboard for
                          bounces and confirm SPF, DKIM and DMARC on the sending domain.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ═══ Recent attempts ═══ */}
            {health.recentAttempts?.length > 0 && (
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100">
                  <h2 className="text-sm font-semibold text-neutral-900">
                    Recent attempts
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Since the server last started. Not stored permanently.
                  </p>
                </div>

                <ul className="divide-y divide-neutral-100 max-h-80 overflow-y-auto">
                  {health.recentAttempts.map((attempt, index) => (
                    <li key={index} className="px-6 py-3 flex items-start gap-3">
                      {attempt.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-neutral-800 truncate">
                          {attempt.subject}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          {attempt.to} · {formatDateTime(attempt.at)}
                        </p>
                        {!attempt.ok && attempt.error?.response && (
                          <p className="mt-1 text-xs text-danger-600 break-all">
                            {attempt.error.response}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ═══ Provider presets ═══ */}
            {health.presets?.length > 0 && (
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <button
                  onClick={() => setShowPresets((v) => !v)}
                  className="w-full px-6 py-4 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-semibold text-neutral-900">
                      Known-good settings per provider
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform ${
                      showPresets ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showPresets && (
                  <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                    {health.presets.map((preset) => (
                      <div key={preset.id} className="px-6 py-4">
                        <p className="text-sm font-medium text-neutral-900">
                          {preset.name}
                        </p>
                        <dl className="mt-2 space-y-1 text-xs">
                          <PresetRow label="Host" value={preset.host} />
                          <PresetRow label="Ports" value={preset.ports.join(' or ')} />
                          <PresetRow label="Username" value={preset.user} />
                          <PresetRow label="Password" value={preset.pass} />
                        </dl>
                        <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
                          {preset.note}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-neutral-400 text-center">
              For the raw SMTP conversation, run{' '}
              <code className="text-neutral-500">npm run email:test -- you@example.com</code>{' '}
              in the server folder.
            </p>
          </>
        )
      )}
    </div>
  )
}

function Row({ label, value, mono, tone }) {
  return (
    <div className="px-6 py-3 flex items-start justify-between gap-6">
      <dt className="text-sm text-neutral-500 flex-shrink-0">{label}</dt>
      <dd
        className={`text-sm text-right break-all ${tone || 'text-neutral-900'} ${
          mono ? 'font-mono text-xs' : 'font-medium'
        }`}
      >
        {value ?? '—'}
      </dd>
    </div>
  )
}

function PresetRow({ label, value }) {
  return (
    <div className="flex items-start gap-2">
      <dt className="text-neutral-400 w-20 flex-shrink-0">{label}</dt>
      <dd className="text-neutral-700 break-all">{value}</dd>
    </div>
  )
}
