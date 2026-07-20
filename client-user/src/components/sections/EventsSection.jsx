// client-user/src/components/sections/EventsSection.jsx
import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import EventCard from '@/components/ui/EventCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { mockEvents } from '@/data/mockData'
import { eventAPI } from '@/services/api'

import 'swiper/css'
import 'swiper/css/navigation'

export default function EventsSection() {
  const [featuredEvents, setFeaturedEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { 
    const fetchEvents = async () => {
      try {
        const response = await eventAPI.getUpcoming()
        const apiEvents = response?.data || []

        if (apiEvents.length > 0) {
          setFeaturedEvents(apiEvents)
        } else {
          setFeaturedEvents(mockEvents.filter((e) => e.isFeatured))
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
        setFeaturedEvents(mockEvents.filter((e) => e.isFeatured))
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const eventsToDisplay =
    featuredEvents.length > 0
      ? featuredEvents
      : mockEvents.filter((e) => e.isFeatured)

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <SectionHeader
          title="Events"
          subtitle="Conferences, webinars, and workshops we've attended and organized."
          linkText="View All Events"
          linkTo="/events"
        />

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white rounded-2xl border border-neutral-100 overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-neutral-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-neutral-100 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                  <div className="h-3 bg-neutral-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="relative group/carousel">
              <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={24}
                slidesPerView={1}
                navigation={{
                  prevEl: '.events-prev',
                  nextEl: '.events-next',
                }}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
              >
                {eventsToDisplay.map((event, index) => (
                  <SwiperSlide key={event._id}>
                    <EventCard event={event} index={index} />
                  </SwiperSlide>
                ))}
              </Swiper>

              <button
                className="events-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-11 h-11 bg-white rounded-full shadow-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-200 transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-30"
                aria-label="Previous"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                className="events-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-11 h-11 bg-white rounded-full shadow-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-200 transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-30"
                aria-label="Next"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link
                to="/events"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600"
              >
                View All Events
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}