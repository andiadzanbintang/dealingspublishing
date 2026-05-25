// src/pages/NewsFormPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import RichTextEditor from '@/components/ui/RichTextEditor'
import ImageUpload from '@/components/ui/ImageUpload'
import { slugify } from '@/lib/utils'
import { newsAPI, uploadAPI } from '@/services/api'

export default function NewsFormPage() {
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
      excerpt: '',
      category: '',
      tags: '',
      isPublished: false,
      isFeatured: false,
      publishedAt: '',
    },
  })

  const watchTitle = watch('title')

  useEffect(() => {
    if (!isEdit && watchTitle) {
      setValue('slug', slugify(watchTitle))
    }
  }, [watchTitle, isEdit, setValue])

  useEffect(() => {
    const fetchArticle = async () => {
      if (!isEdit || !id) return

      setPageLoading(true)
      setError('')

      try {
        const response = await newsAPI.getById(id)
        const article = response?.data

        if (!article) {
          setError('Article not found.')
          return
        }

        setValue('title', article.title || '')
        setValue('slug', article.slug || '')
        setValue('excerpt', article.excerpt || '')
        setValue('category', article.category || '')
        setValue('tags', article.tags?.join(', ') || '')
        setValue('isPublished', Boolean(article.isPublished))
        setValue('isFeatured', Boolean(article.isFeatured))
        setValue(
          'publishedAt',
          article.publishedAt
            ? new Date(article.publishedAt).toISOString().split('T')[0]
            : ''
        )

        setContent(article.content || '')
        setCoverImage(article.coverImage || null)
      } catch (err) {
        console.error('Failed to fetch article:', err)
        setError(
          err.response?.data?.message ||
            'Failed to load article data. Please try again.'
        )
      } finally {
        setPageLoading(false)
      }
    }

    fetchArticle()
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

      const response = await uploadAPI.uploadImage(formData, 'researchhub/news')

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
        excerpt: data.excerpt || '',
        content,
        coverImage: uploadedCoverImage,
        category: data.category || '',
        tags: data.tags
          ? data.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        isFeatured: Boolean(data.isFeatured),
        isPublished: Boolean(data.isPublished),
        publishedAt: data.publishedAt || null,
      }

      if (isEdit) {
        await newsAPI.update(id, payload)
      } else {
        await newsAPI.create(payload)
      }

      navigate('/news')
    } catch (err) {
      console.error('Failed to save article:', err)
      setError(
        err.response?.data?.message ||
          'Failed to save article. Please check the form and try again.'
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
            <p className="text-sm text-neutral-500">Loading article...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/news')}
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {isEdit ? 'Edit Article' : 'New Article'}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {isEdit ? 'Update article information' : 'Create a news article'}
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
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Article Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Title <span className="text-danger-500">*</span>
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Article title"
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
                  Excerpt
                </label>
                <textarea
                  {...register('excerpt')}
                  rows={3}
                  placeholder="Short description for cards..."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Tags{' '}
                  <span className="text-xs text-neutral-400">
                    (comma-separated)
                  </span>
                </label>
                <input
                  {...register('tags')}
                  placeholder="research, announcement, collaboration"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Content
              </h2>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write article content..."
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Publish
              </h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Category
                </label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Awards">Awards</option>
                  <option value="Product">Product</option>
                  <option value="Report">Report</option>
                  <option value="Company Update">Company Update</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Publish Date
                </label>
                <input
                  type="date"
                  {...register('publishedAt')}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
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
                      ? 'Update Article'
                      : 'Create Article'}
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