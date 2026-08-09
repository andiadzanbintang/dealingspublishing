// src/pages/RegistrationDetailPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  Send,
  Ticket,
  User,
  X,
  XCircle,
} from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate, formatDateTime, formatBookPrice } from '@/lib/utils'
import { registrationAPI } from '@/services/api'

const submissionTone = {
  submitted: 'bg-warning-50 text-warning-600 border-warning-200',
  accepted: 'bg-success-50 text-success-600 border-success-200',
  rejected: 'bg-danger-50 text-danger-600 border-danger-200',
}

const paymentTone = {
  unpaid: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  pending: 'bg-warning-50 text-warning-600 border-warning-200',
  confirmed: 'bg-success-50 text-success-600 border-success-200',
  failed: 'bg-danger-50 text-danger-600 border-danger-200',
}

export default function RegistrationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [registration, setRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  const [reviewNote, setReviewNote] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [confirmTarget, setConfirmTarget] = useState(null)

  const fetchRegistration = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await registrationAPI.getById(id)
      setRegistration(response?.data || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load this registration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const runReview = async (decision) => {
    setActionLoading(`review-${decision}`)
    setError('')
    setNotice('')

    try {
      const response = await registrationAPI.review(id, { decision, note: reviewNote })
      setRegistration((prev) => ({ ...prev, ...response.data }))
      setReviewNote('')
      setNotice(
        decision === 'accept'
          ? 'Accepted. The participant has been emailed the payment instructions.'
          : 'Sent back for revision. The participant has been notified by email.'
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your decision.')
    } finally {
      setActionLoading('')
    }
  }

  const runPaymentReview = async (decision) => {
    setActionLoading(`payment-${decision}`)
    setError('')
    setNotice('')

    try {
      const response = await registrationAPI.reviewPayment(id, {
        decision,
        note: paymentNote,
      })
      setRegistration((prev) => ({ ...prev, ...response.data }))
      setPaymentNote('')
      setNotice(
        decision === 'confirm'
          ? 'Payment confirmed. Ticket, invoice and links have been emailed to the participant.'
          : 'Payment rejected. The participant can now submit a new proof.'
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the payment status.')
    } finally {
      setActionLoading('')
    }
  }

  const resendTicket = async () => {
    setActionLoading('resend')
    setError('')
    setNotice('')

    try {
      const response = await registrationAPI.resendTicket(id)
      setNotice(response?.message || 'Ticket email resent.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend the ticket email.')
    } finally {
      setActionLoading('')
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border border-neutral-200 p-10">
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Loading registration...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-neutral-200 p-10 text-center">
        <p className="text-sm text-neutral-500">{error || 'Registration not found.'}</p>
        <button
          onClick={() => navigate('/registrations')}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to registrations
        </button>
      </div>
    )
  }

  const { profile, manuscript, attendance, fee, payments = [] } = registration
  const pendingPayment = [...payments].reverse().find((p) => p.status === 'pending')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/registrations')}
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-all mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900">{profile?.fullName}</h1>
            <span className="text-xs font-mono text-neutral-400">
              {registration.registrationCode}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {registration.event?.title} · submitted{' '}
            {formatDateTime(registration.submittedAt || registration.createdAt)}
            {registration.submissionCount > 1 &&
              ` · revision #${registration.submissionCount}`}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium capitalize border ${
              submissionTone[registration.submissionStatus]
            }`}
          >
            {registration.submissionStatus}
          </span>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium capitalize border ${
              paymentTone[registration.paymentStatus]
            }`}
          >
            payment: {registration.paymentStatus}
          </span>
        </div>
      </div>

      {notice && (
        <div className="bg-success-50 border border-success-200 text-success-600 rounded-xl px-4 py-3 text-sm">
          {notice}
        </div>
      )}

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* ═══ 1. Review the submission ═══ */}
          <Panel
            title="Abstract review"
            description="Accept to open the payment step, or send it back for revision — the participant may resubmit without limit."
          >
            {registration.reviewedAt && (
              <div className="mb-5 rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-neutral-400">
                  Last decision
                </p>
                <p className="mt-1 text-sm text-neutral-800 capitalize">
                  {registration.submissionStatus} · {formatDateTime(registration.reviewedAt)}
                  {registration.reviewedBy?.name && ` by ${registration.reviewedBy.name}`}
                </p>
                {registration.reviewNote && (
                  <p className="mt-1 text-sm text-neutral-600">{registration.reviewNote}</p>
                )}
              </div>
            )}

            {registration.paymentStatus === 'confirmed' ? (
              <p className="text-sm text-neutral-500">
                This registration is already paid and confirmed — the review is locked.
              </p>
            ) : (
              <>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Note to the participant
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Required when asking for a revision — explain what needs to change."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      setConfirmTarget({
                        title: 'Accept this submission?',
                        description:
                          'The participant will be emailed the payment instructions and the bank details.',
                        confirmText: 'Accept submission',
                        variant: 'primary',
                        action: () => runReview('accept'),
                      })
                    }
                    disabled={Boolean(actionLoading)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-success-500 hover:bg-success-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {actionLoading === 'review-accept' ? 'Accepting…' : 'Accept'}
                  </button>

                  <button
                    onClick={() =>
                      setConfirmTarget({
                        title: 'Send back for revision?',
                        description:
                          'The participant will be emailed your note and can resubmit as many times as needed.',
                        confirmText: 'Request revision',
                        variant: 'danger',
                        action: () => runReview('deny'),
                      })
                    }
                    disabled={Boolean(actionLoading)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-danger-200 text-danger-600 hover:bg-danger-50 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    {actionLoading === 'review-deny' ? 'Sending…' : 'Deny / request revision'}
                  </button>
                </div>
              </>
            )}
          </Panel>

          {/* ═══ 2. Manuscript ═══ */}
          <Panel title="Manuscript">
            <dl className="space-y-3 text-sm">
              <Row label="Article title" value={manuscript?.title} />
              <Row label="Keywords" value={manuscript?.keywords?.join(', ')} />
              <Row
                label="Output type"
                value={
                  manuscript?.outputType === 'book-series-scopus'
                    ? 'Book Series (Scopus)'
                    : manuscript?.outputType === 'journal-nasional-sinta'
                      ? 'National Journal (SINTA)'
                      : manuscript?.outputType
                }
              />
            </dl>

            {manuscript?.abstract && (
              <div className="mt-5 pt-5 border-t border-neutral-100">
                <p className="text-xs uppercase tracking-wider text-neutral-400 mb-2">
                  Abstract
                </p>
                <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                  {manuscript.abstract}
                </p>
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-neutral-100 space-y-2">
              <FileRow label="Abstract file" file={registration.abstractFile} />
              <FileRow label="Full chapter" file={registration.fullPaperFile} />
            </div>
          </Panel>

          {/* ═══ 3. Payment ═══ */}
          <Panel
            title="Payment verification"
            description="Confirm only after the transfer appears in the account. Rejecting lets the participant upload a new proof."
          >
            {payments.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No payment has been submitted yet.
              </p>
            ) : (
              <div className="space-y-4">
                {[...payments].reverse().map((payment, index) => (
                  <div
                    key={index}
                    className={`rounded-xl border p-4 ${
                      payment.status === 'confirmed'
                        ? 'border-success-200 bg-success-50/40'
                        : payment.status === 'pending'
                          ? 'border-warning-200 bg-warning-50/40'
                          : 'border-neutral-200 bg-neutral-50/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {payment.status === 'confirmed' ? (
                          <CheckCircle2 className="w-4 h-4 text-success-600" />
                        ) : payment.status === 'pending' ? (
                          <Clock className="w-4 h-4 text-warning-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-neutral-400" />
                        )}
                        <span className="text-sm font-medium text-neutral-800 capitalize">
                          Attempt {payments.length - index} · {payment.status}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400">
                        {formatDateTime(payment.submittedAt)}
                      </span>
                    </div>

                    <dl className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <Row label="Bank" value={payment.bankName} />
                      <Row label="Account name" value={payment.accountName} />
                      <Row label="Account number" value={payment.accountNumber} />
                      {payment.swiftCode && (
                        <Row label="SWIFT / BIC" value={payment.swiftCode} />
                      )}
                      {payment.country && <Row label="Country" value={payment.country} />}
                      <Row
                        label="Declared"
                        value={`${formatBookPrice(payment.amountDeclared)} (${payment.currency})`}
                      />
                    </dl>

                    {payment.note && (
                      <p className="mt-3 text-sm text-neutral-600">
                        <span className="text-neutral-400">Participant note: </span>
                        {payment.note}
                      </p>
                    )}

                    {payment.adminNote && (
                      <p className="mt-1 text-sm text-neutral-600">
                        <span className="text-neutral-400">Admin note: </span>
                        {payment.adminNote}
                      </p>
                    )}

                    {payment.proofFile?.url && (
                      <a
                        href={payment.proofFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        <FileText className="w-4 h-4" />
                        Open proof of transfer
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {pendingPayment && (
              <div className="mt-6 pt-6 border-t border-neutral-100">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Note (sent to the participant if you reject)
                </label>
                <textarea
                  rows={2}
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. The amount transferred does not match the registration fee."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      setConfirmTarget({
                        title: 'Confirm this payment?',
                        description:
                          'A ticket number and invoice will be generated and emailed to the participant along with the WhatsApp group link and full-paper deadline.',
                        confirmText: 'Confirm payment',
                        variant: 'primary',
                        action: () => runPaymentReview('confirm'),
                      })
                    }
                    disabled={Boolean(actionLoading)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-success-500 hover:bg-success-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Banknote className="w-4 h-4" />
                    {actionLoading === 'payment-confirm' ? 'Confirming…' : 'Confirm payment'}
                  </button>

                  <button
                    onClick={() =>
                      setConfirmTarget({
                        title: 'Reject this payment?',
                        description:
                          'The attempt is marked failed and the participant can submit a new proof. Nothing is counted twice.',
                        confirmText: 'Reject payment',
                        variant: 'danger',
                        action: () => runPaymentReview('reject'),
                      })
                    }
                    disabled={Boolean(actionLoading)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-danger-200 text-danger-600 hover:bg-danger-50 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    {actionLoading === 'payment-reject' ? 'Rejecting…' : 'Reject payment'}
                  </button>
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* ═══ Sidebar ═══ */}
        <div className="space-y-6">
          {/* Ticket */}
          {registration.ticket?.code ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-primary-300 p-6 text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                <Ticket className="w-3.5 h-3.5" />
                E-Ticket
              </div>
              <p className="mt-3 text-xl font-bold tracking-widest text-primary-900 break-all">
                {registration.ticket.code}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {registration.ticket.attendanceLabel}
              </p>

              <dl className="mt-4 pt-4 border-t border-neutral-100 space-y-2 text-sm text-left">
                <Row label="Invoice" value={registration.invoice?.number} />
                <Row label="Paid at" value={formatDateTime(registration.paidAt)} />
                <Row
                  label="Ticket email"
                  value={
                    registration.ticketEmailSentAt
                      ? formatDateTime(registration.ticketEmailSentAt)
                      : 'Not sent'
                  }
                />
              </dl>

              <button
                onClick={resendTicket}
                disabled={Boolean(actionLoading)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {actionLoading === 'resend' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Resend ticket email
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 p-6 text-center">
              <Ticket className="w-6 h-6 text-neutral-300 mx-auto" />
              <p className="mt-2 text-sm text-neutral-500">
                No ticket yet — it is issued automatically when the payment is confirmed.
              </p>
            </div>
          )}

          {/* Profile */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-neutral-400" />
              Participant
            </h3>
            <dl className="space-y-3 text-sm">
              <Row label="Name" value={profile?.fullName} />
              <Row label="Affiliation" value={profile?.affiliation} />
              <Row label="Country" value={profile?.country} />
              <Row
                label="Attendance"
                value={`${attendance?.role} · ${attendance?.mode}`}
              />
              <Row label="Fee (IDR)" value={formatBookPrice(fee?.amountIdr)} />
              <Row label="Fee (USD)" value={fee?.amountUsd ? `$${fee.amountUsd}` : '—'} />
              <Row
                label="Account created"
                value={formatDate(registration.participant?.createdAt)}
              />
            </dl>

            <div className="mt-5 pt-5 border-t border-neutral-100 space-y-2">
              <a
                href={`mailto:${profile?.email}`}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 break-all"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                {profile?.email}
              </a>
              <a
                href={`https://wa.me/${(profile?.phone || '').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                {profile?.phone}
              </a>
            </div>
          </div>

          {/* History */}
          {registration.history?.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">History</h3>
              <ol className="space-y-3">
                {[...registration.history].reverse().map((entry, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-300 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-neutral-800 capitalize">
                        {entry.action.replace(/_/g, ' ').toLowerCase()}
                      </p>
                      <p className="text-xs text-neutral-400">{formatDateTime(entry.at)}</p>
                      {entry.note && (
                        <p className="mt-0.5 text-xs text-neutral-500">{entry.note}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => confirmTarget?.action?.()}
        title={confirmTarget?.title || ''}
        description={confirmTarget?.description || ''}
        confirmText={confirmTarget?.confirmText || 'Confirm'}
        variant={confirmTarget?.variant || 'primary'}
      />
    </div>
  )
}

function Panel({ title, description, children }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      {description && <p className="mt-1 mb-5 text-sm text-neutral-500">{description}</p>}
      {!description && <div className="mb-5" />}
      {children}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-neutral-500 flex-shrink-0">{label}</dt>
      <dd className="text-neutral-900 font-medium text-right break-words">{value || '—'}</dd>
    </div>
  )
}

function FileRow({ label, file }) {
  if (!file?.url) {
    return (
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-neutral-500">{label}</span>
        <span className="text-neutral-300">Not uploaded</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-neutral-500">{label}</span>
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-medium text-primary-600 hover:text-primary-700 min-w-0"
      >
        <Download className="w-4 h-4 flex-shrink-0" />
        <span className="truncate max-w-[220px]">{file.originalName || 'Download'}</span>
      </a>
    </div>
  )
}
