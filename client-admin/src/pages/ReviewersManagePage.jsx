// src/pages/ReviewersManagePage.jsx
import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate, formatDateTime } from '@/lib/utils'
import { eventAPI, reviewerAPI } from '@/services/api'

const inputClass =
  'w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5'

const emptyForm = () => ({
  name: '',
  email: '',
  password: '',
  assignedEvents: [],
  sendEmail: true,
})

/** Readable temporary password an organiser can dictate over the phone. */
const suggestPassword = () => {
  const words = ['review', 'commit', 'chapter', 'abstract', 'journal', 'summit']
  const word = words[Math.floor(Math.random() * words.length)]
  const digits = String(Math.floor(1000 + Math.random() * 9000))
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}-${digits}`
}

export default function ReviewersManagePage() {
  const [reviewers, setReviewers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState(null) // null = create mode
  const [form, setForm] = useState(emptyForm())
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const [passwordTarget, setPasswordTarget] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    setError('')

    try {
      const [reviewerResponse, eventResponse] = await Promise.all([
        reviewerAPI.getAll(),
        eventAPI.getAll({ limit: 200, sort: '-eventDate' }),
      ])

      setReviewers(reviewerResponse?.data || [])
      setEvents(eventResponse?.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reviewer accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm(), password: suggestPassword() })
    setShowPassword(true)
    setPanelOpen(true)
    setError('')
    setNotice('')
  }

  const openEdit = (reviewer) => {
    setEditing(reviewer)
    setForm({
      name: reviewer.name || '',
      email: reviewer.email || '',
      password: '',
      assignedEvents: (reviewer.assignedEvents || []).map((event) =>
        typeof event === 'string' ? event : event._id
      ),
      sendEmail: false,
    })
    setShowPassword(false)
    setPanelOpen(true)
    setError('')
    setNotice('')
  }

  const toggleEvent = (eventId) =>
    setForm((prev) => ({
      ...prev,
      assignedEvents: prev.assignedEvents.includes(eventId)
        ? prev.assignedEvents.filter((id) => id !== eventId)
        : [...prev.assignedEvents, eventId],
    }))

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')

    if (!form.name.trim()) return setError('Name is required.')
    if (!editing && !form.email.trim()) return setError('Email is required.')
    if (!editing && form.password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    setSaving(true)

    try {
      if (editing) {
        await reviewerAPI.update(editing._id, {
          name: form.name.trim(),
          assignedEvents: form.assignedEvents,
          isActive: editing.isActive,
        })
        setNotice('Reviewer updated.')
      } else {
        const response = await reviewerAPI.create({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          assignedEvents: form.assignedEvents,
          sendEmail: form.sendEmail,
        })

        // The account always exists at this point; the email may not have gone
        // out. Say which, rather than claiming both worked.
        const delivery = response?.emailDelivery

        if (!form.sendEmail) {
          setNotice('Reviewer created. Share the password with them yourself.')
        } else if (delivery?.ok) {
          setNotice(`Reviewer created. ${delivery.message}`)
        } else {
          setNotice('')
          setError(
            `Reviewer created, but the credential email did not go out. ${
              delivery?.message || ''
            } ${delivery?.hint || ''} You can still give them the password directly, and check the Email page for details.`.trim()
          )
        }
      }

      setPanelOpen(false)
      await fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this reviewer.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (reviewer) => {
    setError('')
    try {
      await reviewerAPI.update(reviewer._id, { isActive: !reviewer.isActive })
      await fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change the account status.')
    }
  }

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      const response = await reviewerAPI.resetPassword(passwordTarget._id, {
        password: newPassword,
        sendEmail: true,
      })

      const delivery = response?.emailDelivery

      if (delivery?.ok) {
        setNotice(`Password reset for ${passwordTarget.email}. ${delivery.message}`)
      } else {
        setNotice('')
        setError(
          `The password was changed, but the email did not go out. ${
            delivery?.message || ''
          } ${delivery?.hint || ''} Give the new password to ${passwordTarget.email} directly.`.trim()
        )
      }

      setPasswordTarget(null)
      setNewPassword('')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset the password.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await reviewerAPI.delete(id)
      setNotice('Reviewer account deleted.')
      await fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this reviewer.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-neutral-900">Reviewers</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Accounts that can review submissions and verify payments for specific
            events only. A reviewer signs in at the same address as you, but sees
            just their assigned events — no journals, books, settings or user data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New reviewer
          </button>
        </div>
      </div>

      {notice && (
        <div className="bg-success-50 border border-success-200 text-success-600 rounded-xl px-4 py-3 text-sm">
          {notice}
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
            <p className="text-sm text-neutral-500">Loading reviewers...</p>
          </div>
        </div>
      ) : reviewers.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 inline-flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-neutral-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-neutral-800">No reviewer accounts yet</p>
          <p className="mt-1 text-sm text-neutral-500 max-w-md mx-auto">
            Create one for each committee member who should handle a specific
            conference, and assign the events they are responsible for.
          </p>
          <button
            onClick={openCreate}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl"
          >
            <UserPlus className="w-4 h-4" />
            Create the first reviewer
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {reviewers.map((reviewer) => (
            <div
              key={reviewer._id}
              className="bg-white rounded-xl border border-neutral-200 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {(reviewer.name || '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {reviewer.name}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">{reviewer.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleActive(reviewer)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    reviewer.isActive
                      ? 'bg-success-50 text-success-600 hover:bg-success-100'
                      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                  }`}
                  title={reviewer.isActive ? 'Deactivate account' : 'Reactivate account'}
                >
                  {reviewer.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-neutral-400 mb-2">
                  Assigned events
                </p>
                {reviewer.assignedEvents?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {reviewer.assignedEvents.map((event) => (
                      <span
                        key={event._id || event}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 text-xs max-w-[240px] truncate"
                        title={event.title}
                      >
                        {event.title || 'Event'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="inline-flex items-center gap-1.5 text-xs text-warning-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    No events assigned — this account can see nothing yet
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-neutral-500">
                  <Clock className="w-3.5 h-3.5 text-warning-500" />
                  {reviewer.awaitingReview || 0} to review
                </span>
                <span className="inline-flex items-center gap-1.5 text-neutral-500">
                  <Wallet className="w-3.5 h-3.5 text-warning-500" />
                  {reviewer.pendingPayment || 0} to verify
                </span>
                <span className="text-neutral-400">
                  {reviewer.lastLogin
                    ? `Last sign-in ${formatDateTime(reviewer.lastLogin)}`
                    : `Created ${formatDate(reviewer.createdAt)} · never signed in`}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-2">
                <button
                  onClick={() => openEdit(reviewer)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  Edit & assign events
                </button>
                <button
                  onClick={() => {
                    setPasswordTarget(reviewer)
                    setNewPassword(suggestPassword())
                    setError('')
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                  Reset password
                </button>
                <button
                  onClick={() => setDeleteTarget(reviewer)}
                  className="ml-auto p-2 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                  title="Delete account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Create / edit panel ═══ */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {editing ? 'Edit reviewer' : 'New reviewer'}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {editing
                    ? 'Change the name and which events they can work on.'
                    : 'Creates a sign-in with an email and password. No email verification.'}
                </p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className={labelClass}>
                  Name <span className="text-danger-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Dr. Siti Rahma"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Email (used as the username) <span className="text-danger-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  disabled={Boolean(editing)}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="reviewer@uir.ac.id"
                  className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                />
                {editing && (
                  <p className="mt-1 text-xs text-neutral-400">
                    The sign-in email cannot be changed. Delete and recreate the
                    account if it is wrong.
                  </p>
                )}
              </div>

              {!editing && (
                <div>
                  <label className={labelClass}>
                    Password <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, password: suggestPassword() }))}
                    className="mt-1.5 text-xs text-primary-600 hover:text-primary-700"
                  >
                    Suggest another password
                  </button>
                </div>
              )}

              <div>
                <label className={labelClass}>Events this reviewer can work on</label>

                {events.length === 0 ? (
                  <p className="text-sm text-neutral-400">
                    No events exist yet. Create one first.
                  </p>
                ) : (
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-neutral-200 divide-y divide-neutral-100">
                    {events.map((event) => {
                      const checked = form.assignedEvents.includes(event._id)
                      return (
                        <label
                          key={event._id}
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEvent(event._id)}
                            className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer flex-shrink-0"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm text-neutral-800 line-clamp-2">
                              {event.title}
                            </span>
                            <span className="block text-xs text-neutral-400 mt-0.5">
                              {formatDate(event.eventDate)}
                              {event.registration?.enabled
                                ? ' · registration on'
                                : ' · registration off'}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}

                <p className="mt-1.5 text-xs text-neutral-400">
                  {form.assignedEvents.length} event
                  {form.assignedEvents.length === 1 ? '' : 's'} selected. An account
                  with none selected can sign in but will see an empty dashboard.
                </p>
              </div>

              {!editing && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.sendEmail}
                    onChange={(e) => setForm((p) => ({ ...p, sendEmail: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-700">
                    Email the credentials to this reviewer
                    <span className="block text-xs text-neutral-400 mt-0.5">
                      Sent through the same SMTP account as the participant emails.
                    </span>
                  </span>
                </label>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create reviewer'}
                </button>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Reset password ═══ */}
      {passwordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPasswordTarget(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-neutral-900">Reset password</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Sets a new password for <strong>{passwordTarget.email}</strong> and signs
              them out of any active session. They will be emailed the new password.
            </p>

            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`${inputClass} mt-4`}
            />

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setPasswordTarget(null)}
                className="px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-2.5 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
              >
                Reset password
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?._id)}
        title="Delete this reviewer account?"
        description={`${deleteTarget?.email} will lose access immediately. Registrations they already reviewed are not affected.`}
        confirmText="Delete account"
        variant="danger"
      />
    </div>
  )
}
