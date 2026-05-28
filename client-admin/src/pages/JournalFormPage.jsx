// src/pages/JournalFormPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import RichTextEditor from '@/components/ui/RichTextEditor'
import ImageUpload from '@/components/ui/ImageUpload'
import { slugify } from '@/lib/utils'
import { journalAPI, topicAPI, uploadAPI } from '@/services/api'

export default function JournalFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(isEdit)
  const [topicsLoading, setTopicsLoading] = useState(true)
  const [error, setError] = useState('')
  const [topics, setTopics] = useState([])
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
      issn: '',
      eissn: '',
      topicId: '',
      authors: '',
      abstract: '',
      volume: '',
      issue: '',
      pages: '',
      doi: '',
      keywords: '',
      publicationDate: '',
      externalUrl: '',
      pdfUrl: '',
      status: 'draft',
      isFeatured: false,
    },
  })

  const watchTitle = watch('title')

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEdit && watchTitle) {
      setValue('slug', slugify(watchTitle))
    }
  }, [watchTitle, isEdit, setValue])

  // Load topics from backend
  useEffect(() => {
    const fetchTopics = async () => {
      setTopicsLoading(true)

      try {
        const response = await topicAPI.getAll()
        setTopics(response?.data || [])
      } catch (err) {
        console.error('Failed to fetch topics:', err)
        setError(
          err.response?.data?.message ||
            'Failed to load topics. Please create a topic first.'
        )
        setTopics([])
      } finally {
        setTopicsLoading(false)
      }
    }

    fetchTopics()
  }, [])

  // Load journal data for editing
  useEffect(() => {
    const fetchJournal = async () => {
      if (!isEdit || !id) return

      setPageLoading(true)
      setError('')

      try {
        const response = await journalAPI.getById(id)
        const journal = response?.data

        if (!journal) {
          setError('Journal not found.')
          return
        }

        setValue('title', journal.title || '')
        setValue('slug', journal.slug || '')
        setValue('issn', journal.issn || '')
        setValue('eissn', journal.eissn || '')
        setValue('topicId', journal.topic?._id || journal.topic || '')
        setValue('authors', journal.authors?.join(', ') || '')
        setValue('abstract', journal.abstract || '')
        setValue('volume', journal.volume || '')
        setValue('issue', journal.issue || '')
        setValue('pages', journal.pages || '')
        setValue('doi', journal.doi || '')
        setValue('keywords', journal.keywords?.join(', ') || '')
        setValue(
          'publicationDate',
          journal.publicationDate
            ? new Date(journal.publicationDate).toISOString().split('T')[0]
            : ''
        )
        setValue('externalUrl', journal.externalUrl || '')
        setValue('pdfUrl', journal.pdfUrl || '')
        setValue('status', journal.status || 'draft')
        setValue('isFeatured', Boolean(journal.isFeatured))

        setContent(journal.content || '')
        setCoverImage(journal.coverImage || null)
      } catch (err) {
        console.error('Failed to fetch journal:', err)
        setError(
          err.response?.data?.message ||
            'Failed to load journal data. Please try again.'
        )
      } finally {
        setPageLoading(false)
      }
    }

    fetchJournal()
  }, [isEdit, id, setValue])

  const uploadCoverImageIfNeeded = async () => {
    if (!coverImage) return ''

    // Existing image URL from backend
    if (typeof coverImage === 'string') {
      return coverImage
    }

    // New File object from ImageUpload
    if (coverImage instanceof File) {
      const formData = new FormData()
      formData.append('image', coverImage)

      const response = await uploadAPI.uploadImage(
        formData,
        'researchhub/journals'
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
        topicId: data.topicId,
        authors: data.authors
          .split(',')
          .map((author) => author.trim())
          .filter(Boolean),
        abstract: data.abstract || '',
        content,
        coverImage: uploadedCoverImage,
        issn: data.issn || '',
        eissn: data.eissn || '',
        volume: data.volume || '',
        issue: data.issue || '',
        pages: data.pages || '',
        doi: data.doi || '',
        keywords: data.keywords
          .split(',')
          .map((keyword) => keyword.trim())
          .filter(Boolean),
        publicationDate: data.publicationDate || null,
        externalUrl: data.externalUrl || '',
        pdfUrl: data.pdfUrl || '',
        status: data.status || 'draft',
        isFeatured: Boolean(data.isFeatured),
      }

      if (isEdit) {
        await journalAPI.update(id, payload)
      } else {
        await journalAPI.create(payload)
      }

      navigate('/journals')
    } catch (err) {
      console.error('Failed to save journal:', err)
      setError(
        err.response?.data?.message ||
          'Failed to save journal. Please check the form and try again.'
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
            <p className="text-sm text-neutral-500">Loading journal...</p>
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
          onClick={() => navigate('/journals')}
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {isEdit ? 'Edit Journal' : 'New Journal'}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {isEdit
              ? 'Update journal information'
              : 'Add a new research journal to the platform'}
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
          {/* ═══ Left Column — Main Content ═══ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Basic Information
              </h2>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Title <span className="text-danger-500">*</span>
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  placeholder="e.g. Machine Learning Approaches in Early Disease Detection"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  URL Slug <span className="text-danger-500">*</span>
                </label>
                <input
                  {...register('slug', { required: 'Slug is required' })}
                  placeholder="auto-generated-from-title"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                {errors.slug && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.slug.message}
                  </p>
                )}
              </div>

              {/* Authors */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Authors{' '}
                  <span className="text-xs text-neutral-400">
                    (comma-separated)
                  </span>
                </label>
                <input
                  {...register('authors', {
                    required: 'At least one author is required',
                  })}
                  placeholder="Dr. Sarah Chen, Dr. James Wilson"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                {errors.authors && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.authors.message}
                  </p>
                )}
              </div>

              {/* Abstract */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  About the Journal <span className="text-danger-500">*</span>
                </label>
                <textarea
                  {...register('abstract', {
                    required: 'Abstract is required',
                  })}
                  rows={4}
                  placeholder="Brief summary of the journal..."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
                {errors.abstract && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.abstract.message}
                  </p>
                )}
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Keywords{' '}
                  <span className="text-xs text-neutral-400">
                    (comma-separated)
                  </span>
                </label>
                <input
                  {...register('keywords')}
                  placeholder="machine learning, disease detection, healthcare"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Rich Text Content */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Full Description
              </h2>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write the full journal description here..."
              />
            </div>

            {/* Publication Details */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Publication Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    ISSN
                  </label>
                  <input
                    {...register('issn')}
                    placeholder="2589-0042"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    eISSN
                  </label>
                  <input
                    {...register('eissn')}
                    placeholder="2589-0043"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Volume
                  </label>
                  <input
                    {...register('volume')}
                    placeholder="12"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Issue
                  </label>
                  <input
                    {...register('issue')}
                    placeholder="3"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Pages
                  </label>
                  <input
                    {...register('pages')}
                    placeholder="145-162"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    DOI
                  </label>
                  <input
                    {...register('doi')}
                    placeholder="10.1234/rh.2025.001"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    {...register('publicationDate')}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    External URL
                  </label>
                  <input
                    {...register('externalUrl')}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    PDF URL
                  </label>
                  <input
                    {...register('pdfUrl')}
                    placeholder="https://...pdf"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Right Column — Sidebar ═══ */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Publish
              </h2>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Featured */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                  Featured on homepage
                </label>
                <input
                  type="checkbox"
                  {...register('isFeatured')}
                  className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Topic <span className="text-danger-500">*</span>
                </label>
                <select
                  {...register('topicId', { required: 'Topic is required' })}
                  disabled={topicsLoading}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-60"
                >
                  <option value="">
                    {topicsLoading ? 'Loading topics...' : 'Select topic'}
                  </option>
                  {topics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.icon || '📄'} {topic.name}
                    </option>
                  ))}
                </select>
                {errors.topicId && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.topicId.message}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                </button>
              </div>
            </div>

            {/* Cover Image */}
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