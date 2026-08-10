// src/pages/UsersManagePage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Mail,
  RefreshCw,
  UsersRound,
  Wallet,
} from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import { formatDate, formatIDR } from '@/lib/utils'
import { participantAPI } from '@/services/api'

export default function UsersManagePage() {
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const [list, statsResponse] = await Promise.all([
        participantAPI.getAll({ limit: 500 }),
        participantAPI.getStats(),
      ])

      setUsers(list?.data || [])
      setStats(statsResponse?.data || null)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setError(err.response?.data?.message || 'Failed to load users. Please try again.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleExport = () => {
    if (users.length === 0) {
      setError('There is nothing to export yet.')
      return
    }

    const rows = users.map((user) => ({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      affiliation: user.affiliation || '',
      country: user.country || '',
      registrations: user.registrationCount || 0,
      awaitingReview: user.awaitingReviewCount || 0,
      pendingPayment: user.pendingPaymentCount || 0,
      confirmed: user.confirmedCount || 0,
      totalPaidIdr: user.totalPaidIdr || 0,
      joinedAt: user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : '',
    }))

    const headers = Object.keys(rows[0])
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
    ].join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {(user.name || '?').charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate max-w-[220px]">
                  {user.name}
                </p>
                <p className="text-xs text-neutral-400 truncate max-w-[220px]">{user.email}</p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'affiliation',
        header: 'Affiliation',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="text-sm text-neutral-600 truncate max-w-[200px]">
              {row.original.affiliation || '—'}
            </p>
            {row.original.country && (
              <p className="text-xs text-neutral-400">{row.original.country}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <span className="text-sm text-neutral-500">{row.original.phone || '—'}</span>
        ),
      },
      {
        accessorKey: 'registrationCount',
        header: 'Events',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
            {row.original.registrationCount || 0}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Needs attention',
        cell: ({ row }) => {
          const user = row.original
          const chips = []

          if (user.awaitingReviewCount > 0) {
            chips.push({
              key: 'review',
              label: `${user.awaitingReviewCount} to review`,
              tone: 'bg-warning-50 text-warning-600',
            })
          }
          if (user.pendingPaymentCount > 0) {
            chips.push({
              key: 'payment',
              label: `${user.pendingPaymentCount} payment`,
              tone: 'bg-warning-50 text-warning-600',
            })
          }
          if (chips.length === 0 && user.confirmedCount > 0) {
            chips.push({
              key: 'done',
              label: 'All settled',
              tone: 'bg-success-50 text-success-600',
            })
          }

          if (chips.length === 0) {
            return <span className="text-xs text-neutral-300">—</span>
          }

          return (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${chip.tone}`}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          )
        },
      },
      {
        accessorKey: 'totalPaidIdr',
        header: 'Total paid',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-neutral-800">
            {row.original.totalPaidIdr ? formatIDR(row.original.totalPaidIdr) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="text-sm text-neutral-500">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <a
              href={`mailto:${row.original.email}`}
              className="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
              title="Send email"
            >
              <Mail className="w-4 h-4" />
            </a>
            <button
              onClick={() => navigate(`/users/${row.original._id}`)}
              className="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
              title="Open"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [navigate]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Everyone who created a participant account, and the events they signed up for.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Registered users"
            value={stats.totalParticipants ?? 0}
            hint={`${stats.participantsWithRegistration ?? 0} joined at least one event`}
            icon={UsersRound}
            tone="bg-primary-50 text-primary-600"
          />
          <SummaryCard
            label="Total registrations"
            value={stats.registrations ?? 0}
            icon={Clock}
            tone="bg-warning-50 text-warning-600"
          />
          <SummaryCard
            label="Confirmed participants"
            value={stats.confirmed ?? 0}
            icon={CheckCircle2}
            tone="bg-success-50 text-success-600"
          />
          <SummaryCard
            label="Revenue collected"
            value={formatIDR(stats.revenueIdr ?? 0)}
            icon={Wallet}
            tone="bg-success-50 text-success-600"
          />
        </div>
      )}

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Loading users...</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 inline-flex items-center justify-center">
            <UsersRound className="w-5 h-5 text-neutral-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-neutral-800">No users yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Participant accounts appear here as soon as someone signs up.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchPlaceholder="Search by name, email or affiliation..."
        />
      )}
    </div>
  )
}

function SummaryCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900 truncate">{value}</p>
          {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
        </div>
        <span
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tone}`}
        >
          <Icon className="w-5 h-5" />
        </span>
      </div>
    </div>
  )
}
