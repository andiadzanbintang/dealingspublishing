// src/pages/EventFormPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import RichTextEditor from '@/components/ui/RichTextEditor'
import ImageUpload from '@/components/ui/ImageUpload'
import { slugify } from '@/lib/utils'
import { eventAPI, uploadAPI } from '@/services/api'

export default function EventFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState(null)

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
        setValue(
          'eventDate',
          event.eventDate
            ? new Date(event.eventDate).toISOString().split('T')[0]
            : ''
        )
        setValue(
          'endDate',
          event.endDate
            ? new Date(event.endDate).toISOString().split('T')[0]
            : ''
        )
        setValue('location', event.location || '')
        setValue('locationType', event.locationType || 'in-person')
        setValue('eventType', event.eventType || 'conference')
        setValue('externalUrl', event.externalUrl || '')
        setValue('isPublished', Boolean(event.isPublished))
        setValue('isFeatured', Boolean(event.isFeatured))

        setContent(event.content || '')
        setCoverImage(event.coverImage || null)
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

  const uploadCoverImageIfNeeded = async () => {
    if (!coverImage) return ''

    // Existing backend image URL
    if (typeof coverImage === 'string') {
      return coverImage
    }

    // New File object from ImageUpload
    if (coverImage instanceof File) {
      const formData = new FormData()
      formData.append('image', coverImage)

      const response = await uploadAPI.uploadImage(
        formData,
        'researchhub/events'
      )

      return response?.data?.url || ''
    }

    return ''
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    try {
      const uploadedCoverImage = await uploadCoverImageIfNeeded()

      const payload = {
        title: data.title?.trim(),
        slug: data.slug?.trim() || slugify(data.title || ''),
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
              <h2 className="text-lg font-semibold text-neutral-900">
                Event Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Title <span className="text-danger-500">*</span>
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Event title"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Slug <span className="text-danger-500">*</span>
                </label>
                <input
                  {...register('slug', { required: 'Slug is required' })}
                  placeholder="auto-generated"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.slug && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.slug.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Short Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Brief event description..."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Event Date <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('eventDate', { required: 'Date is required' })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.eventDate && (
                    <p className="mt-1 text-xs text-danger-500">
                      {errors.eventDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Location
                </label>
                <input
                  {...register('location')}
                  placeholder="e.g. Singapore / Online"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  External URL
                </label>
                <input
                  {...register('externalUrl')}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Full Description
              </h2>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write full event description..."
              />
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Settings
              </h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Event Type
                </label>
                <select
                  {...register('eventType')}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="conference">Conference</option>
                  <option value="webinar">Webinar</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Location Type
                </label>
                <select
                  {...register('locationType')}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="in-person">In-Person</option>
                  <option value="virtual">Virtual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                  Published
                </label>
                <input
                  type="checkbox"
                  {...register('isPublished')}
                  className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                  Featured
                </label>
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
                  {loading
                    ? 'Saving...'
                    : isEdit
                      ? 'Update Event'
                      : 'Create Event'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Cover Image
              </h2>
              <ImageUpload value={coverImage} onChange={setCoverImage} />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}