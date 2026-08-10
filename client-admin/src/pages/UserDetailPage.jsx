// src/pages/UserDetailPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  Mail,
  Phone,
  RefreshCw,
  Ticket,
  Wallet,
} from 'lucide-react'
import { formatDate, formatDateTime, formatIDR } from '@/lib/utils'
import { participantAPI } from '@/services/api'

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

export default function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUser = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await participantAPI.getById(id)
      setData(response?.data || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load this user.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border border-neutral-200 p-10">
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Loading user...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data?.participant) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-neutral-200 p-10 text-center">
        <p className="text-sm text-neutral-500">{error || 'User not found.'}</p>
        <button
          onClick={() => navigate('/users')}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to users
        </button>
      </div>
    )
  }

  const { participant, registrations = [], summary } = data

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/users')}
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-all mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center text-base font-bold flex-shrink-0">
            {(participant.name || '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-neutral-900 truncate">{participant.name}</h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              Joined {formatDate(participant.createdAt)}
              {participant.lastLogin && ` · last sign-in ${formatDateTime(participant.lastLogin)}`}
            </p>
          </div>
        </div>

        <button
          onClick={fetchUser}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ═══ Summary ═══ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniCard label="Events registered" value={summary?.total ?? 0} icon={Calendar} />
        <MiniCard
          label="Awaiting review"
          value={summary?.awaitingReview ?? 0}
          icon={Clock}
          tone="bg-warning-50 text-warning-600"
        />
        <MiniCard
          label="Payments to verify"
          value={summary?.pendingPayment ?? 0}
          icon={Wallet}
          tone="bg-warning-50 text-warning-600"
        />
        <MiniCard
          label="Total paid"
          value={formatIDR(summary?.totalPaidIdr ?? 0)}
          hint={summary?.totalPaidUsd ? `$${summary.totalPaidUsd} USD equivalent` : undefined}
          icon={CheckCircle2}
          tone="bg-success-50 text-success-600"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* ═══ Registrations ═══ */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Event registrations</h2>

          {registrations.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center">
              <Ticket className="w-6 h-6 text-neutral-300 mx-auto" />
              <p className="mt-2 text-sm text-neutral-500">
                This user has not registered for any event yet.
              </p>
            </div>
          ) : (
            registrations.map((registration) => (
              <Link
                key={registration._id}
                to={`/registrations/${registration._id}`}
                className="group block bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-sm transition-all p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-neutral-400">
                      {registration.registrationCode}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                      {registration.event?.title || 'Event removed'}
                    </p>
                    {registration.manuscript?.title && (
                      <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                        {registration.manuscript.title}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 flex-shrink-0 mt-1" />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                      submissionTone[registration.submissionStatus] ||
                      'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}
                  >
                    {registration.submissionStatus}
                  </span>

                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                      paymentTone[registration.paymentStatus] ||
                      'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}
                  >
                    payment: {registration.paymentStatus}
                  </span>

                  <span className="text-xs text-neutral-500 capitalize">
                    {registration.attendance?.role} · {registration.attendance?.mode}
                  </span>

                  <span className="text-xs font-medium text-neutral-700">
                    {formatIDR(registration.fee?.amountIdr)}
                  </span>

                  {registration.ticket?.code && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-success-600">
                      <Ticket className="w-3.5 h-3.5" />
                      {registration.ticket.code}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
                  <span>Submitted {formatDateTime(registration.submittedAt)}</span>
                  {registration.submissionCount > 1 && (
                    <span>Revision #{registration.submissionCount}</span>
                  )}
                  {registration.paidAt && <span>Paid {formatDateTime(registration.paidAt)}</span>}
                  {registration.event?.eventDate && (
                    <span>Event {formatDate(registration.event.eventDate)}</span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* ═══ Contact ═══ */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">Account</h3>

            <dl className="space-y-3 text-sm">
              <Row label="Name" value={participant.name} />
              <Row label="Affiliation" value={participant.affiliation} />
              <Row label="Country" value={participant.country} />
              <Row label="Status" value={participant.isActive ? 'Active' : 'Deactivated'} />
              <Row label="Joined" value={formatDate(participant.createdAt)} />
            </dl>

            <div className="mt-5 pt-5 border-t border-neutral-100 space-y-2">
              <a
                href={`mailto:${participant.email}`}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 break-all"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                {participant.email}
              </a>

              {participant.phone && (
                <a
                  href={`https://wa.me/${participant.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  {participant.phone}
                </a>
              )}

              {participant.affiliation && (
                <p className="flex items-center gap-2 text-sm text-neutral-500">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  {participant.affiliation}
                </p>
              )}

              {participant.country && (
                <p className="flex items-center gap-2 text-sm text-neutral-500">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  {participant.country}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniCard({ label, value, hint, icon: Icon, tone = 'bg-primary-50 text-primary-600' }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900 truncate">{value}</p>
          {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
        </div>
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tone}`}>
          <Icon className="w-5 h-5" />
        </span>
      </div>
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
