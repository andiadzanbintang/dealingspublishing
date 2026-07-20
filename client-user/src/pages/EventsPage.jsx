// client-user/src/pages/EventsPage.jsx
import { useEffect, useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import EventCard from '@/components/ui/EventCard'
import SubscribeSection from '@/components/sections/SubscribeSection'
import { mockEvents } from '@/data/mockData'
import { eventAPI } from '@/services/api'

export default function EventsPage() {
  const [eventsList, setEventsList] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)

  const eventTypes = ['conference', 'webinar', 'workshop', 'seminar']

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)

      try {
        const response = await eventAPI.getAll({
          limit: 100,
          sort: '-eventDate',
        })

        const apiEvents = response?.data || []

        if (apiEvents.length > 0) {
          setEventsList(apiEvents)
          setUsingFallback(false)
        } else {
          setEventsList(mockEvents)
          setUsingFallback(true)
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
        setEventsList(mockEvents)
        setUsingFallback(true)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const filteredEvents = useMemo(() => {
    let result = [...eventsList]

    if (selectedType) {
      result = result.filter((event) => event.eventType === selectedType)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()

      result = result.filter((event) => {
        const title = event.title?.toLowerCase() || ''
        const description = event.description?.toLowerCase() || ''
        const content = event.content?.toLowerCase() || ''
        const location = event.location?.toLowerCase() || ''
        const eventType = event.eventType?.toLowerCase() || ''
        const locationType = event.locationType?.toLowerCase() || ''
        const tags = event.tags?.join(' ').toLowerCase() || ''

        return (
          title.includes(query) ||
          description.includes(query) ||
          content.includes(query) ||
          location.includes(query) ||
          eventType.includes(query) ||
          locationType.includes(query) ||
          tags.includes(query)
        )
      })
    }

    result.sort((a, b) => {
      const dateA = new Date(a.eventDate || a.createdAt || 0)
      const dateB = new Date(b.eventDate || b.createdAt || 0)
      return dateB - dateA
    })

    return result
  }, [eventsList, searchQuery, selectedType])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedType(null)
  }

  return (
    <>
      <Helmet>
        <title>Events — Design Publishing</title>
        <meta
          name="description"
          content="Browse conferences, webinars, workshops, and seminars attended or organized by Design Publishing."
        />
      </Helmet>

      <PageHeader
        title="Events"
        subtitle="Conferences, webinars, and workshops we've attended and organized across the globe."
        breadcrumbs={[{ label: 'Events' }]}
        backgroundImage="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80"
      />

      {/* ═══ Filter Bar ═══ */}
      <section className="sticky top-16 md:top-20 z-30 bg-white/95 backdrop-blur-xl border-b border-neutral-100 shadow-sm">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by name or location..."
                className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-200 text-neutral-400"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedType(null)}
                className={`px-4 py-2 text-xs font-medium rounded-full border capitalize transition-all ${
                  !selectedType
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                }`}
              >
                All
              </button>

              {eventTypes.map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    setSelectedType(selectedType === type ? null : type)
                  }
                  className={`px-4 py-2 text-xs font-medium rounded-full border capitalize transition-all ${
                    selectedType === type
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Events Grid ═══ */}
      <section className="section-padding bg-neutral-50">
        <div className="container-custom">
          <div className="mb-6">
            <p className="text-sm text-neutral-500">
              {loading
                ? 'Loading events...'
                : `${filteredEvents.length} event${
                    filteredEvents.length !== 1 ? 's' : ''
                  } found`}
            </p>

            {usingFallback && !loading && (
              <p className="mt-1 text-xs text-neutral-400">
                Showing sample events while backend content is unavailable or empty.
              </p>
            )}
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
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
          ) : filteredEvents.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, index) => (
                <EventCard key={event._id} event={event} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎪</div>
              <h3 className="text-xl font-semibold text-neutral-900">
                No events found
              </h3>
              <p className="mt-2 text-neutral-500">
                Try adjusting your search or filter.
              </p>
              <button
                onClick={clearFilters}
                className="mt-6 px-6 py-3 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      <SubscribeSection />
    </>
  )
}