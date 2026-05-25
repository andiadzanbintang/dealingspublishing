// src/pages/SubscribersPage.jsx
import { useEffect, useState } from 'react'
import {
  Trash2,
  Download,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/utils'
import { subscriberAPI } from '@/services/api'

const statusConfig = {
  active: {
    label: 'Active',
    icon: CheckCircle,
    class: 'bg-success-50 text-success-600',
  },
  unsubscribed: {
    label: 'Unsubscribed',
    icon: XCircle,
    class: 'bg-neutral-100 text-neutral-500',
  },
  bounced: {
    label: 'Bounced',
    icon: AlertCircle,
    class: 'bg-danger-50 text-danger-600',
  },
}

const defaultStats = {
  total: 0,
  active: 0,
  unsubscribed: 0,
  unverified: 0,
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState([])
  const [stats, setStats] = useState(defaultStats)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showNewsletter, setShowNewsletter] = useState(false)
  const [newsletterSubject, setNewsletterSubject] = useState('')
  const [newsletterContent, setNewsletterContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const fetchSubscribers = async () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const [subscribersResponse, statsResponse] = await Promise.all([
        subscriberAPI.getAll({ limit: 100, sort: '-subscribedAt' }),
        subscriberAPI.getStats(),
      ])

      setSubscribers(subscribersResponse?.data || [])
      setStats(statsResponse?.data || defaultStats)
    } catch (err) {
      console.error('Failed to fetch subscribers:', err)
      setError(
        err.response?.data?.message ||
          'Failed to load subscribers. Please try again.'
      )
      setSubscribers([])
      setStats(defaultStats)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const handleDelete = async (id) => {
    if (!id) return

    setActionLoading(`delete-${id}`)
    setError('')
    setSuccessMessage('')

    try {
      await subscriberAPI.delete(id)
      setSubscribers((prev) => prev.filter((subscriber) => subscriber._id !== id))
      setDeleteTarget(null)

      // Refresh stats after deletion
      const statsResponse = await subscriberAPI.getStats()
      setStats(statsResponse?.data || defaultStats)

      setSuccessMessage('Subscriber removed successfully.')
    } catch (err) {
      console.error('Failed to remove subscriber:', err)
      setError(
        err.response?.data?.message ||
          'Failed to remove subscriber. Please try again.'
      )
    } finally {
      setActionLoading('')
    }
  }

  const handleExportCSV = () => {
    const headers = ['Email', 'Name', 'Status', 'Verified', 'Subscribed At']
    const rows = subscribers.map((subscriber) => [
      subscriber.email,
      subscriber.name || '',
      subscriber.status,
      subscriber.isVerified ? 'Yes' : 'No',
      subscriber.subscribedAt ? formatDate(subscriber.subscribedAt) : '',
    ])

    const escapeCSV = (value) => {
      const stringValue = String(value ?? '')
      if (
        stringValue.includes(',') ||
        stringValue.includes('"') ||
        stringValue.includes('\n')
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = `subscribers_${new Date().toISOString().split('T')[0]}.csv`
    a.click()

    URL.revokeObjectURL(url)
  }

  const handleSendNewsletter = async () => {
    if (!newsletterSubject.trim() || !newsletterContent.trim()) return

    setSending(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await subscriberAPI.sendNewsletter({
        subject: newsletterSubject.trim(),
        content: newsletterContent,
      })

      setSuccessMessage(response?.message || 'Newsletter sent successfully.')
      setShowNewsletter(false)
      setNewsletterSubject('')
      setNewsletterContent('')
    } catch (err) {
      console.error('Failed to send newsletter:', err)
      setError(
        err.response?.data?.message ||
          'Failed to send newsletter. Please try again.'
      )
    } finally {
      setSending(false)
    }
  }

  const activeCount = stats.active || 0
  const verifiedCount = subscribers.filter((subscriber) => subscriber.isVerified).length
  const totalCount = stats.total || subscribers.length

  const columns = [
    {
      accessorKey: 'email',
      header: 'Subscriber',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-neutral-900">
            {row.original.email}
          </p>
          {row.original.name && (
            <p className="text-xs text-neutral-400 mt-0.5">
              {row.original.name}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const config =
          statusConfig[row.original.status] || statusConfig.unsubscribed
        const Icon = config.icon

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.class}`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        )
      },
    },
    {
      accessorKey: 'isVerified',
      header: 'Verified',
      cell: ({ row }) => (
        <span
          className={`text-sm ${
            row.original.isVerified ? 'text-success-600' : 'text-neutral-400'
          }`}
        >
          {row.original.isVerified ? '✓ Verified' : 'Pending'}
        </span>
      ),
    },
    {
      accessorKey: 'subscribedAt',
      header: 'Subscribed',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500">
          {row.original.subscribedAt
            ? formatDate(row.original.subscribedAt)
            : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const subscriber = row.original
        const isDeleting = actionLoading === `delete-${subscriber._id}`

        return (
          <button
            onClick={() => setDeleteTarget(subscriber)}
            disabled={isDeleting}
            className="p-2 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove subscriber"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Subscribers</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {activeCount} active · {verifiedCount} verified · {totalCount} total
          </p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {stats.unverified || 0} unverified · {stats.unsubscribed || 0}{' '}
            unsubscribed
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSubscribers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={subscribers.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={() => setShowNewsletter(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
            Send Newsletter
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-success-50 border border-success-200 text-success-600 rounded-xl px-4 py-3 text-sm">
          {successMessage}
        </div>
      )}

      {/* Newsletter Modal */}
      {showNewsletter && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Send Newsletter
            </h2>
            <button
              onClick={() => {
                setShowNewsletter(false)
                setNewsletterSubject('')
                setNewsletterContent('')
              }}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
          </div>

          <p className="text-sm text-neutral-500 mb-4">
            This will send an email to all <strong>{activeCount}</strong> active
            and verified subscribers.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Subject Line
              </label>
              <input
                value={newsletterSubject}
                onChange={(e) => setNewsletterSubject(e.target.value)}
                placeholder="e.g. New Journals Published This Month"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Email Content
              </label>
              <textarea
                value={newsletterContent}
                onChange={(e) => setNewsletterContent(e.target.value)}
                rows={8}
                placeholder="<h2>Latest Research Updates</h2><p>Write your newsletter content here...</p>"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono"
              />
              <p className="mt-1 text-xs text-neutral-400">
                HTML content is supported.
              </p>
            </div>

            <button
              onClick={handleSendNewsletter}
              disabled={
                sending ||
                !newsletterSubject.trim() ||
                !newsletterContent.trim() ||
                activeCount === 0
              }
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? 'Sending...' : `Send to ${activeCount} subscribers`}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Loading subscribers...</p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={subscribers}
          searchPlaceholder="Search by email..."
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?._id)}
        title="Remove Subscriber"
        description={`Remove "${deleteTarget?.email}" from subscribers?`}
        confirmText={
          actionLoading === `delete-${deleteTarget?._id}` ? 'Removing...' : 'Remove'
        }
      />
    </div>
  )
}