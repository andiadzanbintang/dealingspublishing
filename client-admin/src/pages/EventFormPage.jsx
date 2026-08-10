// src/pages/EventFormPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  Users,
  ShieldCheck,
  Bell,
  CheckCircle2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import RichTextEditor from '@/components/ui/RichTextEditor'
import ImageUpload from '@/components/ui/ImageUpload'
import { slugify } from '@/lib/utils'
import { eventAPI, uploadAPI, reviewerAPI } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

const inputClass =
  'w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5'

const FEE_COMBOS = [
  { role: 'presenter', mode: 'offline', label: 'Presenter — Offline attendance' },
  { role: 'presenter', mode: 'online', label: 'Presenter — Online attendance' },
  { role: 'participant', mode: 'offline', label: 'Participant — Offline attendance' },
  { role: 'participant', mode: 'online', label: 'Participant — Online attendance' },
]

const emptyRegistration = () => ({
  enabled: false,
  ctaLabel: 'Register Event',
  opensAt: '',
  closesAt: '',
  requireManuscript: true,
  requireAbstractFile: true,
  fees: FEE_COMBOS.map((combo) => ({ ...combo, amountIdr: 0, amountUsd: 0 })),
  outputTypes: [
    { value: 'book-series-scopus', label: 'Book Series (Scopus indexed)' },
    { value: 'journal-nasional-sinta', label: 'National Journal (SINTA accredited)' },
  ],
  keywordsMin: 3,
  keywordsMax: 5,
  maxAbstractSizeMb: 15,
  maxFullPaperSizeMb: 25,
  abstractDeadline: '',
  fullPaperDeadline: '',
  paymentMethods: {
    manual: true,
    gateway: false,
    gatewayNote:
      'Online payment gateway is still awaiting licensing approval. Please use manual bank transfer for now.',
  },
  bank: {
    accountNumber: '',
    accountName: '',
    bankName: '',
    swiftCode: '',
    branch: '',
  },
  ticketPrefix: '',
  invoicePrefix: 'INV',
  whatsappGroupUrl: '',
  fullPaperUploadUrl: '',
  contactEmail: '',
  contactWhatsapp: '',
  instructions: '',
  // Comma-separated in the form, stored as an array
  notifyEmails: '',
  notifyOnSubmission: true,
  notifyOnPayment: true,
})

const toDateInput = (value) =>
  value ? new Date(value).toISOString().split('T')[0] : ''

export default function EventFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState(null)
  const [registration, setRegistration] = useState(emptyRegistration())

  const { user } = useAuth()
  const isSuperadmin = user?.role === 'superadmin'

  const [reviewers, setReviewers] = useState([])
  const [assignedReviewerIds, setAssignedReviewerIds] = useState([])
  const [reviewerSaving, setReviewerSaving] = useState(false)
  const [reviewerNotice, setReviewerNotice] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      eventDate: '',
      endDate: '',
      location: '',
      locationType: 'in-person',
      eventType: 'conference',
      externalUrl: '',
      isPublished: false,
      isFeatured: false,
    },
  })

  const watchTitle = watch('title')

  useEffect(() => {
    if (!isEdit && watchTitle) {
      setValue('slug', slugify(watchTitle))
    }
  }, [watchTitle, isEdit, setValue])

  useEffect(() => {
    const fetchEvent = async () => {
      if (!isEdit || !id) return

      setPageLoading(true)
      setError('')

      try {
        const response = await eventAPI.getById(id)
        const event = response?.data

        if (!event) {
          setError('Event not found.')
          return
        }

        setValue('title', event.title || '')
        setValue('slug', event.slug || '')
        setValue('description', event.description || '')
        setValue('eventDate', toDateInput(event.eventDate))
        setValue('endDate', toDateInput(event.endDate))
        setValue('location', event.location || '')
        setValue('locationType', event.locationType || 'in-person')
        setValue('eventType', event.eventType || 'conference')
        setValue('externalUrl', event.externalUrl || '')
        setValue('isPublished', Boolean(event.isPublished))
        setValue('isFeatured', Boolean(event.isFeatured))

        setContent(event.content || '')
        setCoverImage(event.coverImage || null)

        const defaults = emptyRegistration()
        const saved = event.registration || {}

        setRegistration({
          ...defaults,
          ...saved,
          opensAt: toDateInput(saved.opensAt),
          closesAt: toDateInput(saved.closesAt),
          abstractDeadline: toDateInput(saved.abstractDeadline),
          fullPaperDeadline: toDateInput(saved.fullPaperDeadline),
          fees:
            saved.fees?.length > 0
              ? FEE_COMBOS.map((combo) => {
                  const match = saved.fees.find(
                    (f) => f.role === combo.role && f.mode === combo.mode
                  )
                  return match
                    ? { ...combo, ...match, label: match.label || combo.label }
                    : { ...combo, amountIdr: 0, amountUsd: 0 }
                })
              : defaults.fees,
          outputTypes: saved.outputTypes?.length > 0 ? saved.outputTypes : defaults.outputTypes,
          paymentMethods: { ...defaults.paymentMethods, ...(saved.paymentMethods || {}) },
          bank: { ...defaults.bank, ...(saved.bank || {}) },
          ticketPrefix: saved.ticketPrefix || '',
          notifyEmails: (saved.notifyEmails || []).join(', '),
          notifyOnSubmission: saved.notifyOnSubmission !== false,
          notifyOnPayment: saved.notifyOnPayment !== false,
        })
      } catch (err) {
        console.error('Failed to fetch event:', err)
        setError(
          err.response?.data?.message ||
            'Failed to load event data. Please try again.'
        )
      } finally {
        setPageLoading(false)
      }
    }

    fetchEvent()
  }, [isEdit, id, setValue])

  // Reviewer assignment is only meaningful once the event exists, and only a
  // superadmin may change it.
  useEffect(() => {
    if (!isEdit || !id || !isSuperadmin) return

    const fetchReviewers = async () => {
      try {
        const response = await reviewerAPI.getAll()
        const all = response?.data || []
        setReviewers(all)
        setAssignedReviewerIds(
          all
            .filter((reviewer) =>
              (reviewer.assignedEvents || []).some(
                (event) => String(event._id || event) === String(id)
              )
            )
            .map((reviewer) => reviewer._id)
        )
      } catch {
        setReviewers([])
      }
    }

    fetchReviewers()
  }, [isEdit, id, isSuperadmin])

  const saveReviewerAssignment = async () => {
    setReviewerSaving(true)
    setReviewerNotice('')

    try {
      await reviewerAPI.setEventReviewers(id, assignedReviewerIds)
      setReviewerNotice('Reviewer assignment saved.')
    } catch (err) {
      setReviewerNotice(
        err.response?.data?.message || 'Could not save the reviewer assignment.'
      )
    } finally {
      setReviewerSaving(false)
    }
  }

  const setReg = (key, value) => setRegistration((prev) => ({ ...prev, [key]: value }))

  const setNested = (group, key, value) =>
    setRegistration((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }))

  const setFee = (index, key, value) =>
    setRegistration((prev) => ({
      ...prev,
      fees: prev.fees.map((fee, i) => (i === index ? { ...fee, [key]: value } : fee)),
    }))

  const uploadCoverImageIfNeeded = async () => {
    if (!coverImage) return ''

    if (typeof coverImage === 'string') {
      return coverImage
    }

    if (coverImage instanceof File) {
      const formData = new FormData()
      formData.append('image', coverImage)

      const response = await uploadAPI.uploadImage(formData, 'researchhub/events')
      return response?.data?.url || ''
    }

    return ''
  }

  const buildRegistrationPayload = (slug) => ({
    enabled: Boolean(registration.enabled),
    ctaLabel: registration.ctaLabel || 'Register Event',
    opensAt: registration.opensAt || null,
    closesAt: registration.closesAt || null,
    requireManuscript: Boolean(registration.requireManuscript),
    requireAbstractFile: Boolean(registration.requireAbstractFile),
    fees: registration.fees.map((fee) => ({
      role: fee.role,
      mode: fee.mode,
      label: fee.label || '',
      amountIdr: Number(fee.amountIdr) || 0,
      amountUsd: Number(fee.amountUsd) || 0,
    })),
    outputTypes: registration.outputTypes
      .filter((option) => option.value?.trim() && option.label?.trim())
      .map((option) => ({ value: option.value.trim(), label: option.label.trim() })),
    keywordsMin: Number(registration.keywordsMin) || 0,
    keywordsMax: Number(registration.keywordsMax) || 5,
    maxAbstractSizeMb: Number(registration.maxAbstractSizeMb) || 15,
    maxFullPaperSizeMb: Number(registration.maxFullPaperSizeMb) || 25,
    abstractDeadline: registration.abstractDeadline || null,
    fullPaperDeadline: registration.fullPaperDeadline || null,
    paymentMethods: {
      manual: Boolean(registration.paymentMethods.manual),
      gateway: Boolean(registration.paymentMethods.gateway),
      gatewayNote: registration.paymentMethods.gatewayNote || '',
    },
    bank: { ...registration.bank },
    ticketPrefix: (registration.ticketPrefix || slug || 'REG')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 12),
    invoicePrefix: registration.invoicePrefix || 'INV',
    whatsappGroupUrl: registration.whatsappGroupUrl || '',
    fullPaperUploadUrl: registration.fullPaperUploadUrl || '',
    contactEmail: registration.contactEmail || '',
    contactWhatsapp: registration.contactWhatsapp || '',
    instructions: registration.instructions || '',
    notifyEmails: String(registration.notifyEmails || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
    notifyOnSubmission: Boolean(registration.notifyOnSubmission),
    notifyOnPayment: Boolean(registration.notifyOnPayment),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    try {
      if (registration.enabled) {
        const missingFee = registration.fees.some(
          (fee) => !Number(fee.amountIdr) && !Number(fee.amountUsd)
        )
        if (missingFee) {
          setError(
            'Registration is enabled but at least one fee is still zero. Fill in all four fee rows.'
          )
          setLoading(false)
          return
        }

        if (registration.paymentMethods.manual && !registration.bank.accountNumber) {
          setError('Manual transfer is enabled — please fill in the bank account details.')
          setLoading(false)
          return
        }
      }

      const uploadedCoverImage = await uploadCoverImageIfNeeded()
      const slug = data.slug?.trim() || slugify(data.title || '')

      const payload = {
        title: data.title?.trim(),
        slug,
        description: data.description || '',
        content,
        coverImage: uploadedCoverImage,
        eventDate: data.eventDate,
        endDate: data.endDate || null,
        location: data.location || '',
        locationType: data.locationType || 'in-person',
        eventType: data.eventType || 'conference',
        externalUrl: data.externalUrl || '',
        isPublished: Boolean(data.isPublished),
        isFeatured: Boolean(data.isFeatured),
        registration: buildRegistrationPayload(slug),
      }

      if (isEdit) {
        await eventAPI.update(id, payload)
      } else {
        await eventAPI.create(payload)
      }

      navigate('/events')
    } catch (err) {
      console.error('Failed to save event:', err)
      setError(
        err.response?.data?.message ||
          'Failed to save event. Please check the form and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border border-neutral-200 p-10">
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Loading event...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/events')}
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {isEdit ? 'Edit Event' : 'New Event'}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {isEdit ? 'Update event details' : 'Add a new event'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">Event Details</h2>

              <div>
                <label className={labelClass}>
                  Title <span className="text-danger-500">*</span>
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Event title"
                  className={inputClass}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-danger-500">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Slug <span className="text-danger-500">*</span>
                </label>
                <input
                  {...register('slug', { required: 'Slug is required' })}
                  placeholder="auto-generated"
                  className={inputClass}
                />
                {errors.slug && (
                  <p className="mt-1 text-xs text-danger-500">{errors.slug.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Short Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Brief event description..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Event Date <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('eventDate', { required: 'Date is required' })}
                    className={inputClass}
                  />
                  {errors.eventDate && (
                    <p className="mt-1 text-xs text-danger-500">
                      {errors.eventDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>End Date</label>
                  <input type="date" {...register('endDate')} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Location</label>
                <input
                  {...register('location')}
                  placeholder="e.g. Singapore / Online"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>External URL</label>
                <input
                  {...register('externalUrl')}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900">Full Description</h2>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write full event description..."
              />
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* REGISTRATION                             */}
            {/* ═══════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="p-6 border-b border-neutral-100 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-neutral-400" />
                    Registration
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Turn this on to give the event its own participant registration form,
                    review queue, payment step and ticketing.
                  </p>
                </div>

                <label className="flex items-center gap-3 flex-shrink-0 cursor-pointer">
                  <span className="text-sm font-medium text-neutral-700">
                    {registration.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <input
                    type="checkbox"
                    checked={registration.enabled}
                    onChange={(e) => setReg('enabled', e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </label>
              </div>

              {registration.enabled && (
                <div className="p-6 space-y-8">
                  {/* Basics */}
                  <section className="space-y-4">
                    <SectionTitle>Basics</SectionTitle>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Button label</label>
                        <input
                          value={registration.ctaLabel}
                          onChange={(e) => setReg('ctaLabel', e.target.value)}
                          placeholder="Register Event"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Ticket prefix</label>
                        <input
                          value={registration.ticketPrefix}
                          onChange={(e) => setReg('ticketPrefix', e.target.value)}
                          placeholder="ICUCE26"
                          className={inputClass}
                        />
                        <p className="mt-1 text-xs text-neutral-400">
                          Used for codes like ICUCE26-PR-OFF-0001.
                        </p>
                      </div>

                      <div>
                        <label className={labelClass}>Registration opens</label>
                        <input
                          type="date"
                          value={registration.opensAt}
                          onChange={(e) => setReg('opensAt', e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Registration closes</label>
                        <input
                          type="date"
                          value={registration.closesAt}
                          onChange={(e) => setReg('closesAt', e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Abstract deadline</label>
                        <input
                          type="date"
                          value={registration.abstractDeadline}
                          onChange={(e) => setReg('abstractDeadline', e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Full paper deadline</label>
                        <input
                          type="date"
                          value={registration.fullPaperDeadline}
                          onChange={(e) => setReg('fullPaperDeadline', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Instructions shown on the event page</label>
                      <textarea
                        rows={3}
                        value={registration.instructions}
                        onChange={(e) => setReg('instructions', e.target.value)}
                        placeholder="Submit your abstract first…"
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <Toggle
                        label="Require manuscript section"
                        checked={registration.requireManuscript}
                        onChange={(v) => setReg('requireManuscript', v)}
                      />
                      <Toggle
                        label="Require abstract file upload"
                        checked={registration.requireAbstractFile}
                        onChange={(v) => setReg('requireAbstractFile', v)}
                      />
                    </div>
                  </section>

                  {/* Fees */}
                  <section className="space-y-4">
                    <SectionTitle>Registration fees</SectionTitle>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wider text-neutral-400">
                            <th className="pb-2 pr-4 font-medium">Attendance</th>
                            <th className="pb-2 pr-4 font-medium">Label</th>
                            <th className="pb-2 pr-4 font-medium">Amount (IDR)</th>
                            <th className="pb-2 font-medium">Amount (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registration.fees.map((fee, index) => (
                            <tr key={`${fee.role}-${fee.mode}`} className="border-t border-neutral-100">
                              <td className="py-3 pr-4 capitalize text-neutral-700 whitespace-nowrap">
                                {fee.role} · {fee.mode}
                              </td>
                              <td className="py-3 pr-4">
                                <input
                                  value={fee.label || ''}
                                  onChange={(e) => setFee(index, 'label', e.target.value)}
                                  placeholder="Shown to participants"
                                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </td>
                              <td className="py-3 pr-4">
                                <input
                                  type="number"
                                  min="0"
                                  value={fee.amountIdr}
                                  onChange={(e) => setFee(index, 'amountIdr', e.target.value)}
                                  className="w-36 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </td>
                              <td className="py-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={fee.amountUsd}
                                  onChange={(e) => setFee(index, 'amountUsd', e.target.value)}
                                  className="w-28 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Output types */}
                  <section className="space-y-4">
                    <SectionTitle>Publication output options</SectionTitle>

                    <div className="space-y-2">
                      {registration.outputTypes.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            value={option.value}
                            onChange={(e) =>
                              setRegistration((prev) => ({
                                ...prev,
                                outputTypes: prev.outputTypes.map((o, i) =>
                                  i === index ? { ...o, value: e.target.value } : o
                                ),
                              }))
                            }
                            placeholder="value-slug"
                            className="w-52 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <input
                            value={option.label}
                            onChange={(e) =>
                              setRegistration((prev) => ({
                                ...prev,
                                outputTypes: prev.outputTypes.map((o, i) =>
                                  i === index ? { ...o, label: e.target.value } : o
                                ),
                              }))
                            }
                            placeholder="Label shown to participants"
                            className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setRegistration((prev) => ({
                                ...prev,
                                outputTypes: prev.outputTypes.filter((_, i) => i !== index),
                              }))
                            }
                            className="p-2 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setRegistration((prev) => ({
                          ...prev,
                          outputTypes: [...prev.outputTypes, { value: '', label: '' }],
                        }))
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Add option
                    </button>
                  </section>

                  {/* Limits */}
                  <section className="space-y-4">
                    <SectionTitle>Form limits</SectionTitle>

                    <div className="grid sm:grid-cols-4 gap-4">
                      <NumberField
                        label="Min keywords"
                        value={registration.keywordsMin}
                        onChange={(v) => setReg('keywordsMin', v)}
                      />
                      <NumberField
                        label="Max keywords"
                        value={registration.keywordsMax}
                        onChange={(v) => setReg('keywordsMax', v)}
                      />
                      <NumberField
                        label="Abstract max (MB)"
                        value={registration.maxAbstractSizeMb}
                        onChange={(v) => setReg('maxAbstractSizeMb', v)}
                      />
                      <NumberField
                        label="Full paper max (MB)"
                        value={registration.maxFullPaperSizeMb}
                        onChange={(v) => setReg('maxFullPaperSizeMb', v)}
                      />
                    </div>
                  </section>

                  {/* Payment */}
                  <section className="space-y-4">
                    <SectionTitle>Payment</SectionTitle>

                    <div className="flex flex-wrap gap-6">
                      <Toggle
                        label="Manual bank transfer"
                        checked={registration.paymentMethods.manual}
                        onChange={(v) => setNested('paymentMethods', 'manual', v)}
                      />
                      <Toggle
                        label="Payment gateway"
                        checked={registration.paymentMethods.gateway}
                        onChange={(v) => setNested('paymentMethods', 'gateway', v)}
                      />
                    </div>

                    {!registration.paymentMethods.gateway && (
                      <div>
                        <label className={labelClass}>
                          Message shown on the disabled gateway option
                        </label>
                        <input
                          value={registration.paymentMethods.gatewayNote}
                          onChange={(e) =>
                            setNested('paymentMethods', 'gatewayNote', e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Bank name</label>
                        <input
                          value={registration.bank.bankName}
                          onChange={(e) => setNested('bank', 'bankName', e.target.value)}
                          placeholder="Bank Syariah Indonesia (BSI)"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Account number</label>
                        <input
                          value={registration.bank.accountNumber}
                          onChange={(e) => setNested('bank', 'accountNumber', e.target.value)}
                          placeholder="7339645897"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Account name</label>
                        <input
                          value={registration.bank.accountName}
                          onChange={(e) => setNested('bank', 'accountName', e.target.value)}
                          placeholder="FAKULTAS FISIPOL UIR"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>SWIFT / BIC</label>
                        <input
                          value={registration.bank.swiftCode}
                          onChange={(e) => setNested('bank', 'swiftCode', e.target.value)}
                          placeholder="For international transfers"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-neutral-400">
                      Bank details are never shown publicly — a participant only sees them
                      after their abstract has been accepted.
                    </p>
                  </section>

                  {/* Post-payment links */}
                  <section className="space-y-4">
                    <SectionTitle>Links sent after payment is confirmed</SectionTitle>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>WhatsApp group link</label>
                        <input
                          value={registration.whatsappGroupUrl}
                          onChange={(e) => setReg('whatsappGroupUrl', e.target.value)}
                          placeholder="https://chat.whatsapp.com/..."
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>External full paper upload link</label>
                        <input
                          value={registration.fullPaperUploadUrl}
                          onChange={(e) => setReg('fullPaperUploadUrl', e.target.value)}
                          placeholder="Leave empty to use the built-in upload"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Contact email</label>
                        <input
                          value={registration.contactEmail}
                          onChange={(e) => setReg('contactEmail', e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Contact WhatsApp</label>
                        <input
                          value={registration.contactWhatsapp}
                          onChange={(e) => setReg('contactWhatsapp', e.target.value)}
                          placeholder="+6281234567890"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Organiser notifications */}
                  <section className="space-y-4">
                    <SectionTitle>Organiser notifications</SectionTitle>

                    <div>
                      <label className={labelClass}>Notify these addresses</label>
                      <input
                        value={registration.notifyEmails}
                        onChange={(e) => setReg('notifyEmails', e.target.value)}
                        placeholder="panitia@uir.ac.id, ketua@uir.ac.id"
                        className={inputClass}
                      />
                      <p className="mt-1 text-xs text-neutral-400">
                        Separate multiple addresses with a comma. Reviewers assigned to
                        this event are notified automatically, and so is the fallback
                        address in the server&apos;s ADMIN_NOTIFICATION_EMAIL.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <Toggle
                        label="Email on every new submission"
                        checked={registration.notifyOnSubmission}
                        onChange={(v) => setReg('notifyOnSubmission', v)}
                      />
                      <Toggle
                        label="Email when a payment proof arrives"
                        checked={registration.notifyOnPayment}
                        onChange={(v) => setReg('notifyOnPayment', v)}
                      />
                    </div>

                    <p className="flex items-start gap-2 text-xs text-neutral-400">
                      <Bell className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      These go out through the SMTP account already configured on the
                      server, so they cost nothing extra.
                    </p>
                  </section>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* REVIEWERS                                */}
            {/* ═══════════════════════════════════════ */}
            {isEdit && isSuperadmin && (
              <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-neutral-400" />
                    Reviewers for this event
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Reviewer accounts are managed under <strong>Reviewers</strong> in the
                    sidebar — that page is the source of truth, because one person can
                    cover several events. This panel is the shortcut from the other
                    direction: who handles <em>this</em> event.
                  </p>
                </div>

                {reviewers.length === 0 ? (
                  <p className="text-sm text-neutral-400">
                    No reviewer accounts exist yet. Create one under Reviewers first.
                  </p>
                ) : (
                  <>
                    <div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 max-h-64 overflow-y-auto">
                      {reviewers.map((reviewer) => {
                        const checked = assignedReviewerIds.includes(reviewer._id)
                        return (
                          <label
                            key={reviewer._id}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setAssignedReviewerIds((prev) =>
                                  prev.includes(reviewer._id)
                                    ? prev.filter((rid) => rid !== reviewer._id)
                                    : [...prev, reviewer._id]
                                )
                              }
                              className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer flex-shrink-0"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm text-neutral-800 truncate">
                                {reviewer.name}
                              </span>
                              <span className="block text-xs text-neutral-400 truncate">
                                {reviewer.email}
                                {!reviewer.isActive && ' · deactivated'}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={saveReviewerAssignment}
                        disabled={reviewerSaving}
                        className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                      >
                        {reviewerSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        {reviewerSaving ? 'Saving…' : 'Save reviewer assignment'}
                      </button>

                      {reviewerNotice && (
                        <span className="text-sm text-neutral-500">{reviewerNotice}</span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-400">
                      Saved separately from the event itself, so it takes effect straight
                      away without republishing the event.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">Settings</h2>

              <div>
                <label className={labelClass}>Event Type</label>
                <select {...register('eventType')} className={inputClass}>
                  <option value="conference">Conference</option>
                  <option value="webinar">Webinar</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Location Type</label>
                <select {...register('locationType')} className={inputClass}>
                  <option value="in-person">In-Person</option>
                  <option value="virtual">Virtual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">Published</label>
                <input
                  type="checkbox"
                  {...register('isPublished')}
                  className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">Featured</label>
                <input
                  type="checkbox"
                  {...register('isFeatured')}
                  className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
                </button>
              </div>

              {isEdit && registration.enabled && (
                <button
                  type="button"
                  onClick={() => navigate(`/registrations?event=${id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors"
                >
                  <Users className="w-4 h-4" />
                  View registrations
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900">Cover Image</h2>
              <ImageUpload value={coverImage} onChange={setCoverImage} />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
      {children}
    </h3>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
      />
      <span className="text-sm text-neutral-700">{label}</span>
    </label>
  )
}

function NumberField({ label, value, onChange }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  )
}
