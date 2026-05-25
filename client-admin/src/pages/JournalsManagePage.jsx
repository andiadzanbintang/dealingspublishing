// src/pages/JournalsManagePage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Star, StarOff, Eye, RefreshCw } from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/utils'
import { journalAPI } from '@/services/api'

export default function JournalsManagePage() {
  const navigate = useNavigate()
  const [journals, setJournals] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')

  const fetchJournals = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await journalAPI.getAll({
        limit: 100,
        sort: '-createdAt',
      })

      setJournals(response?.data || [])
    } catch (err) {
      console.error('Failed to fetch journals:', err)
      setError(
        err.response?.data?.message ||
          'Failed to load journals. Please try again.'
      )
      setJournals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJournals()
  }, [])

  const handleDelete = async (id) => {
    if (!id) return

    setActionLoading(`delete-${id}`)
    setError('')

    try {
      await journalAPI.delete(id)
      setJournals((prev) => prev.filter((journal) => journal._id !== id))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete journal:', err)
      setError(
        err.response?.data?.message ||
          'Failed to delete journal. Please try again.'
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
      const response = await journalAPI.toggleFeatured(id)
      const updatedJournal = response?.data

      if (updatedJournal) {
        setJournals((prev) =>
          prev.map((journal) =>
            journal._id === id ? updatedJournal : journal
          )
        )
      } else {
        await fetchJournals()
      }
    } catch (err) {
      console.error('Failed to toggle featured journal:', err)
      setError(
        err.response?.data?.message ||
          'Failed to update featured status. Please try again.'
      )
    } finally {
      setActionLoading('')
    }
  }

  const handleToggleStatus = async (id) => {
    if (!id) return

    setActionLoading(`status-${id}`)
    setError('')

    try {
      const response = await journalAPI.toggleStatus(id)
      const updatedJournal = response?.data

      if (updatedJournal) {
        setJournals((prev) =>
          prev.map((journal) =>
            journal._id === id ? updatedJournal : journal
          )
        )
      } else {
        await fetchJournals()
      }
    } catch (err) {
      console.error('Failed to toggle journal status:', err)
      setError(
        err.response?.data?.message ||
          'Failed to update publication status. Please try again.'
      )
    } finally {
      setActionLoading('')
    }
  }

  const columns = [
    {
      accessorKey: 'title',
      header: 'Journal',
      cell: ({ row }) => {
        const journal = row.original

        return (
          <div className="flex items-center gap-3">
            {journal.coverImage ? (
              <img
                src={journal.coverImage}
                alt={journal.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 flex-shrink-0">
                No Img
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate max-w-xs">
                {journal.title}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                ISSN: {journal.issn || '—'}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'topic',
      header: 'Topic',
      cell: ({ row }) => {
        const topic = row.original.topic

        if (!topic) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">
              Uncategorized
            </span>
          )
        }

        return (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${topic.color || '#6366F1'}15`,
              color: topic.color || '#6366F1',
            }}
          >
            {topic.icon ? `${topic.icon} ` : ''}
            {topic.name}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const journal = row.original
        const status = journal.status
        const isLoading = actionLoading === `status-${journal._id}`

        return (
          <button
            onClick={() => handleToggleStatus(journal._id)}
            disabled={isLoading}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              status === 'published'
                ? 'bg-success-50 text-success-600 hover:bg-success-100'
                : 'bg-warning-50 text-warning-600 hover:bg-warning-100'
            }`}
          >
            {isLoading
              ? 'Updating...'
              : status === 'published'
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
        const journal = row.original
        const isLoading = actionLoading === `featured-${journal._id}`

        return (
          <button
            onClick={() => handleToggleFeatured(journal._id)}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={journal.isFeatured ? 'Remove from featured' : 'Mark as featured'}
          >
            {journal.isFeatured ? (
              <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
            ) : (
              <StarOff className="w-4 h-4 text-neutral-300" />
            )}
          </button>
        )
      },
    },
    {
      accessorKey: 'viewCount',
      header: 'Views',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm text-neutral-500">
          <Eye className="w-3.5 h-3.5" />
          {(row.original.viewCount || 0).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'publicationDate',
      header: 'Published',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500">
          {row.original.publicationDate
            ? formatDate(row.original.publicationDate)
            : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const journal = row.original
        const isDeleting = actionLoading === `delete-${journal._id}`

        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/journals/edit/${journal._id}`)}
              className="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={() => setDeleteTarget(journal)}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Journals</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your published journals and research papers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchJournals}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => navigate('/journals/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Journal
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Loading journals...</p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={journals}
          searchPlaceholder="Search journals by title, ISSN..."
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?._id)}
        title="Delete Journal"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText={
          actionLoading === `delete-${deleteTarget?._id}`
            ? 'Deleting...'
            : 'Delete Journal'
        }
      />
    </div>
  )
}