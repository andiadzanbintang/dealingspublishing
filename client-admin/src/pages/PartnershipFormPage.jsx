import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import ImageUpload from '@/components/ui/ImageUpload'
import { partnershipAPI, uploadAPI } from '@/services/api'

export default function PartnershipFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      displayOrder: 0,
      isPublished: true,
    },
  })

  useEffect(() => {
    const fetchPartnership = async () => {
      if (!isEdit || !id) return

      setPageLoading(true)
      setError('')

      try {
        const response = await partnershipAPI.getById(id)
        const partnership = response?.data

        if (!partnership) {
          setError('Partnership not found.')
          return
        }

        setValue('name', partnership.name || '')
        setValue('description', partnership.description || '')
        setValue('displayOrder', partnership.displayOrder ?? 0)
        setValue('isPublished', Boolean(partnership.isPublished))
        setPhoto(partnership.photo || null)
      } catch (err) {
        console.error('Failed to fetch partnership:', err)
        setError(
          err.response?.data?.message ||
            'Failed to load partnership data. Please try again.'
        )
      } finally {
        setPageLoading(false)
      }
    }

    fetchPartnership()
  }, [isEdit, id, setValue])

  const uploadPhotoIfNeeded = async () => {
    if (!photo) return ''

    if (typeof photo === 'string') {
      return photo
    }

    if (photo instanceof File) {
      const formData = new FormData()
      formData.append('image', photo)

      const response = await uploadAPI.uploadImage(
        formData,
        'researchhub/partnerships'
      )

      return response?.data?.url || ''
    }

    return ''
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    try {
      const uploadedPhoto = await uploadPhotoIfNeeded()

      const payload = {
        name: data.name?.trim(),
        description: data.description?.trim(),
        photo: uploadedPhoto,
        displayOrder:
          data.displayOrder !== '' &&
          data.displayOrder !== null &&
          data.displayOrder !== undefined
            ? Number(data.displayOrder)
            : 0,
        isPublished: Boolean(data.isPublished),
      }

      if (!payload.photo) {
        setError('Partnership photo is required.')
        setLoading(false)
        return
      }

      if (isEdit) {
        await partnershipAPI.update(id, payload)
      } else {
        await partnershipAPI.create(payload)
      }

      navigate('/partnerships')
    } catch (err) {
      console.error('Failed to save partnership:', err)
      setError(
        err.response?.data?.message ||
          'Failed to save partnership. Please check the form and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-neutral-200 p-10">
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">
              Loading partnership...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/partnerships')}
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {isEdit ? 'Edit Partnership' : 'New Partnership'}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {isEdit
              ? 'Update partnership information'
              : 'Add a new partnership to the platform'}
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
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Partnership Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Name <span className="text-danger-500">*</span>
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  placeholder="Partner name"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Description <span className="text-danger-500">*</span>
                </label>
                <textarea
                  {...register('description', {
                    required: 'Description is required',
                  })}
                  rows={6}
                  placeholder="Short description about this partnership"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  {...register('displayOrder')}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-neutral-400">
                  Lower number appears first.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Photo
              </h2>

              <ImageUpload value={photo} onChange={setPhoto} />

              <p className="text-xs text-neutral-400">
                Upload partner logo or representative image.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Publish
              </h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isPublished')}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">
                  Published
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading
                  ? 'Saving...'
                  : isEdit
                    ? 'Update Partnership'
                    : 'Create Partnership'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}