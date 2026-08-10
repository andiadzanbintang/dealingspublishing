// src/pages/MyEventsPage.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { reviewerAPI } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

/**
 * Landing page for a reviewer: only the events assigned to their account, each
 * with the amount of work waiting. Superadmins and editors can open the same
 * page and will see every event — it doubles as a quick "where is the queue"
 * view for them.
 */
export default function MyEventsPage() {
  const { user } = useAuth()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchEvents = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await reviewerAPI.getMyEvents()
      setEvents(response?.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your events.')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const isReviewer = user?.role === 'reviewer'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Events</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {isReviewer
              ? 'The events you have been assigned to review.'
              : 'Every event, with the review and payment queue for each.'}
          </p>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Loading your events...</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 inline-flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-neutral-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-neutral-800">
            {isReviewer ? 'No events assigned yet' : 'No events yet'}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {isReviewer
              ? 'A superadmin needs to assign at least one event to your account.'
              : 'Create an event first, then enable registration on it.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => {
            const needsAttention =
              (event.counts?.awaitingReview || 0) + (event.counts?.pendingPayment || 0)

            return (
              <Link
                key={event._id}
                to={`/registrations?event=${event._id}`}
                className="group bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-sm transition-all overflow-hidden"
              >
                <div className="flex">
                  {event.coverImage ? (
                    <div className="w-28 flex-shrink-0 bg-neutral-100">
                      <img
                        src={event.coverImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="flex-1 p-5 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors line-clamp-2">
                          {event.title}
                        </h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                          <span>{formatDate(event.eventDate)}</span>
                          {event.location && (
                            <span className="flex items-center gap-1 truncate max-w-[220px]">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 flex-shrink-0 mt-0.5" />
                    </div>

                    {!event.registrationEnabled && (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-warning-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Registration is switched off for this event
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <Metric
                        icon={Clock}
                        label="To review"
                        value={event.counts?.awaitingReview || 0}
                        highlight={event.counts?.awaitingReview > 0}
                      />
                      <Metric
                        icon={Wallet}
                        label="To verify"
                        value={event.counts?.pendingPayment || 0}
                        highlight={event.counts?.pendingPayment > 0}
                      />
                      <Metric
                        icon={CheckCircle2}
                        label="Confirmed"
                        value={event.counts?.confirmed || 0}
                      />
                    </div>

                    <p className="mt-3 text-xs text-neutral-400">
                      {event.counts?.total || 0} registration
                      {event.counts?.total === 1 ? '' : 's'} in total
                      {needsAttention > 0 && (
                        <span className="text-warning-600 font-medium">
                          {' '}
                          · {needsAttention} waiting on you
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Metric({ icon: Icon, label, value, highlight }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        highlight ? 'border-warning-200 bg-warning-50' : 'border-neutral-200 bg-neutral-50'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon
          className={`w-3.5 h-3.5 ${highlight ? 'text-warning-600' : 'text-neutral-400'}`}
        />
        <span className="text-[11px] text-neutral-500">{label}</span>
      </div>
      <p
        className={`mt-1 text-lg font-bold ${
          highlight ? 'text-warning-700' : 'text-neutral-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
