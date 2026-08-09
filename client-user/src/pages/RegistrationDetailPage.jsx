// src/pages/RegistrationDetailPage.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  FileText,
  Hourglass,
  Mail,
  MapPin,
  MessageCircle,
  RefreshCcw,
  Ticket,
  Upload,
  XCircle,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { registrationAPI } from '@/services/api'
import {
  cn,
  formatDate,
  formatDateTime,
  formatIDR,
  formatUSD,
  formatFileSize,
  registrationStage,
} from '@/lib/utils'

const inputClass =
  'w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5'

const TIMELINE = [
  { key: 'submitted', label: 'Submitted', description: 'Abstract received' },
  { key: 'review', label: 'Under review', description: 'Committee is reviewing' },
  { key: 'payment', label: 'Payment', description: 'Transfer & upload proof' },
  { key: 'verification', label: 'Verification', description: 'Committee verifies transfer' },
  { key: 'done', label: 'Confirmed', description: 'Ticket issued' },
]

const stageToIndex = (stage) => {
  switch (stage) {
    case 'waiting-review':
      return 1
    case 'revision-required':
      return 1
    case 'awaiting-payment':
      return 2
    case 'waiting-payment-confirmation':
      return 3
    case 'completed':
      return 4
    default:
      return 0
  }
}

export default function RegistrationDetailPage() {
  const { id } = useParams()
  const location = useLocation()

  const [registration, setRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const response = await registrationAPI.getOne(id)
      setRegistration(response?.data || null)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this registration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-neutral-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-neutral-500 text-sm">Loading your registration…</p>
        </div>
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-neutral-900">Registration not found</h1>
          <p className="mt-2 text-neutral-500">{error}</p>
          <Link to="/my/registrations">
            <Button variant="primary" className="mt-6" icon={ArrowLeft} iconPosition="left">
              My Registrations
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const event = registration.event || {}
  const cfg = event.registration || {}
  const stage = registrationStage(registration)
  const activeIndex = stageToIndex(stage)
  const justSubmitted = location.state?.justSubmitted

  return (
    <>
      <Helmet>
        <title>{registration.registrationCode} — Registration Status</title>
      </Helmet>

      {/* ═══ Header ═══ */}
      <section className="pt-28 pb-10 bg-neutral-900">
        <div className="container-custom">
          <Link
            to="/my/registrations"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            My Registrations
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                {event.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-400">
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

            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-neutral-400">
                Registration code
              </p>
              <p className="mt-0.5 text-lg font-bold text-white tracking-wide">
                {registration.registrationCode}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-neutral-50">
        <div className="container-custom space-y-6">
          {justSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-emerald-900">Submission received</p>
                <p className="mt-0.5 text-sm text-emerald-700">
                  A confirmation email is on its way. We will notify you as soon as the
                  committee has reviewed your abstract.
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══ Timeline ═══ */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <ol className="grid gap-4 sm:grid-cols-5">
              {TIMELINE.map((item, index) => {
                const done = index < activeIndex
                const active = index === activeIndex
                const failed = stage === 'revision-required' && index === 1

                return (
                  <li key={item.key} className="flex sm:block items-start gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0',
                        failed
                          ? 'bg-rose-100 text-rose-700'
                          : done
                            ? 'bg-emerald-100 text-emerald-700'
                            : active
                              ? 'bg-primary-600 text-white'
                              : 'bg-neutral-100 text-neutral-400'
                      )}
                    >
                      {failed ? (
                        <XCircle className="w-4 h-4" />
                      ) : done ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="sm:mt-3">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          active || done ? 'text-neutral-900' : 'text-neutral-400'
                        )}
                      >
                        {failed ? 'Revision needed' : item.label}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              {/* ═══ Stage-specific panel ═══ */}
              {stage === 'waiting-review' && <WaitingRoom registration={registration} />}

              {stage === 'revision-required' && (
                <RevisionPanel registration={registration} event={event} />
              )}

              {(stage === 'awaiting-payment' ||
                stage === 'waiting-payment-confirmation') && (
                <PaymentPanel
                  registration={registration}
                  cfg={cfg}
                  stage={stage}
                  onUpdated={setRegistration}
                />
              )}

              {stage === 'completed' && (
                <>
                  <TicketPanel registration={registration} cfg={cfg} event={event} />
                  <FullPaperPanel
                    registration={registration}
                    cfg={cfg}
                    onUpdated={setRegistration}
                  />
                </>
              )}

              {/* ═══ Submission summary ═══ */}
              <SubmissionSummary registration={registration} />
            </div>

            {/* ═══ Sidebar ═══ */}
            <aside className="space-y-6">
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="text-sm font-semibold text-neutral-900 mb-4">Your details</h3>
                <dl className="space-y-3 text-sm">
                  <SideRow label="Name" value={registration.profile.fullName} />
                  <SideRow label="Affiliation" value={registration.profile.affiliation} />
                  <SideRow label="Email" value={registration.profile.email} />
                  <SideRow label="Phone" value={registration.profile.phone} />
                  <SideRow
                    label="Attendance"
                    value={registration.ticket?.attendanceLabel || '—'}
                  />
                  <SideRow label="Fee" value={formatIDR(registration.fee?.amountIdr)} />
                  <SideRow label="Fee (USD)" value={formatUSD(registration.fee?.amountUsd)} />
                </dl>
              </div>

              {registration.history?.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-4">Activity</h3>
                  <ol className="space-y-3">
                    {[...registration.history].reverse().map((entry, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-300 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-neutral-800">
                            {entry.action.replace(/_/g, ' ').toLowerCase()}
                          </p>
                          <p className="text-xs text-neutral-400">{formatDateTime(entry.at)}</p>
                          {entry.note && (
                            <p className="mt-1 text-xs text-neutral-500">{entry.note}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// Stage panels
// ═══════════════════════════════════════════════════════════

function WaitingRoom({ registration }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 inline-flex items-center justify-center">
        <Hourglass className="w-6 h-6 text-amber-600" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-neutral-900">You are in the waiting room</h2>
      <p className="mt-2 text-sm text-neutral-500 max-w-lg mx-auto leading-relaxed">
        The committee is reviewing your abstract. You will receive an email the moment a
        decision is made — if it is accepted, the payment step unlocks on this page.
      </p>
      <p className="mt-4 text-xs text-neutral-400">
        Submitted {formatDateTime(registration.submittedAt)}
        {registration.submissionCount > 1 && ` · revision #${registration.submissionCount}`}
      </p>
    </div>
  )
}

function RevisionPanel({ registration, event }) {
  return (
    <div className="bg-white rounded-2xl border border-rose-200 p-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0">
          <RefreshCcw className="w-5 h-5 text-rose-600" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-neutral-900">A revision is requested</h2>
          <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
            The committee has asked you to revise your submission. You can resubmit as many
            times as you need — there is no limit.
          </p>

          {registration.reviewNote && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-amber-700">Reviewer note</p>
              <p className="mt-1 text-sm text-amber-900 leading-relaxed">
                {registration.reviewNote}
              </p>
            </div>
          )}

          <Link to={`/events/${event.slug}/register`}>
            <Button variant="primary" className="mt-5">
              Revise & resubmit
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function PaymentPanel({ registration, cfg, stage, onUpdated }) {
  const fileRef = useRef(null)
  const bank = cfg.bank || {}
  const gatewayEnabled = Boolean(cfg.paymentMethods?.gateway)

  const [method, setMethod] = useState('manual')
  const [proof, setProof] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const [fields, setFields] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    swiftCode: '',
    country: registration.profile?.country || '',
    currency: 'IDR',
    note: '',
  })

  const setField = (key) => (e) => setFields((p) => ({ ...p, [key]: e.target.value }))

  const pendingPayment = [...(registration.payments || [])]
    .reverse()
    .find((p) => p.status === 'pending')
  const failedPayment = [...(registration.payments || [])]
    .reverse()
    .find((p) => p.status === 'failed')

  const copy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(''), 1600)
    } catch {
      // Clipboard blocked — the value is on screen anyway
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!fields.bankName.trim()) return setError('Bank name is required.')
    if (!fields.accountName.trim())
      return setError('Account name — exactly as printed on the transfer — is required.')
    if (!fields.accountNumber.trim()) return setError('Account number is required.')
    if (!proof) return setError('Please attach your transfer receipt (screenshot or PDF).')

    setSubmitting(true)
    setProgress(0)

    try {
      const payload = new FormData()
      payload.append('method', method)
      Object.entries(fields).forEach(([key, value]) => payload.append(key, value))
      payload.append('amountDeclared', registration.fee?.amountIdr || 0)
      payload.append('proofFile', proof)

      const response = await registrationAPI.submitPayment(registration._id, payload, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total))
      })

      onUpdated((prev) => ({ ...prev, ...response.data, event: prev.event }))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your payment proof.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Pending verification ──
  if (stage === 'waiting-payment-confirmation') {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-neutral-900">Payment pending</h2>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Pending
              </span>
            </div>

            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              We have your transfer receipt and the committee is verifying it. This usually
              takes 1–3 working days.
            </p>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
              <Mail className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-primary-900 leading-relaxed">
                Once this status turns to <strong>Confirmed</strong>, please check your email —
                your e-ticket, invoice, WhatsApp group link and full-paper instructions are sent
                to <strong>{registration.profile.email}</strong>.
              </p>
            </div>

            {pendingPayment && (
              <dl className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
                <SideRow label="Bank" value={pendingPayment.bankName} />
                <SideRow label="Account name" value={pendingPayment.accountName} />
                <SideRow label="Account number" value={pendingPayment.accountNumber} />
                <SideRow label="Submitted" value={formatDateTime(pendingPayment.submittedAt)} />
                {pendingPayment.proofFile?.url && (
                  <div className="sm:col-span-2">
                    <a
                      href={pendingPayment.proofFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      View the receipt you uploaded
                    </a>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Payment form ──
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-neutral-900">Registration payment</h2>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Abstract accepted
          </span>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          Transfer the registration fee, then upload your proof of payment below.
        </p>
      </header>

      {failedPayment && registration.paymentStatus === 'failed' && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-medium text-rose-800">
            Your previous payment could not be verified
          </p>
          {failedPayment.adminNote && (
            <p className="mt-1 text-sm text-rose-700">{failedPayment.adminNote}</p>
          )}
          <p className="mt-1 text-xs text-rose-600">
            Submit a new proof below — the earlier attempt has been voided so you are never
            charged twice.
          </p>
        </div>
      )}

      {/* Amount */}
      <div className="rounded-2xl bg-primary-50 border border-primary-100 p-5 mb-6">
        <p className="text-xs uppercase tracking-wider text-primary-700">Amount due</p>
        <p className="mt-1 text-3xl font-bold text-primary-900">
          {formatIDR(registration.fee?.amountIdr)}
        </p>
        <p className="text-sm text-primary-700">
          or {formatUSD(registration.fee?.amountUsd)} for international participants
        </p>
        <p className="mt-2 text-xs text-primary-600">{registration.fee?.label}</p>
      </div>

      {/* Method */}
      <div className="mb-6">
        <label className={labelClass}>Payment method</label>
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMethod('manual')}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
              method === 'manual'
                ? 'border-primary-600 bg-primary-50'
                : 'border-neutral-200 hover:border-neutral-300'
            )}
          >
            <Banknote className="w-5 h-5 text-primary-600 mt-0.5" />
            <span>
              <span className="block text-sm font-semibold text-neutral-900">
                Manual bank transfer
              </span>
              <span className="block mt-0.5 text-xs text-neutral-500">
                Transfer directly, then upload the receipt.
              </span>
            </span>
          </button>

          <button
            type="button"
            disabled={!gatewayEnabled}
            onClick={() => gatewayEnabled && setMethod('gateway')}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
              method === 'gateway'
                ? 'border-primary-600 bg-primary-50'
                : 'border-neutral-200',
              !gatewayEnabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            <CreditCard className="w-5 h-5 text-neutral-400 mt-0.5" />
            <span>
              <span className="block text-sm font-semibold text-neutral-900">
                Payment gateway
              </span>
              <span className="block mt-0.5 text-xs text-neutral-500">
                {gatewayEnabled
                  ? 'Card / virtual account / e-wallet.'
                  : cfg.paymentMethods?.gatewayNote || 'Coming soon — awaiting approval.'}
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Bank details */}
      {bank.accountNumber && (
        <div className="mb-6 rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-neutral-400" />
            <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
              Transfer to
            </p>
          </div>
          <div className="p-5 space-y-3">
            <CopyRow
              label="Bank"
              value={bank.bankName}
              onCopy={() => copy(bank.bankName, 'bank')}
              copied={copied === 'bank'}
            />
            <CopyRow
              label="Account number"
              value={bank.accountNumber}
              mono
              onCopy={() => copy(bank.accountNumber, 'number')}
              copied={copied === 'number'}
            />
            <CopyRow
              label="Account name"
              value={bank.accountName}
              onCopy={() => copy(bank.accountName, 'name')}
              copied={copied === 'name'}
            />
            {bank.swiftCode && (
              <CopyRow
                label="SWIFT / BIC"
                value={bank.swiftCode}
                mono
                onCopy={() => copy(bank.swiftCode, 'swift')}
                copied={copied === 'swift'}
              />
            )}
          </div>
        </div>
      )}

      {/* Proof form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <h3 className="text-sm font-semibold text-neutral-900">Confirm your transfer</h3>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Bank name <span className="text-rose-500">*</span>
            </label>
            <input
              value={fields.bankName}
              onChange={setField('bankName')}
              placeholder="BNI / BCA / Mandiri / your bank"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Account name <span className="text-rose-500">*</span>
            </label>
            <input
              value={fields.accountName}
              onChange={setField('accountName')}
              placeholder="Abdillah"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-neutral-400">
              Exactly as it appears on the transfer.
            </p>
          </div>

          <div>
            <label className={labelClass}>
              Account number <span className="text-rose-500">*</span>
            </label>
            <input
              value={fields.accountNumber}
              onChange={setField('accountNumber')}
              placeholder="1234567890"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>SWIFT / BIC</label>
            <input
              value={fields.swiftCode}
              onChange={setField('swiftCode')}
              placeholder="Only for transfers from outside Indonesia"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Country</label>
            <input
              value={fields.country}
              onChange={setField('country')}
              placeholder="Indonesia"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Currency transferred</label>
            <select value={fields.currency} onChange={setField('currency')} className={inputClass}>
              <option value="IDR">IDR — Indonesian Rupiah</option>
              <option value="USD">USD — US Dollar</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Proof of transfer <span className="text-rose-500">*</span>
          </label>

          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-primary-400 hover:bg-primary-50/40 cursor-pointer transition-colors"
          >
            <Upload className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            <div className="min-w-0">
              {proof ? (
                <>
                  <p className="text-sm font-medium text-neutral-800 truncate">{proof.name}</p>
                  <p className="text-xs text-neutral-400">{formatFileSize(proof.size)}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-neutral-800">
                    Upload a screenshot or PDF receipt
                  </p>
                  <p className="text-xs text-neutral-500">JPG, PNG, WEBP or PDF · max 10 MB</p>
                </>
              )}
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setProof(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>

        <div>
          <label className={labelClass}>Note for the committee</label>
          <textarea
            rows={3}
            value={fields.note}
            onChange={setField('note')}
            placeholder="Optional — anything the verifier should know."
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        {submitting && progress > 0 && (
          <div>
            <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-neutral-500">Uploading… {progress}%</p>
          </div>
        )}

        <Button type="submit" variant="primary" isLoading={submitting} className="w-full sm:w-auto">
          {submitting ? 'Submitting…' : 'Submit proof of payment'}
        </Button>
      </form>
    </div>
  )
}

function TicketPanel({ registration, cfg, event }) {
  const ticket = registration.ticket || {}
  const invoice = registration.invoice || {}

  return (
    <div className="space-y-6">
      {/* Ticket */}
      <div className="rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 p-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-primary-700 text-xs font-medium">
          <Ticket className="w-3.5 h-3.5" />
          E-Ticket
        </div>

        <p className="mt-4 text-3xl md:text-4xl font-bold tracking-[0.15em] text-primary-900 break-all">
          {ticket.code}
        </p>
        <p className="mt-2 text-sm font-semibold text-primary-700">{ticket.attendanceLabel}</p>

        <div className="mt-5 pt-5 border-t border-primary-200 text-sm text-primary-900">
          <p className="font-medium">{registration.profile.fullName}</p>
          <p className="text-primary-700">{registration.profile.affiliation}</p>
        </div>

        <p className="mt-4 text-xs text-primary-600">
          Issued {formatDate(ticket.issuedAt)} · also sent to {registration.profile.email}
        </p>
      </div>

      {/* Invoice */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">Invoice</h3>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Paid
          </span>
        </div>
        <div className="p-6 space-y-3 text-sm">
          <SideRow label="Invoice number" value={invoice.number} />
          <SideRow label="Issued" value={formatDate(invoice.issuedAt)} />
          <SideRow label="Description" value={`Registration fee — ${event.title}`} />
          <SideRow label="Amount (IDR)" value={formatIDR(invoice.amountIdr)} />
          <SideRow label="Amount (USD)" value={formatUSD(invoice.amountUsd)} />
          <SideRow label="Paid at" value={formatDateTime(registration.paidAt)} />
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">What happens next</h3>
        <div className="space-y-3">
          {cfg.whatsappGroupUrl && (
            <a
              href={cfg.whatsappGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/40 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-neutral-800">
                Join the participant WhatsApp group
              </span>
            </a>
          )}

          {cfg.fullPaperDeadline && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-700">
                Full paper deadline:{' '}
                <strong className="text-neutral-900">{formatDate(cfg.fullPaperDeadline)}</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FullPaperPanel({ registration, cfg, onUpdated }) {
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const existing = registration.fullPaperFile

  const handleUpload = async () => {
    if (!file) return setError('Choose your full chapter file first.')

    setUploading(true)
    setError('')
    setProgress(0)

    try {
      const payload = new FormData()
      payload.append('fullPaperFile', file)

      const response = await registrationAPI.uploadFullPaper(registration._id, payload, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total))
      })

      onUpdated((prev) => ({ ...prev, ...response.data, event: prev.event }))
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h3 className="text-sm font-semibold text-neutral-900">Full chapter submission</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Microsoft Word or PDF, max {cfg.maxFullPaperSizeMb ?? 25} MB
        {cfg.fullPaperDeadline ? ` · due ${formatDate(cfg.fullPaperDeadline)}` : ''}.
      </p>

      {existing?.url && (
        <div className="mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-900 truncate">
                {existing.originalName}
              </p>
              <p className="text-xs text-emerald-700">
                Uploaded {formatDateTime(existing.uploadedAt)} · {formatFileSize(existing.bytes)}
              </p>
            </div>
          </div>
          <a
            href={existing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-100"
            aria-label="Download"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      )}

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 min-w-[220px] flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-primary-400 transition-colors text-left"
        >
          <Upload className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <span className="text-sm text-neutral-700 truncate">
            {file ? file.name : existing?.url ? 'Replace with a new version' : 'Choose file'}
          </span>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleUpload}
          isLoading={uploading}
          disabled={!file}
        >
          {uploading ? `Uploading ${progress}%` : 'Upload'}
        </Button>
      </div>
    </div>
  )
}

function SubmissionSummary({ registration }) {
  const manuscript = registration.manuscript || {}

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h3 className="text-sm font-semibold text-neutral-900 mb-4">Your submission</h3>

      <dl className="space-y-3 text-sm">
        {manuscript.title && <SideRow label="Title" value={manuscript.title} />}
        {manuscript.keywords?.length > 0 && (
          <SideRow label="Keywords" value={manuscript.keywords.join(', ')} />
        )}
        {manuscript.outputType && (
          <SideRow
            label="Output"
            value={
              manuscript.outputType === 'book-series-scopus'
                ? 'Book Series (Scopus)'
                : 'National Journal (SINTA)'
            }
          />
        )}
      </dl>

      {manuscript.abstract && (
        <div className="mt-5 pt-5 border-t border-neutral-100">
          <p className="text-xs uppercase tracking-wider text-neutral-400 mb-2">Abstract</p>
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
            {manuscript.abstract}
          </p>
        </div>
      )}

      {registration.abstractFile?.url && (
        <a
          href={registration.abstractFile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <FileText className="w-4 h-4" />
          {registration.abstractFile.originalName || 'Download abstract file'}
        </a>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Small pieces
// ═══════════════════════════════════════════════════════════

function SideRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-neutral-500 flex-shrink-0">{label}</dt>
      <dd className="text-neutral-900 font-medium text-right break-words">{value || '—'}</dd>
    </div>
  )
}

function CopyRow({ label, value, onCopy, copied, mono }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-neutral-500 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            'text-sm font-semibold text-neutral-900 truncate',
            mono && 'font-mono tracking-wide'
          )}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 flex-shrink-0"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
