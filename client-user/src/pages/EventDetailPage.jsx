// client-user/src/pages/EventDetailPage.jsx
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Info,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Share2,
  Tag,
  Ticket,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EventCard from '@/components/ui/EventCard'
import AnimatedSection from '@/components/ui/AnimatedSection'
import ExpandableText from '@/components/ui/ExpandableText'
import { formatDate, formatIDR, formatUSD } from '@/lib/utils'
import { eventAPI, registrationAPI } from '../services/api'
import { useParticipantAuth } from '@/hooks/useParticipantAuth'
import { useEffect, useState } from 'react'

const eventTypeColors = {
  conference: '#6366F1',
  webinar: '#10B981',
  workshop: '#F59E0B',
  seminar: '#EC4899',
}

export default function EventDetailPage() {
  const { slug } = useParams()
  const { isAuthenticated } = useParticipantAuth()

  const [event, setEvent] = useState(null)
  const [relatedEvents, setRelatedEvents] = useState([])
  const [myRegistration, setMyRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch the event whenever the slug changes
  useEffect(() => {
    let cancelled = false

    const fetchEvent = async () => {
      setLoading(true)
      setError('')
      setEvent(null)

      try {
        const response = await eventAPI.getBySlug(slug)
        if (!cancelled) {
          setEvent(response?.data || null)
        }
      } catch (err) {
        console.error('Failed to fetch event', err)
        if (!cancelled) {
          setError(
            err.response?.data?.message || 'Failed to load event. Please try again'
          )
          setEvent(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchEvent()

    return () => {
      cancelled = true
    }
  }, [slug])

  // If the visitor is signed in, find out whether they already registered
  useEffect(() => {
    if (!isAuthenticated || !event?.registration?.enabled) {
      setMyRegistration(null)
      return
    }

    let cancelled = false

    const fetchMine = async () => {
      try {
        const response = await registrationAPI.getEventConfig(slug)
        if (!cancelled) setMyRegistration(response?.data?.myRegistration || null)
      } catch {
        if (!cancelled) setMyRegistration(null)
      }
    }

    fetchMine()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, event?.registration?.enabled, slug])

  // Fetch related events once we know the current event
  useEffect(() => {
    if (!event?._id) {
      setRelatedEvents([])
      return
    }

    let cancelled = false

    const fetchRelated = async () => {
      try {
        const response = await eventAPI.getAll({
          limit: 4,
          sort: '-eventDate',
        })
        const items = (response?.data || [])
          .filter((e) => e._id !== event._id)
          .slice(0, 3)

        if (!cancelled) setRelatedEvents(items)
      } catch (err) {
        console.error('Failed to fetch related events', err)
        if (!cancelled) setRelatedEvents([])
      }
    }

    fetchRelated()

    return () => {
      cancelled = true
    }
  }, [event?._id])

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-neutral-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-neutral-500 text-sm">Loading event…</p>
        </div>
      </div>
    )
  }

  // ── Not found / error state ──
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎪</div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {error ? 'Something Went Wrong' : 'Event Not Found'}
          </h1>
          <p className="mt-2 text-neutral-500">
            {error || "The event you're looking for doesn't exist."}
          </p>
          <Link to="/events">
            <Button variant="primary" className="mt-6" icon={ArrowLeft} iconPosition="left">
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // ── Registration availability ──
  const cfg = event.registration || {}
  const now = new Date()
  const registrationOpen =
    Boolean(cfg.enabled) &&
    (!cfg.opensAt || now >= new Date(cfg.opensAt)) &&
    (!cfg.closesAt || now <= new Date(cfg.closesAt))

  const hasActiveRegistration =
    myRegistration && myRegistration.submissionStatus !== 'rejected'

  const registerHref = hasActiveRegistration
    ? `/my/registrations/${myRegistration._id}`
    : `/events/${event.slug}/register`

  const registerLabel = hasActiveRegistration
    ? 'View my registration'
    : myRegistration
      ? 'Revise & resubmit'
      : cfg.ctaLabel || 'Register Event'

  return (
    <>
      <Helmet>
        <title>{event.title} — Dealings Publishing</title>
        <meta name="description" content={event.description} />
      </Helmet>

      {/* ═══ Hero ═══ */}
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-16 bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={event.coverImage}
            alt=""
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 to-neutral-900" />
        </div>

        <div className="relative container-custom">
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-sm text-neutral-500 mb-8"
          >
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-neutral-600">/</span>
            <Link to="/events" className="hover:text-white transition-colors">Events</Link>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-300 line-clamp-1">{event.title}</span>
          </motion.nav>

          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-2"
              >
                <Badge color={eventTypeColors[event.eventType]} size="md">
                  {event.eventType}
                </Badge>
                <Badge className="bg-white/10 text-white backdrop-blur-sm border-0" size="md">
                  {event.locationType}
                </Badge>
                {registrationOpen && (
                  <Badge className="bg-emerald-500/15 text-emerald-300 backdrop-blur-sm border-0" size="md">
                    Registration open
                  </Badge>
                )}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight"
              >
                {event.title}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-neutral-400"
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  {formatDate(event.eventDate)}
                  {event.endDate && ` — ${formatDate(event.endDate)}`}
                </span>
                {event.location && (
                  <span className="flex items-start gap-1.5 max-w-xl">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{event.location}</span>
                  </span>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {registrationOpen && (
                  <Link to={registerHref}>
                    <Button variant="primary" icon={ArrowRight}>
                      {registerLabel}
                    </Button>
                  </Link>
                )}

                {event.externalUrl && (
                  <a href={event.externalUrl} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant={registrationOpen ? 'ghost' : 'primary'}
                      className={registrationOpen ? 'text-white/70 hover:text-white hover:bg-white/10' : ''}
                      icon={ExternalLink}
                      iconPosition="left"
                    >
                      Visit Event Page
                    </Button>
                  </a>
                )}

                <Button
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  icon={Share2}
                  iconPosition="left"
                  onClick={handleShare}
                >
                  Share
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden lg:block"
            >
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-72 object-cover rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ Content ═══ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 min-w-0">
              <AnimatedSection>
                <div className="rounded-2xl overflow-hidden mb-10 shadow-lg lg:hidden">
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="w-full h-[300px] object-cover"
                  />
                </div>
              </AnimatedSection>

              {/* ── About ── */}
              <AnimatedSection delay={0.1}>
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Info className="w-4 h-4 text-primary-600" />
                  </span>
                  <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                    About This Event
                  </h2>
                </div>

                {event.description && (
                  <ExpandableText
                    className="mb-8"
                    lines={5}
                    contentClassName="text-neutral-600 leading-relaxed text-lg border-l-2 border-primary-200 pl-5"
                  >
                    {event.description}
                  </ExpandableText>
                )}

                {event.content ? (
                  <ExpandableText
                    collapsedHeight={480}
                    html={event.content}
                    contentClassName="rich-content"
                    moreLabel="Read the full description"
                  />
                ) : (
                  <div className="rich-content">
                    <p>
                      This event brings together leading researchers, practitioners, and
                      thought leaders to discuss the latest developments and share their
                      insights on emerging trends in the field.
                    </p>
                  </div>
                )}
              </AnimatedSection>

              {/* ── How to register ── */}
              {registrationOpen && (
                <AnimatedSection delay={0.15}>
                  <div className="mt-12 pt-10 border-t border-neutral-200">
                    <div className="flex items-center gap-2.5 mb-6">
                      <span className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                        <ClipboardList className="w-4 h-4 text-primary-600" />
                      </span>
                      <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                        How Registration Works
                      </h2>
                    </div>

                    {cfg.instructions && (
                      <p className="text-neutral-600 leading-relaxed mb-6">{cfg.instructions}</p>
                    )}

                    <ol className="grid sm:grid-cols-2 gap-4">
                      {[
                        {
                          title: 'Create an account',
                          body: 'One participant account covers every Dealings Publishing event.',
                        },
                        {
                          title: 'Fill in the form',
                          body: 'Profile, manuscript details, attendance type, and your abstract file.',
                        },
                        {
                          title: 'Wait for review',
                          body: 'The committee accepts or asks for a revision. You can resubmit freely.',
                        },
                        {
                          title: 'Pay & get your ticket',
                          body: 'Transfer the fee, upload the receipt, and receive your e-ticket by email.',
                        },
                      ].map((step, index) => (
                        <li
                          key={step.title}
                          className="flex gap-4 p-5 rounded-2xl border border-neutral-200 bg-neutral-50/60"
                        >
                          <span className="w-7 h-7 rounded-lg bg-primary-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">{step.title}</p>
                            <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
                              {step.body}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </AnimatedSection>
              )}

              {/* ── Gallery ── */}
              {event.gallery && event.gallery.length > 0 && (
                <AnimatedSection delay={0.2}>
                  <h2 className="text-2xl font-bold text-neutral-900 mt-12 mb-6 tracking-tight">
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.gallery.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-xl"
                      />
                    ))}
                  </div>
                </AnimatedSection>
              )}

              <AnimatedSection delay={0.25}>
                <div className="mt-12 pt-8 border-t border-neutral-200">
                  <Link to="/events">
                    <Button variant="ghost" icon={ArrowLeft} iconPosition="left">
                      Back to Events
                    </Button>
                  </Link>
                </div>
              </AnimatedSection>
            </div>

            {/* ═══ Sidebar ═══ */}
            <div className="lg:col-span-1">
              <AnimatedSection delay={0.2}>
                <div className="sticky top-28 space-y-6">
                  {/* Registration CTA */}
                  {registrationOpen && (
                    <div className="bg-primary-600 rounded-2xl p-6 text-white">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        <p className="text-xs uppercase tracking-wider text-primary-100">
                          Registration open
                        </p>
                      </div>

                      <p className="mt-3 text-sm text-primary-50 leading-relaxed">
                        {hasActiveRegistration
                          ? 'You already have a registration for this event.'
                          : 'Secure your place — submit your abstract and attendance details.'}
                      </p>

                      <Link to={registerHref} className="block mt-5">
                        <Button variant="white" className="w-full" icon={ArrowRight}>
                          {registerLabel}
                        </Button>
                      </Link>

                      {cfg.closesAt && (
                        <p className="mt-3 text-xs text-primary-100 text-center">
                          Closes {formatDate(cfg.closesAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Fees */}
                  {registrationOpen && (cfg.fees || []).length > 0 && (
                    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
                        <Users className="w-4 h-4 text-neutral-400" />
                        <h3 className="text-sm font-semibold text-neutral-900">
                          Registration Fees
                        </h3>
                      </div>

                      <ul className="divide-y divide-neutral-100">
                        {cfg.fees.map((fee) => (
                          <li key={`${fee.role}-${fee.mode}`} className="px-6 py-4">
                            <p className="text-sm font-medium text-neutral-800 capitalize">
                              {fee.label || `${fee.role} — ${fee.mode}`}
                            </p>
                            <p className="mt-1 text-base font-bold text-neutral-900">
                              {formatIDR(fee.amountIdr)}
                            </p>
                            <p className="text-xs text-neutral-500">{formatUSD(fee.amountUsd)}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key dates & details */}
                  <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                    <h3 className="text-sm font-semibold text-neutral-900 mb-5">
                      Event Details
                    </h3>

                    <dl className="space-y-4">
                      <DetailRow icon={Calendar} label="Date">
                        {formatDate(event.eventDate)}
                        {event.endDate && (
                          <>
                            <br />
                            to {formatDate(event.endDate)}
                          </>
                        )}
                      </DetailRow>

                      {event.location && (
                        <DetailRow icon={MapPin} label="Location">
                          <span className="leading-relaxed">{event.location}</span>
                        </DetailRow>
                      )}

                      <DetailRow icon={Tag} label="Type">
                        <span className="capitalize">
                          {event.eventType} · {event.locationType}
                        </span>
                      </DetailRow>

                      {cfg.abstractDeadline && (
                        <DetailRow icon={CalendarClock} label="Abstract deadline">
                          {formatDate(cfg.abstractDeadline)}
                        </DetailRow>
                      )}

                      {cfg.fullPaperDeadline && (
                        <DetailRow icon={CalendarClock} label="Full paper deadline">
                          {formatDate(cfg.fullPaperDeadline)}
                        </DetailRow>
                      )}

                      {(cfg.outputTypes || []).length > 0 && (
                        <DetailRow icon={CheckCircle2} label="Publication output">
                          <ul className="space-y-1">
                            {cfg.outputTypes.map((option) => (
                              <li key={option.value}>{option.label}</li>
                            ))}
                          </ul>
                        </DetailRow>
                      )}
                    </dl>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Related Events ═══ */}
      {relatedEvents.length > 0 && (
        <section className="section-padding bg-neutral-50">
          <div className="container-custom">
            <AnimatedSection>
              <h2 className="text-2xl font-bold text-neutral-900 mb-8">
                More Events
              </h2>
            </AnimatedSection>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedEvents.map((evt, index) => (
                <EventCard key={evt._id} event={evt} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <dt className="text-xs text-neutral-500 uppercase tracking-wider">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium text-neutral-800 break-words">{children}</dd>
      </div>
    </div>
  )
}
