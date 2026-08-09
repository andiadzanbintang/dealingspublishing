// src/pages/RegistrationsManagePage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Download,
  Eye,
  FileText,
  RefreshCw,
  Users,
  Clock,
  CheckCircle2,
  Wallet,
} from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import { formatDate, formatBookPrice } from '@/lib/utils'
import { eventAPI, registrationAPI } from '@/services/api'

const submissionTone = {
  submitted: 'bg-warning-50 text-warning-600',
  accepted: 'bg-success-50 text-success-600',
  rejected: 'bg-danger-50 text-danger-600',
}

const paymentTone = {
  unpaid: 'bg-neutral-100 text-neutral-600',
  pending: 'bg-warning-50 text-warning-600',
  confirmed: 'bg-success-50 text-success-600',
  failed: 'bg-danger-50 text-danger-600',
}

export default function RegistrationsManagePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const eventId = searchParams.get('event') || ''
  const submissionStatus = searchParams.get('submissionStatus') || ''
  const paymentStatus = searchParams.get('paymentStatus') || ''

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  // Events with registration enabled, for the filter dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventAPI.getAll({ limit: 100, sort: '-eventDate' })
        setEvents(response?.data || [])
      } catch {
        setEvents([])
      }
    }
    fetchEvents()
  }, [])

  const fetchRegistrations = async () => {
    setLoading(true)
    setError('')

    const params = { limit: 500, sort: '-createdAt' }
    if (eventId) params.event = eventId
    if (submissionStatus) params.submissionStatus = submissionStatus
    if (paymentStatus) params.paymentStatus = paymentStatus

    try {
      const [list, statsResponse] = await Promise.all([
        registrationAPI.getAll(params),
        registrationAPI.getStats(eventId ? { event: eventId } : {}),
      ])

      setRegistrations(list?.data || [])
      setStats(statsResponse?.data || null)
    } catch (err) {
      console.error('Failed to fetch registrations:', err)
      setError(
        err.response?.data?.message || 'Failed to load registrations. Please try again.'
      )
      setRegistrations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, submissionStatus, paymentStatus])

  const handleExport = async () => {
    setExporting(true)
    setError('')

    try {
      const response = await registrationAPI.getRecap({
        ...(eventId ? { event: eventId } : {}),
        onlyPaid: 'false',
      })

      const rows = response?.data || []
      if (rows.length === 0) {
        setError('There is nothing to export for the current filter.')
        return
      }

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
      link.download = `registration-recap-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'registrationCode',
        header: 'Participant',
        cell: ({ row }) => {
          const registration = row.original
          return (
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate max-w-[220px]">
                {registration.profile?.fullName}
              </p>
              <p className="text-xs text-neutral-400 truncate max-w-[220px]">
                {registration.profile?.affiliation}
              </p>
              <p className="mt-0.5 text-[11px] font-mono text-neutral-400">
                {registration.registrationCode}
              </p>
            </div>
          )
        },
      },
      {
        accessorKey: 'event',
        header: 'Event',
        cell: ({ row }) => (
          <p className="text-sm text-neutral-600 truncate max-w-[200px]">
            {row.original.event?.title || '—'}
          </p>
        ),
      },
      {
        id: 'attendance',
        header: 'Attendance',
        cell: ({ row }) => {
          const { attendance, fee } = row.original
          return (
            <div>
              <p className="text-sm text-neutral-700 capitalize">
                {attendance?.role} · {attendance?.mode}
              </p>
              <p className="text-xs text-neutral-400">
                {formatBookPrice(fee?.amountIdr)}
              </p>
            </div>
          )
        },
      },
      {
        accessorKey: 'submissionStatus',
        header: 'Submission',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
              submissionTone[row.original.submissionStatus] || 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {row.original.submissionStatus}
          </span>
        ),
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
              paymentTone[row.original.paymentStatus] || 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {row.original.paymentStatus}
          </span>
        ),
      },
      {
        id: 'ticket',
        header: 'Ticket',
        cell: ({ row }) =>
          row.original.ticket?.code ? (
            <span className="text-xs font-mono text-success-600">
              {row.original.ticket.code}
            </span>
          ) : (
            <span className="text-xs text-neutral-300">—</span>
          ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
        cell: ({ row }) => (
          <span className="text-sm text-neutral-500">
            {formatDate(row.original.submittedAt || row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/registrations/${row.original._id}`)}
            className="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
            title="Open"
          >
            <Eye className="w-4 h-4" />
          </button>
        ),
      },
    ],
    [navigate]
  )

  const selectClass =
    'px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Event Registrations</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Review abstracts, verify payments and issue tickets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Preparing…' : 'Export recap (CSV)'}
          </button>

          <button
            onClick={fetchRegistrations}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total registrations"
            value={stats.total ?? 0}
            icon={Users}
            tone="bg-primary-50 text-primary-600"
          />
          <SummaryCard
            label="Waiting review"
            value={stats.submitted ?? 0}
            icon={Clock}
            tone="bg-warning-50 text-warning-600"
          />
          <SummaryCard
            label="Payments to verify"
            value={stats.paymentPending ?? 0}
            icon={Wallet}
            tone="bg-warning-50 text-warning-600"
          />
          <SummaryCard
            label="Confirmed"
            value={stats.paymentConfirmed ?? 0}
            icon={CheckCircle2}
            tone="bg-success-50 text-success-600"
            hint={
              stats.revenueIdr
                ? `${formatBookPrice(stats.revenueIdr)} collected`
                : undefined
            }
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={eventId}
          onChange={(e) => updateFilter('event', e.target.value)}
          className={selectClass}
        >
          <option value="">All events</option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.title}
            </option>
          ))}
        </select>

        <select
          value={submissionStatus}
          onChange={(e) => updateFilter('submissionStatus', e.target.value)}
          className={selectClass}
        >
          <option value="">Any submission status</option>
          <option value="submitted">Waiting review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={paymentStatus}
          onChange={(e) => updateFilter('paymentStatus', e.target.value)}
          className={selectClass}
        >
          <option value="">Any payment status</option>
          <option value="unpaid">Unpaid</option>
          <option value="pending">Pending verification</option>
          <option value="confirmed">Confirmed</option>
          <option value="failed">Failed</option>
        </select>

        {(eventId || submissionStatus || paymentStatus) && (
          <button
            onClick={() => setSearchParams(new URLSearchParams())}
            className="text-sm text-neutral-500 hover:text-neutral-800 underline underline-offset-4"
          >
            Clear filters
          </button>
        )}
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
            <p className="text-sm text-neutral-500">Loading registrations...</p>
          </div>
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 inline-flex items-center justify-center">
            <FileText className="w-5 h-5 text-neutral-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-neutral-800">No registrations yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Registrations appear here as soon as participants submit their abstracts.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={registrations}
          searchPlaceholder="Search by name, email, code or article title..."
        />
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, tone, hint }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
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
