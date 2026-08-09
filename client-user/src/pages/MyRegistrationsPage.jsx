// src/pages/MyRegistrationsPage.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  LogOut,
  RefreshCcw,
  Ticket,
  User,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { registrationAPI } from '@/services/api'
import { useParticipantAuth } from '@/hooks/useParticipantAuth'
import { cn, formatDate, formatIDR, registrationStage } from '@/lib/utils'

const STAGE_META = {
  'waiting-review': {
    label: 'Under review',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  'revision-required': {
    label: 'Revision needed',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: RefreshCcw,
  },
  'awaiting-payment': {
    label: 'Payment required',
    tone: 'bg-primary-50 text-primary-700 border-primary-200',
    icon: CalendarDays,
  },
  'waiting-payment-confirmation': {
    label: 'Verifying payment',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  completed: {
    label: 'Confirmed',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
}

export default function MyRegistrationsPage() {
  const { participant, logout } = useParticipantAuth()

  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await registrationAPI.getMine()
        if (!cancelled) setRegistrations(response?.data || [])
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load your registrations.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <Helmet>
        <title>My Registrations — Dealings Publishing</title>
      </Helmet>

      <section className="pt-28 pb-10 bg-neutral-900">
        <div className="container-custom">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">My Registrations</h1>
              <p className="mt-2 text-neutral-400 flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                {participant?.name} · {participant?.email}
              </p>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="py-12 bg-neutral-50 min-h-[50vh]">
        <div className="container-custom">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <div className="w-10 h-10 border-2 border-neutral-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-neutral-500">Loading…</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          ) : registrations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 inline-flex items-center justify-center">
                <Ticket className="w-6 h-6 text-neutral-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-neutral-900">No registrations yet</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Browse upcoming events and register for the ones you want to join.
              </p>
              <Link to="/events">
                <Button variant="primary" className="mt-6" icon={ArrowRight}>
                  Browse events
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {registrations.map((registration) => {
                const stage = registrationStage(registration)
                const meta = STAGE_META[stage] || STAGE_META['waiting-review']
                const Icon = meta.icon
                const event = registration.event || {}

                return (
                  <Link
                    key={registration._id}
                    to={`/my/registrations/${registration._id}`}
                    className="group bg-white rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-sm transition-all overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {event.coverImage && (
                        <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0 bg-neutral-100">
                          <img
                            src={event.coverImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 p-5 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-mono text-neutral-400">
                              {registration.registrationCode}
                            </p>
                            <h3 className="mt-1 text-base font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors line-clamp-2">
                              {event.title}
                            </h3>
                          </div>

                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border flex-shrink-0',
                              meta.tone
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {meta.label}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(event.eventDate)}
                          </span>
                          <span>{registration.ticket?.attendanceLabel}</span>
                          <span className="font-medium text-neutral-700">
                            {formatIDR(registration.fee?.amountIdr)}
                          </span>
                          {registration.ticket?.code && (
                            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                              <Ticket className="w-3.5 h-3.5" />
                              {registration.ticket.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
