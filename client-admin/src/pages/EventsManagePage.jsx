// src/pages/EventsManagePage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  RefreshCw,
  Star,
  StarOff,
} from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/utils'
import { eventAPI } from '@/services/api'

const eventTypeColors = {
  conference: 'bg-primary-50 text-primary-600',
  webinar: 'bg-success-50 text-success-600',
  workshop: 'bg-warning-50 text-warning-600',
  seminar: 'bg-danger-50 text-danger-600',
}

export default function EventsManagePage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')

  const fetchEvents = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await eventAPI.getAll({
        limit: 100,
        sort: '-createdAt',
      })

      setEvents(response?.data || [])
    } catch (err) {
      console.error('Failed to fetch events:', err)
      setError(
        err.response?.data?.message ||
          'Failed to load events. Please try again.'
      )
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleDelete = async (id) => {
    if (!id) return

    setActionLoading(`delete-${id}`)
    setError('')

    try {
      await eventAPI.delete(id)
      setEvents((prev) => prev.filter((event) => event._id !== id))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete event:', err)
      setError(
        err.response?.data?.message ||
          'Failed to delete event. Please try again.'
      )
    } finally {
      setActionLoading('')
    }
  }

  const handleTogglePublish = async (id) => {
    if (!id) return

    setActionLoading(`publish-${id}`)
    setError('')

    try {
      const response = await eventAPI.togglePublish(id)
      const updatedEvent = response?.data

      if (updatedEvent) {
        setEvents((prev) =>
          prev.map((event) => (event._id === id ? updatedEvent : event))
        )
      } else {
        await fetchEvents()
      }
    } catch (err) {
      console.error('Failed to toggle publish status:', err)
      setError(
        err.response?.data?.message ||
          'Failed to update publish status. Please try again.'
      )
    } finally {
      setActionLoading('')
    }
  }

  const handleToggleFeatured = async (id) => {
    if (!id) return

    setActionLoading(`featured-${id}`)
    setError('')

    try {
      const response = await eventAPI.toggleFeatured(id)
      const updatedEvent = response?.data

      if (updatedEvent) {
        setEvents((prev) =>
          prev.map((event) => (event._id === id ? updatedEvent : event))
        )
      } else {
        await fetchEvents()
      }
    } catch (err) {
      console.error('Failed to toggle featured status:', err)
      setError(
        err.response?.data?.message ||
          'Failed to update featured status. Please try again.'
      )
    } finally {
      setActionLoading('')
    }
  }

  const columns = [
    {
      accessorKey: 'title',
      header: 'Event',
      cell: ({ row }) => {
        const event = row.original

        return (
          <div className="flex items-center gap-3">
            {event.coverImage ? (
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 flex-shrink-0">
                No Img
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate max-w-xs">
                {event.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-neutral-400" />
                <span className="text-xs text-neutral-400">
                  {event.location || 'No location'}
                </span>
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'eventType',
      header: 'Type',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
            eventTypeColors[row.original.eventType] ||
            'bg-neutral-100 text-neutral-600'
          }`}
        >
          {row.original.eventType || 'event'}
        </span>
      ),
    },
    {
      accessorKey: 'locationType',
      header: 'Format',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500 capitalize">
          {row.original.locationType || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'eventDate',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
          <Calendar className="w-3.5 h-3.5" />
          {row.original.eventDate ? formatDate(row.original.eventDate) : '—'}
        </div>
      ),
    },
    {
      accessorKey: 'isPublished',
      header: 'Status',
      cell: ({ row }) => {
        const event = row.original
        const isLoading = actionLoading === `publish-${event._id}`

        return (
          <button
            onClick={() => handleTogglePublish(event._id)}
            disabled={isLoading}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              event.isPublished
                ? 'bg-success-50 text-success-600 hover:bg-success-100'
                : 'bg-warning-50 text-warning-600 hover:bg-warning-100'
            }`}
          >
            {isLoading
              ? 'Updating...'
              : event.isPublished
                ? 'Published'
                : 'Draft'}
          </button>
        )
      },
    },
    {
      accessorKey: 'isFeatured',
      header: 'Featured',
      cell: ({ row }) => {
        const event = row.original
        const isLoading = actionLoading === `featured-${event._id}`

        return (
          <button
            onClick={() => handleToggleFeatured(event._id)}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={event.isFeatured ? 'Remove from featured' : 'Mark as featured'}
          >
            {event.isFeatured ? (
              <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
            ) : (
              <StarOff className="w-4 h-4 text-neutral-300" />
            )}
          </button>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const event = row.original
        const isDeleting = actionLoading === `delete-${event._id}`

        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/events/edit/${event._id}`)}
              className="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={() => setDeleteTarget(event)}
              disabled={isDeleting}
              className="p-2 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Events</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage conferences, webinars, and workshops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => navigate('/events/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
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
            <p className="text-sm text-neutral-500">Loading events...</p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={events}
          searchPlaceholder="Search events..."
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?._id)}
        title="Delete Event"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText={
          actionLoading === `delete-${deleteTarget?._id}`
            ? 'Deleting...'
            : 'Delete Event'
        }
      />
    </div>
  )
}