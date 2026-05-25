// src/pages/BooksManagePage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Star,
  StarOff,
  BookOpen,
} from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { bookAPI } from '@/services/api'

export default function BooksManagePage() {
  const navigate = useNavigate()

  const [books, setBooks] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')

  const fetchBooks = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await bookAPI.getAll({
        limit: 100,
        sort: '-createdAt',
      })

      setBooks(response?.data || [])
    } catch (err) {
      console.error('Failed to fetch books:', err)
      setError(
        err.response?.data?.message ||
          'Failed to load books. Please try again.'
      )
      setBooks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const handleDelete = async (id) => {
    if (!id) return

    setActionLoading(`delete-${id}`)
    setError('')

    try {
      await bookAPI.delete(id)
      setBooks((prev) => prev.filter((book) => book._id !== id))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete book:', err)
      setError(
        err.response?.data?.message ||
          'Failed to delete book. Please try again.'
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
      const response = await bookAPI.togglePublish(id)
      const updatedBook = response?.data

      if (updatedBook) {
        setBooks((prev) =>
          prev.map((book) => (book._id === id ? updatedBook : book))
        )
      } else {
        await fetchBooks()
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
      const response = await bookAPI.toggleFeatured(id)
      const updatedBook = response?.data

      if (updatedBook) {
        setBooks((prev) =>
          prev.map((book) => (book._id === id ? updatedBook : book))
        )
      } else {
        await fetchBooks()
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
      header: 'Book',
      cell: ({ row }) => {
        const book = row.original

        return (
          <div className="flex items-center gap-3">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-10 h-14 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-14 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 flex-shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate max-w-xs">
                {book.title}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                ISBN: {book.isbn || '—'}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'writers',
      header: 'Writers',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500">
          {row.original.writers?.join(', ') || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'publishedBy',
      header: 'Publisher',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500">
          {row.original.publishedBy || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'publicationYear',
      header: 'Year',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500">
          {row.original.publicationYear || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'isPublished',
      header: 'Status',
      cell: ({ row }) => {
        const book = row.original
        const isLoading = actionLoading === `publish-${book._id}`

        return (
          <button
            type="button"
            onClick={() => handleTogglePublish(book._id)}
            disabled={isLoading}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              book.isPublished
                ? 'bg-success-50 text-success-600 hover:bg-success-100'
                : 'bg-warning-50 text-warning-600 hover:bg-warning-100'
            }`}
          >
            {isLoading
              ? 'Updating...'
              : book.isPublished
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
        const book = row.original
        const isLoading = actionLoading === `featured-${book._id}`

        return (
          <button
            type="button"
            onClick={() => handleToggleFeatured(book._id)}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={book.isFeatured ? 'Remove from featured' : 'Mark as featured'}
          >
            {book.isFeatured ? (
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
        const book = row.original
        const isDeleting = actionLoading === `delete-${book._id}`

        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate(`/books/edit/${book._id}`)}
              className="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setDeleteTarget(book)}
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
          <h1 className="text-2xl font-bold text-neutral-900">Books</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage books, publications, and book metadata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBooks}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => navigate('/books/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Book
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
            <p className="text-sm text-neutral-500">Loading books...</p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={books}
          searchPlaceholder="Search books by title, writer, ISBN..."
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?._id)}
        title="Delete Book"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText={
          actionLoading === `delete-${deleteTarget?._id}`
            ? 'Deleting...'
            : 'Delete Book'
        }
      />
    </div>
  )
}