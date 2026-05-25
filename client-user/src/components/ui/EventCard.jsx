// src/components/ui/EventCard.jsx
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Tag } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'

const eventTypeColors = {
  conference: '#6366F1',
  webinar: '#10B981',
  workshop: '#F59E0B',
  seminar: '#EC4899',
}

const locationTypeIcons = {
  'in-person': '📍',
  virtual: '💻',
  hybrid: '🌐',
}

export default function EventCard({ event, index = 0 }) {
  const eventDate = new Date(event.eventDate)
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' })
  const day = eventDate.getDate()

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link
        to={`/events/${event.slug}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-lg hover:border-neutral-200 transition-all duration-300"
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Date Badge */}
          <div className="absolute top-4 left-4 bg-white rounded-xl p-2.5 text-center shadow-md min-w-[56px]">
            <div className="text-xs font-semibold text-primary-600 uppercase">
              {month}
            </div>
            <div className="text-xl font-bold text-neutral-900 leading-none mt-0.5">
              {day}
            </div>
          </div>

          {/* Event Type Badge */}
          <div className="absolute top-4 right-4">
            <Badge color={eventTypeColors[event.eventType]} size="sm">
              {event.eventType}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
            {event.title}
          </h3>

          <p className="mt-2 text-sm text-neutral-500 line-clamp-2">
            {event.description}
          </p>

          {/* Meta */}
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatDate(event.eventDate)}</span>
              {event.endDate && (
                <span className="text-neutral-300">
                  — {formatDate(event.endDate)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {locationTypeIcons[event.locationType]} {event.location}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}