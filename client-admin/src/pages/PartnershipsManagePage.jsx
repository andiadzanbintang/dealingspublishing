import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Handshake,
  ExternalLink,
} from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { partnershipAPI } from '@/services/api'

export default function PartnershipsManagePage() {
  const navigate = useNavigate()

  const [partnerships, setPartnerships] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')

  const fetchPartnerships = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await partnershipAPI.getAll({
        limit: 100,
        sort: 'displayOrder,-createdAt',
      })

      setPartnerships(response?.data || [])
    } catch (err) {
      console.error('Failed to fetch partnerships:', err)
      setError(
        err.response?.data?.message ||
          'Failed to load partnerships. Please try again.'
      )
      setPartnerships([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartnerships()
  }, [])

  const handleDelete = async (id) => {
    if (!id) return

    setActionLoading(`delete-${id}`)
    setError('')

    try {
      await partnershipAPI.delete(id)
      setPartnerships((prev) => prev.filter((item) => item._id !== id))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete partnership:', err)
      setError(
        err.response?.data?.message ||
          'Failed to delete partnership. Please try again.'
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
      const response = await partnershipAPI.togglePublish(id)
      const updatedPartnership = response?.data

      if (updatedPartnership) {
        setPartnerships((prev) =>
          prev.map((item) =>
            item._id === id ? updatedPartnership : item
          )
        )
      } else {
        await fetchPartnerships()
      }
    } catch (err) {
      console.error('Failed to toggle partnership status:', err)
      setError(
        err.response?.data?.message ||
          'Failed to update partnership status. Please try again.'
      )
    } finally {
      setActionLoading('')
    }
  }

  const columns = [
    {
      accessorKey: 'name',
      header: 'Partnership',
      cell: ({ row }) => {
        const partnership = row.original

        return (
          <div className="flex items-center gap-3">
            {partnership.photo ? (
              <img
                src={partnership.photo}
                alt={partnership.name}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 flex-shrink-0">
                <Handshake className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate max-w-xs">
                {partnership.name}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1 max-w-md">
                {partnership.description || '—'}
              </p>

              {partnership.externalUrl && (
                <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate max-w-md">{partnership.externalUrl}</span>
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'displayOrder',
      header: 'Order',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500">
          {row.original.displayOrder ?? 0}
        </span>
      ),
    },
    {
      accessorKey: 'isPublished',
      header: 'Status',
      cell: ({ row }) => {
        const partnership = row.original
        const isLoading = actionLoading === `publish-${partnership._id}`

        return (
          <button
            type="button"
            onClick={() => handleTogglePublish(partnership._id)}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              partnership.isPublished
                ? 'bg-success-50 text-success-600 hover:bg-success-100'
                : 'bg-warning-50 text-warning-600 hover:bg-warning-100'
            }`}
          >
            {partnership.isPublished ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            {isLoading
              ? 'Updating...'
              : partnership.isPublished
                ? 'Published'
                : 'Draft'}
          </button>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const partnership = row.original
        const isDeleting = actionLoading === `delete-${partnership._id}`

        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate(`/partnerships/edit/${partnership._id}`)}
              className="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setDeleteTarget(partnership)}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Partnerships
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage partnership logos, names, and descriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchPartnerships}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => navigate('/partnerships/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Partnership
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={partnerships}
        loading={loading}
        emptyMessage="No partnerships found."
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Partnership"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={Boolean(
          deleteTarget && actionLoading === `delete-${deleteTarget._id}`
        )}
        onConfirm={() => handleDelete(deleteTarget?._id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}