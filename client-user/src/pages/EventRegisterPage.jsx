// src/pages/EventRegisterPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  MapPin,
  Send,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { useParticipantAuth } from '@/hooks/useParticipantAuth'
import { registrationAPI } from '@/services/api'
import { cn, formatDate, formatIDR, formatUSD, formatFileSize } from '@/lib/utils'

const PHONE_PATTERN = /^\+[1-9]\d{0,3}[\s-]?\d[\d\s-]{5,17}$/

const ACCEPTED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const STEPS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'manuscript', label: 'Manuscript', icon: FileText },
  { key: 'attendance', label: 'Attendance', icon: Users },
  { key: 'documents', label: 'Documents', icon: Upload },
  { key: 'review', label: 'Review', icon: Check },
]

const inputClass =
  'w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'

const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5'

// ═══════════════════════════════════════════════════════════
// Keyword chip input
// ═══════════════════════════════════════════════════════════
function KeywordInput({ value, onChange, min, max }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const keyword = draft.trim().replace(/,$/, '')
    if (!keyword) return
    if (value.length >= max) return
    if (value.some((k) => k.toLowerCase() === keyword.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, keyword])
    setDraft('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add()
    }
    if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 min-h-[52px] px-3 py-2 bg-neutral-50 border rounded-xl transition-colors',
          value.length >= min && value.length <= max
            ? 'border-neutral-200'
            : 'border-amber-300'
        )}
      >
        {value.map((keyword) => (
          <span
            key={keyword}
            className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg"
          >
            {keyword}
            <button
              type="button"
              onClick={() => onChange(value.filter((k) => k !== keyword))}
              className="text-primary-400 hover:text-primary-700"
              aria-label={`Remove ${keyword}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={add}
          disabled={value.length >= max}
          placeholder={
            value.length >= max
              ? `Maximum ${max} keywords reached`
              : 'Type a keyword and press Enter'
          }
          className="flex-1 min-w-[180px] bg-transparent text-sm px-1 py-1.5 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      <p className="mt-1.5 text-xs text-neutral-400">
        {value.length} of {min}–{max} keywords. Press Enter or comma to add.
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// File picker
// ═══════════════════════════════════════════════════════════
function DocumentPicker({ file, onChange, maxMb, existingFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState('')

  const accept = (candidate) => {
    setLocalError('')

    if (!candidate) return

    if (!ACCEPTED_MIME.includes(candidate.type)) {
      setLocalError('Only Microsoft Word (.doc, .docx) or PDF files are accepted.')
      return
    }

    if (candidate.size > maxMb * 1024 * 1024) {
      setLocalError(`File is ${formatFileSize(candidate.size)} — the limit is ${maxMb} MB.`)
      return
    }

    onChange(candidate)
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          accept(e.dataTransfer.files?.[0])
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors',
          dragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-neutral-300 bg-neutral-50 hover:border-primary-400 hover:bg-primary-50/40'
        )}
      >
        <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center">
          <Upload className="w-5 h-5 text-neutral-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-800">
            {file ? 'Choose a different file' : 'Click to upload or drag your file here'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Microsoft Word or PDF · maximum {maxMb} MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => accept(e.target.files?.[0])}
          className="hidden"
        />
      </div>

      {localError && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="w-3.5 h-3.5" />
          {localError}
        </p>
      )}

      {file && (
        <div className="mt-3 flex items-center justify-between gap-3 px-4 py-3 bg-white border border-neutral-200 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-4 h-4 text-primary-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">{file.name}</p>
              <p className="text-xs text-neutral-400">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!file && existingFile?.url && (
        <div className="mt-3 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 truncate">
            Keeping your previously uploaded file:{' '}
            <span className="font-medium">{existingFile.originalName || 'abstract'}</span>
          </p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════
export default function EventRegisterPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { participant } = useParticipantAuth()

  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  const [form, setForm] = useState({
    fullName: '',
    affiliation: '',
    email: '',
    phone: '',
    country: '',
    manuscriptTitle: '',
    abstract: '',
    keywords: [],
    outputType: '',
    attendanceRole: '',
    attendanceMode: '',
  })
  const [abstractFile, setAbstractFile] = useState(null)

  const setField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }))

  // ── Load event + form configuration ──
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setLoadError('')

      try {
        const response = await registrationAPI.getEventConfig(slug)
        if (cancelled) return

        const data = response?.data
        setConfig(data)

        // An active registration already exists — send them to its status page
        const existing = data?.myRegistration
        if (existing && existing.submissionStatus !== 'rejected') {
          navigate(`/my/registrations/${existing._id}`, { replace: true })
          return
        }

        // Prefill: previous rejected submission first, then the account profile
        setForm((prev) => ({
          ...prev,
          fullName: existing?.profile?.fullName || participant?.name || '',
          affiliation: existing?.profile?.affiliation || participant?.affiliation || '',
          email: existing?.profile?.email || participant?.email || '',
          phone: existing?.profile?.phone || participant?.phone || '',
          country: existing?.profile?.country || participant?.country || '',
          manuscriptTitle: existing?.manuscript?.title || '',
          abstract: existing?.manuscript?.abstract || '',
          keywords: existing?.manuscript?.keywords || [],
          outputType: existing?.manuscript?.outputType || '',
          attendanceRole: existing?.attendance?.role || '',
          attendanceMode: existing?.attendance?.mode || '',
        }))
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err.response?.data?.message ||
              'Could not load the registration form for this event.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug, participant, navigate])

  const cfg = config?.registration || {}
  const event = config?.event
  const existingRegistration = config?.myRegistration
  const isResubmission = existingRegistration?.submissionStatus === 'rejected'

  const keywordsMin = cfg.keywordsMin ?? 3
  const keywordsMax = cfg.keywordsMax ?? 5
  const maxAbstractMb = cfg.maxAbstractSizeMb ?? 15
  const requireManuscript = cfg.requireManuscript !== false
  const requireAbstractFile = cfg.requireAbstractFile !== false

  const steps = useMemo(
    () => STEPS.filter((s) => (s.key === 'manuscript' ? requireManuscript : true)),
    [requireManuscript]
  )

  const selectedFee = useMemo(() => {
    if (!form.attendanceRole || !form.attendanceMode) return null
    return (
      (cfg.fees || []).find(
        (f) => f.role === form.attendanceRole && f.mode === form.attendanceMode
      ) || null
    )
  }, [cfg.fees, form.attendanceRole, form.attendanceMode])

  // ── Per-step validation ──
  const validateStep = (key) => {
    if (key === 'profile') {
      if (!form.fullName.trim()) return 'Full name is required.'
      if (!form.affiliation.trim()) return 'Affiliation (institution or university) is required.'
      if (!form.email.trim()) return 'Email is required.'
      if (!PHONE_PATTERN.test(form.phone.trim()))
        return 'Phone must start with a country code, for example +6281234567890.'
    }

    if (key === 'manuscript' && requireManuscript) {
      if (!form.manuscriptTitle.trim()) return 'Article / journal title is required.'
      if (!form.abstract.trim()) return 'Abstract is required.'
      if (form.keywords.length < keywordsMin || form.keywords.length > keywordsMax)
        return `Please provide between ${keywordsMin} and ${keywordsMax} keywords.`
      if ((cfg.outputTypes || []).length && !form.outputType)
        return 'Please choose an output type.'
    }

    if (key === 'attendance') {
      if (!form.attendanceRole) return 'Please choose presenter or participant.'
      if (!form.attendanceMode) return 'Please choose online or offline attendance.'
      if (!selectedFee) return 'No fee is configured for this combination. Please contact the organiser.'
    }

    if (key === 'documents' && requireAbstractFile) {
      if (!abstractFile && !existingRegistration?.abstractFile?.url)
        return 'Please upload your abstract (Microsoft Word or PDF).'
    }

    return ''
  }

  const goNext = () => {
    const message = validateStep(steps[step].key)
    if (message) {
      setError(message)
      return
    }
    setError('')
    setStep((s) => Math.min(s + 1, steps.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    for (const s of steps) {
      if (s.key === 'review') continue
      const message = validateStep(s.key)
      if (message) {
        setError(message)
        return
      }
    }

    setSubmitting(true)
    setError('')
    setProgress(0)

    try {
      const payload = new FormData()
      payload.append('fullName', form.fullName.trim())
      payload.append('affiliation', form.affiliation.trim())
      payload.append('email', form.email.trim().toLowerCase())
      payload.append('phone', form.phone.trim())
      payload.append('country', form.country.trim())
      payload.append('manuscriptTitle', form.manuscriptTitle.trim())
      payload.append('abstract', form.abstract.trim())
      payload.append('keywords', JSON.stringify(form.keywords))
      payload.append('outputType', form.outputType)
      payload.append('attendanceRole', form.attendanceRole)
      payload.append('attendanceMode', form.attendanceMode)

      if (abstractFile) payload.append('abstractFile', abstractFile)

      const response = await registrationAPI.submit(slug, payload, (e) => {
        if (e.total) setProgress(Math.round((e.loaded * 100) / e.total))
      })

      const registration = response?.data
      navigate(`/my/registrations/${registration._id}`, {
        replace: true,
        state: { justSubmitted: true },
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Submission failed. Please check your details and try again.'
      )
      setSubmitting(false)
    }
  }

  // ── Loading / error shells ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-neutral-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-neutral-500 text-sm">Loading registration form…</p>
        </div>
      </div>
    )
  }

  if (loadError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🎪</div>
          <h1 className="text-2xl font-bold text-neutral-900">Registration unavailable</h1>
          <p className="mt-2 text-neutral-500">{loadError || 'Event not found.'}</p>
          <Link to="/events">
            <Button variant="primary" className="mt-6" icon={ArrowLeft} iconPosition="left">
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!config.isOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-neutral-900">Registration is closed</h1>
          <p className="mt-2 text-neutral-500">
            Registration for {event.title} is not open at the moment.
          </p>
          <Link to={`/events/${event.slug}`}>
            <Button variant="primary" className="mt-6" icon={ArrowLeft} iconPosition="left">
              Back to event
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentKey = steps[step].key

  return (
    <>
      <Helmet>
        <title>Register — {event.title}</title>
      </Helmet>

      {/* ═══ Header ═══ */}
      <section className="pt-28 pb-10 bg-neutral-900">
        <div className="container-custom">
          <Link
            to={`/events/${event.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to event
          </Link>

          <h1 className="mt-4 text-2xl md:text-3xl font-bold text-white leading-snug max-w-4xl">
            {event.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(event.eventDate)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {event.location}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ═══ Wizard ═══ */}
      <section className="py-12 bg-neutral-50 min-h-[60vh]">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Steps rail */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-28 bg-white rounded-2xl border border-neutral-200 p-5">
                <p className="text-xs uppercase tracking-wider text-neutral-400 mb-4">
                  Registration steps
                </p>

                <ol className="space-y-1">
                  {steps.map((s, index) => {
                    const done = index < step
                    const active = index === step

                    return (
                      <li key={s.key}>
                        <button
                          type="button"
                          onClick={() => index < step && setStep(index)}
                          disabled={index > step}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left',
                            active && 'bg-primary-50 text-primary-700 font-medium',
                            done && 'text-neutral-600 hover:bg-neutral-50 cursor-pointer',
                            !active && !done && 'text-neutral-400 cursor-default'
                          )}
                        >
                          <span
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold',
                              active && 'bg-primary-600 text-white',
                              done && 'bg-emerald-100 text-emerald-700',
                              !active && !done && 'bg-neutral-100 text-neutral-400'
                            )}
                          >
                            {done ? <Check className="w-3.5 h-3.5" /> : index + 1}
                          </span>
                          {s.label}
                        </button>
                      </li>
                    )
                  })}

                  {/* Post-submission stages, shown greyed out for context */}
                  {['Waiting room', 'Payment'].map((label, index) => (
                    <li key={label}>
                      <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-300">
                        <span className="w-7 h-7 rounded-lg bg-neutral-50 border border-dashed border-neutral-200 flex items-center justify-center text-xs font-semibold">
                          {steps.length + index + 1}
                        </span>
                        {label}
                      </div>
                    </li>
                  ))}
                </ol>

                {selectedFee && (
                  <div className="mt-5 pt-5 border-t border-neutral-100">
                    <p className="text-xs uppercase tracking-wider text-neutral-400">
                      Your registration fee
                    </p>
                    <p className="mt-2 text-lg font-bold text-neutral-900">
                      {formatIDR(selectedFee.amountIdr)}
                    </p>
                    <p className="text-sm text-neutral-500">{formatUSD(selectedFee.amountUsd)}</p>
                    <p className="mt-2 text-xs text-neutral-400">
                      Payable only after your abstract is accepted.
                    </p>
                  </div>
                )}
              </div>
            </aside>

            {/* Form panel */}
            <div className="lg:col-span-2">
              <motion.div
                key={currentKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8"
              >
                {isResubmission && step === 0 && (
                  <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-medium text-amber-800">
                      You are revising submission #{existingRegistration.submissionCount}
                    </p>
                    {existingRegistration.reviewNote && (
                      <p className="mt-1 text-sm text-amber-700">
                        Reviewer note: {existingRegistration.reviewNote}
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* ── 1. PROFILE ── */}
                {currentKey === 'profile' && (
                  <div className="space-y-5">
                    <header>
                      <h2 className="text-xl font-bold text-neutral-900">Profile</h2>
                      <p className="mt-1 text-sm text-neutral-500">
                        How you will be listed in the participant records and on your ticket.
                      </p>
                    </header>

                    <div>
                      <label className={labelClass}>
                        Full name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={form.fullName}
                        onChange={setField('fullName')}
                        placeholder="Dr. Abdillah Rahman"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Affiliation <span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={form.affiliation}
                        onChange={setField('affiliation')}
                        placeholder="Universitas Islam Riau"
                        className={inputClass}
                      />
                      <p className="mt-1 text-xs text-neutral-400">
                        Institution or university you represent.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>
                          Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={setField('email')}
                          placeholder="you@university.ac.id"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Phone / WhatsApp <span className="text-rose-500">*</span>
                        </label>
                        <input
                          value={form.phone}
                          onChange={setField('phone')}
                          placeholder="+6281234567890"
                          className={inputClass}
                        />
                        <p className="mt-1 text-xs text-neutral-400">
                          Start with your country code. Indonesia: +62 · Malaysia: +60 ·
                          United States: +1
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Country</label>
                      <input
                        value={form.country}
                        onChange={setField('country')}
                        placeholder="Indonesia"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                {/* ── 2. MANUSCRIPT ── */}
                {currentKey === 'manuscript' && (
                  <div className="space-y-5">
                    <header>
                      <h2 className="text-xl font-bold text-neutral-900">Manuscript</h2>
                      <p className="mt-1 text-sm text-neutral-500">
                        Abstract details only — the full chapter is submitted later.
                      </p>
                    </header>

                    <div>
                      <label className={labelClass}>
                        Article / journal title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={form.manuscriptTitle}
                        onChange={setField('manuscriptTitle')}
                        placeholder="Digital Governance and Public Trust in Southeast Asia"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Abstract <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={9}
                        value={form.abstract}
                        onChange={setField('abstract')}
                        placeholder="Paste your abstract here…"
                        className={cn(inputClass, 'resize-y leading-relaxed')}
                      />
                      <p className="mt-1 text-xs text-neutral-400">
                        {form.abstract.trim().split(/\s+/).filter(Boolean).length} words
                      </p>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Keywords <span className="text-rose-500">*</span>
                      </label>
                      <KeywordInput
                        value={form.keywords}
                        onChange={(keywords) => setForm((p) => ({ ...p, keywords }))}
                        min={keywordsMin}
                        max={keywordsMax}
                      />
                    </div>

                    {(cfg.outputTypes || []).length > 0 && (
                      <div>
                        <label className={labelClass}>
                          Preferred output <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {cfg.outputTypes.map((option) => {
                            const active = form.outputType === option.value
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  setForm((p) => ({ ...p, outputType: option.value }))
                                }
                                className={cn(
                                  'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                                  active
                                    ? 'border-primary-600 bg-primary-50'
                                    : 'border-neutral-200 hover:border-neutral-300'
                                )}
                              >
                                <span
                                  className={cn(
                                    'mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                    active ? 'border-primary-600' : 'border-neutral-300'
                                  )}
                                >
                                  {active && (
                                    <span className="w-2 h-2 rounded-full bg-primary-600" />
                                  )}
                                </span>
                                <span className="text-sm font-medium text-neutral-800">
                                  {option.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 3. ATTENDANCE ── */}
                {currentKey === 'attendance' && (
                  <div className="space-y-6">
                    <header>
                      <h2 className="text-xl font-bold text-neutral-900">Attendance</h2>
                      <p className="mt-1 text-sm text-neutral-500">
                        Your attendance type determines the registration fee.
                      </p>
                    </header>

                    <div>
                      <label className={labelClass}>
                        I am joining as <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          {
                            value: 'presenter',
                            title: 'Presenter',
                            description: 'Submitting an abstract and presenting at the conference.',
                          },
                          {
                            value: 'participant',
                            title: 'Participant',
                            description: 'Attending without presenting a paper.',
                          },
                        ].map((option) => {
                          const active = form.attendanceRole === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setForm((p) => ({ ...p, attendanceRole: option.value }))
                              }
                              className={cn(
                                'p-5 rounded-xl border-2 text-left transition-all',
                                active
                                  ? 'border-primary-600 bg-primary-50'
                                  : 'border-neutral-200 hover:border-neutral-300'
                              )}
                            >
                              <p className="font-semibold text-neutral-900">{option.title}</p>
                              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                                {option.description}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Attendance mode <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {['offline', 'online'].map((mode) => {
                          const active = form.attendanceMode === mode
                          const fee = (cfg.fees || []).find(
                            (f) => f.role === form.attendanceRole && f.mode === mode
                          )

                          return (
                            <button
                              key={mode}
                              type="button"
                              disabled={!form.attendanceRole}
                              onClick={() => setForm((p) => ({ ...p, attendanceMode: mode }))}
                              className={cn(
                                'p-5 rounded-xl border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                                active
                                  ? 'border-primary-600 bg-primary-50'
                                  : 'border-neutral-200 hover:border-neutral-300'
                              )}
                            >
                              <p className="font-semibold text-neutral-900 capitalize">
                                {mode === 'offline' ? 'Offline (on site)' : 'Online'}
                              </p>
                              {fee ? (
                                <>
                                  <p className="mt-2 text-lg font-bold text-primary-700">
                                    {formatIDR(fee.amountIdr)}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {formatUSD(fee.amountUsd)}
                                  </p>
                                </>
                              ) : (
                                <p className="mt-2 text-xs text-neutral-400">
                                  {form.attendanceRole
                                    ? 'Fee not configured'
                                    : 'Choose presenter or participant first'}
                                </p>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {(cfg.fees || []).length > 0 && (
                      <div className="rounded-xl border border-neutral-200 overflow-hidden">
                        <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                          <p className="text-xs uppercase tracking-wider text-neutral-500">
                            All registration fees
                          </p>
                        </div>
                        <table className="w-full text-sm">
                          <tbody>
                            {cfg.fees.map((fee) => (
                              <tr
                                key={`${fee.role}-${fee.mode}`}
                                className="border-b border-neutral-100 last:border-0"
                              >
                                <td className="px-4 py-3 text-neutral-700 capitalize">
                                  {fee.label || `${fee.role} — ${fee.mode}`}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-neutral-900 whitespace-nowrap">
                                  {formatIDR(fee.amountIdr)}
                                </td>
                                <td className="px-4 py-3 text-right text-neutral-500 whitespace-nowrap">
                                  {formatUSD(fee.amountUsd)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 4. DOCUMENTS ── */}
                {currentKey === 'documents' && (
                  <div className="space-y-5">
                    <header>
                      <h2 className="text-xl font-bold text-neutral-900">Upload abstract</h2>
                      <p className="mt-1 text-sm text-neutral-500">
                        Upload the abstract only — not the full paper. The full chapter is
                        submitted after your payment is confirmed
                        {cfg.fullPaperDeadline
                          ? `, due ${formatDate(cfg.fullPaperDeadline)}`
                          : ''}
                        .
                      </p>
                    </header>

                    <DocumentPicker
                      file={abstractFile}
                      onChange={setAbstractFile}
                      maxMb={maxAbstractMb}
                      existingFile={existingRegistration?.abstractFile}
                    />
                  </div>
                )}

                {/* ── 5. REVIEW ── */}
                {currentKey === 'review' && (
                  <div className="space-y-6">
                    <header>
                      <h2 className="text-xl font-bold text-neutral-900">Review & submit</h2>
                      <p className="mt-1 text-sm text-neutral-500">
                        Check everything below. After submitting, your abstract goes to the
                        committee — you will be notified by email.
                      </p>
                    </header>

                    <ReviewBlock title="Profile">
                      <ReviewRow label="Full name" value={form.fullName} />
                      <ReviewRow label="Affiliation" value={form.affiliation} />
                      <ReviewRow label="Email" value={form.email} />
                      <ReviewRow label="Phone" value={form.phone} />
                      {form.country && <ReviewRow label="Country" value={form.country} />}
                    </ReviewBlock>

                    {requireManuscript && (
                      <ReviewBlock title="Manuscript">
                        <ReviewRow label="Title" value={form.manuscriptTitle} />
                        <ReviewRow label="Keywords" value={form.keywords.join(', ')} />
                        <ReviewRow
                          label="Output"
                          value={
                            (cfg.outputTypes || []).find((o) => o.value === form.outputType)
                              ?.label || '—'
                          }
                        />
                        <div className="pt-3">
                          <p className="text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                            Abstract
                          </p>
                          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line line-clamp-6">
                            {form.abstract}
                          </p>
                        </div>
                      </ReviewBlock>
                    )}

                    <ReviewBlock title="Attendance & fee">
                      <ReviewRow
                        label="Type"
                        value={selectedFee?.label || `${form.attendanceRole} — ${form.attendanceMode}`}
                      />
                      <ReviewRow label="Fee (IDR)" value={formatIDR(selectedFee?.amountIdr)} />
                      <ReviewRow label="Fee (USD)" value={formatUSD(selectedFee?.amountUsd)} />
                    </ReviewBlock>

                    <ReviewBlock title="Documents">
                      <ReviewRow
                        label="Abstract file"
                        value={
                          abstractFile?.name ||
                          existingRegistration?.abstractFile?.originalName ||
                          'Not uploaded'
                        }
                      />
                    </ReviewBlock>

                    {submitting && progress > 0 && (
                      <div>
                        <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className="h-full bg-primary-600 transition-all duration-200"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-neutral-500">
                          Uploading… {progress}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Navigation ── */}
                <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    icon={ArrowLeft}
                    iconPosition="left"
                    onClick={goBack}
                    disabled={step === 0 || submitting}
                  >
                    Back
                  </Button>

                  {currentKey === 'review' ? (
                    <Button
                      type="button"
                      variant="primary"
                      icon={Send}
                      onClick={handleSubmit}
                      isLoading={submitting}
                    >
                      {submitting
                        ? 'Submitting…'
                        : isResubmission
                          ? 'Resubmit'
                          : 'Submit registration'}
                    </Button>
                  ) : (
                    <Button type="button" variant="primary" icon={ArrowRight} onClick={goNext}>
                      Continue
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function ReviewBlock({ title, children }) {
  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200">
        <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium">{title}</p>
      </div>
      <div className="p-4 space-y-2.5">{children}</div>
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-6 text-sm">
      <span className="text-neutral-500 flex-shrink-0">{label}</span>
      <span className="text-neutral-900 font-medium text-right break-words">
        {value || '—'}
      </span>
    </div>
  )
}
