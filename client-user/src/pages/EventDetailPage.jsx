// src/pages/EventDetailPage.jsx
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Calendar,
  MapPin,
  ArrowLeft,
  Share2,
  ExternalLink,
  Clock,
  Tag,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EventCard from '@/components/ui/EventCard'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { formatDate } from '@/lib/utils'
import { mockEvents } from '@/data/mockData'

const eventTypeColors = {
  conference: '#6366F1',
  webinar: '#10B981',
  workshop: '#F59E0B',
  seminar: '#EC4899',
}

export default function EventDetailPage() {
  const { slug } = useParams()

  const event = mockEvents.find((e) => e.slug === slug)
  const relatedEvents = mockEvents
    .filter((e) => e._id !== event?._id)
    .slice(0, 3)

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎪</div>
          <h1 className="text-2xl font-bold text-neutral-900">Event Not Found</h1>
          <p className="mt-2 text-neutral-500">
            The event you&apos;re looking for doesn&apos;t exist.
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

  return (
    <>
      <Helmet>
        <title>{event.title} — ResearchHub</title>
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
          {/* Breadcrumbs */}
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
            {/* Left — Info */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex gap-2"
              >
                <Badge color={eventTypeColors[event.eventType]} size="md">
                  {event.eventType}
                </Badge>
                <Badge className="bg-white/10 text-white backdrop-blur-sm border-0" size="md">
                  {event.locationType}
                </Badge>
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
                className="mt-6 flex flex-wrap items-center gap-4 text-sm text-neutral-400"
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(event.eventDate)}
                  {event.endDate && ` — ${formatDate(event.endDate)}`}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {event.externalUrl && (
                  <a href={event.externalUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary" icon={ExternalLink} iconPosition="left">
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

            {/* Right — Image */}
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
            {/* Left — Description */}
            <div className="lg:col-span-2">
              <AnimatedSection>
                <div className="rounded-2xl overflow-hidden mb-10 shadow-lg lg:hidden">
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="w-full h-[300px] object-cover"
                  />
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.1}>
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                  About This Event
                </h2>
                <p className="text-neutral-600 leading-relaxed text-lg mb-6">
                  {event.description}
                </p>

                {/* TODO: Replace with event.content (HTML from backend) */}
                <div className="prose prose-neutral prose-lg max-w-none">
                  <p>
                    This event brought together leading researchers, practitioners,
                    and thought leaders to discuss the latest developments and
                    share their insights on emerging trends in the field.
                  </p>
                  <p>
                    Attendees had the opportunity to participate in keynote
                    sessions, panel discussions, poster presentations, and
                    networking activities designed to foster collaboration and
                    knowledge exchange.
                  </p>
                </div>
              </AnimatedSection>

              {/* Gallery (if available) */}
              {event.gallery && event.gallery.length > 0 && (
                <AnimatedSection delay={0.15}>
                  <h2 className="text-2xl font-bold text-neutral-900 mt-10 mb-6">
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

              {/* Back */}
              <AnimatedSection delay={0.2}>
                <div className="mt-12 pt-8 border-t border-neutral-200">
                  <Link to="/events">
                    <Button variant="ghost" icon={ArrowLeft} iconPosition="left">
                      Back to Events
                    </Button>
                  </Link>
                </div>
              </AnimatedSection>
            </div>

            {/* Right — Sidebar */}
            <div className="lg:col-span-1">
              <AnimatedSection delay={0.2}>
                <div className="sticky top-28 space-y-6">
                  {/* Event Info Card */}
                  <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-5">
                      Event Details
                    </h3>
                    <dl className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <dt className="text-xs text-neutral-500 uppercase tracking-wider">
                            Date
                          </dt>
                          <dd className="mt-0.5 text-sm font-medium text-neutral-800">
                            {formatDate(event.eventDate)}
                            {event.endDate && (
                              <>
                                <br />
                                to {formatDate(event.endDate)}
                              </>
                            )}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <dt className="text-xs text-neutral-500 uppercase tracking-wider">
                            Location
                          </dt>
                          <dd className="mt-0.5 text-sm font-medium text-neutral-800">
                            {event.location}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Tag className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <dt className="text-xs text-neutral-500 uppercase tracking-wider">
                            Type
                          </dt>
                          <dd className="mt-0.5 text-sm font-medium text-neutral-800 capitalize">
                            {event.eventType} · {event.locationType}
                          </dd>
                        </div>
                      </div>
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