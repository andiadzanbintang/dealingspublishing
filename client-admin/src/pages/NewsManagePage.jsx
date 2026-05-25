// src/pages/NewsManagePage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Star,
  StarOff,
} from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/utils'
import { newsAPI } from '@/services/api'

export default function NewsManagePage() {
  const navigate = useNavigate()
  const [news, setNews] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')

  const fetchNews = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await newsAPI.getAll({
        limit: 100,
        sort: '-createdAt',
      })

      setNews(response?.data || [])
    } catch (err) {
      console.error('Failed to fetch news:', err)
      setError(
        err.response?.data?.message ||
          'Failed to load news articles. Please try again.'
      )
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const handleDelete = async (id) => {
    if (!id) return

    setActionLoading(`delete-${id}`)
    setError('')

    try {
      await newsAPI.delete(id)
      setNews((prev) => prev.filter((item) => item._id !== id))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete news article:', err)
      setError(
        err.response?.data?.message ||
          'Failed to delete article. Please try again.'
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
      const response = await newsAPI.togglePublish(id)
      const updatedArticle = response?.data

      if (updatedArticle) {
        setNews((prev) =>
          prev.map((item) => (item._id === id ? updatedArticle : item))
        )
      } else {
        await fetchNews()
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
      const response = await newsAPI.toggleFeatured(id)
      const updatedArticle = response?.data

      if (updatedArticle) {
        setNews((prev) =>
          prev.map((item) => (item._id === id ? updatedArticle : item))
        )
      } else {
        await fetchNews()
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
      header: 'Article',
      cell: ({ row }) => {
        const article = row.original

        return (
          <div className="flex items-center gap-3">
            {article.coverImage ? (
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 flex-shrink-0">
                No Img
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate max-w-xs">
                {article.title}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {article.category || 'Uncategorized'}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'isPublished',
      header: 'Status',
      cell: ({ row }) => {
        const article = row.original
        const isLoading = actionLoading === `publish-${article._id}`

        return (
          <button
            onClick={() => handleTogglePublish(article._id)}
            disabled={isLoading}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              article.isPublished
                ? 'bg-success-50 text-success-600 hover:bg-success-100'
                : 'bg-warning-50 text-warning-600 hover:bg-warning-100'
            }`}
          >
            {isLoading
              ? 'Updating...'
              : article.isPublished
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
        const article = row.original
        const isLoading = actionLoading === `featured-${article._id}`

        return (
          <button
            onClick={() => handleToggleFeatured(article._id)}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={article.isFeatured ? 'Remove from featured' : 'Mark as featured'}
          >
            {article.isFeatured ? (
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
      accessorKey: 'publishedAt',
      header: 'Published',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500">
          {row.original.publishedAt ? formatDate(row.original.publishedAt) : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const article = row.original
        const isDeleting = actionLoading === `delete-${article._id}`

        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/news/edit/${article._id}`)}
              className="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={() => setDeleteTarget(article)}
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
          <h1 className="text-2xl font-bold text-neutral-900">News</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage news articles and announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNews}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => navigate('/news/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add News
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
            <p className="text-sm text-neutral-500">Loading news articles...</p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={news}
          searchPlaceholder="Search news articles..."
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?._id)}
        title="Delete Article"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText={
          actionLoading === `delete-${deleteTarget?._id}`
            ? 'Deleting...'
            : 'Delete Article'
        }
      />
    </div>
  )
}