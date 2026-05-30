// src/pages/BookFormPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import RichTextEditor from '@/components/ui/RichTextEditor'
import ImageUpload from '@/components/ui/ImageUpload'
import { slugify } from '@/lib/utils'
import { bookAPI, uploadAPI } from '@/services/api'

export default function BookFormPage() {
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
      subtitle: '',
      writers: '',
      editor: '',
      publishedBy: 'Dealings Publishing',
      isbn: '',
      price: '',
      priceCurrency: 'IDR',
      description: '',
      publicationYear: '',
      publicationDate: '',
      bookLanguage: '',
      edition: '',
      pages: '',
      category: '',
      tags: '',
      externalUrl: '',
      pdfUrl: '',
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
    const fetchBook = async () => {
      if (!isEdit || !id) return

      setPageLoading(true) 
      setError('')

      try {
        const response = await bookAPI.getById(id)
        const book = response?.data

        if (!book) {
          setError('Book not found.')
          return
        }

        setValue('title', book.title || '')
        setValue('slug', book.slug || '')
        setValue('subtitle', book.subtitle || '')
        setValue('writers', book.writers?.join(', ') || '')
        setValue('editor', book.editor || '')
        setValue('publishedBy', book.publishedBy || '')
        setValue('isbn', book.isbn || '')
        setValue('price', book.price ?? '')
        setValue('priceCurrency', book.priceCurrency || 'IDR')
        setValue('description', book.description || '')
        setValue('publicationYear', book.publicationYear || '')
        setValue(
          'publicationDate',
          book.publicationDate
            ? new Date(book.publicationDate).toISOString().split('T')[0]
            : ''
        )
        setValue('bookLanguage', book.bookLanguage || '')
        setValue('edition', book.edition || '')
        setValue('pages', book.pages || '')
        setValue('category', book.category || '')
        setValue('tags', book.tags?.join(', ') || '')
        setValue('externalUrl', book.externalUrl || '')
        setValue('pdfUrl', book.pdfUrl || '')
        setValue('isPublished', Boolean(book.isPublished))
        setValue('isFeatured', Boolean(book.isFeatured))

        setContent(book.content || '')
        setCoverImage(book.coverImage || null)
      } catch (err) {
        console.error('Failed to fetch book:', err)
        setError(
          err.response?.data?.message ||
            'Failed to load book data. Please try again.'
        )
      } finally {
        setPageLoading(false)
      }
    }

    fetchBook()
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
        'researchhub/books'
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
        subtitle: data.subtitle || '',

        writers: data.writers
          .split(',')
          .map((writer) => writer.trim())
          .filter(Boolean),

        editor: data.editor?.trim(),
        publishedBy: data.publishedBy?.trim(),
        isbn: data.isbn?.trim(),

        price:
          data.price !== '' && data.price !== null && data.price !== undefined
            ? Number(data.price)
            : null,

        priceCurrency: data.priceCurrency?.trim().toUpperCase() || 'IDR',

        description: data.description || '',
        content,
        coverImage: uploadedCoverImage,

        publicationYear: data.publicationYear
          ? Number(data.publicationYear)
          : null,
        publicationDate: data.publicationDate || null,

        bookLanguage: data.bookLanguage || '',
        edition: data.edition || '',
        pages: data.pages || '',
        category: data.category || '',

        tags: data.tags
          ? data.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],

        externalUrl: data.externalUrl || '',
        pdfUrl: data.pdfUrl || '',

        isPublished: Boolean(data.isPublished),
        isFeatured: Boolean(data.isFeatured),
      }

      if (!payload.coverImage) {
        setError('Cover image is required.')
        setLoading(false)
        return
      }

      if (isEdit) {
        await bookAPI.update(id, payload)
      } else {
        await bookAPI.create(payload)
      }

      navigate('/books')
    } catch (err) {
      console.error('Failed to save book:', err)
      setError(
        err.response?.data?.message ||
          'Failed to save book. Please check the form and try again.'
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
            <p className="text-sm text-neutral-500">Loading book...</p>
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
          type="button"
          onClick={() => navigate('/books')}
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {isEdit ? 'Edit Book' : 'New Book'}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {isEdit
              ? 'Update book information'
              : 'Add a new book to the platform'}
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
            {/* Basic Info */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Basic Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Title <span className="text-danger-500">*</span>
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Book title"
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
                  URL Slug <span className="text-danger-500">*</span>
                </label>
                <input
                  {...register('slug', { required: 'Slug is required' })}
                  placeholder="auto-generated-from-title"
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
                  Subtitle
                </label>
                <input
                  {...register('subtitle')}
                  placeholder="Optional subtitle"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Writers{' '}
                  <span className="text-xs text-neutral-400">
                    (comma-separated)
                  </span>{' '}
                  <span className="text-danger-500">*</span>
                </label>
                <input
                  {...register('writers', {
                    required: 'At least one writer is required',
                  })}
                  placeholder="Jane Doe, John Smith"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.writers && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.writers.message}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Editor <span className="text-danger-500">*</span>
                  </label>
                  <input
                    {...register('editor', { required: 'Editor is required' })}
                    placeholder="Editor name"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.editor && (
                    <p className="mt-1 text-xs text-danger-500">
                      {errors.editor.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Published By <span className="text-danger-500">*</span>
                  </label>
                  <input
                    {...register('publishedBy', {
                      required: 'Publisher is required',
                    })}
                    placeholder="Dealings Publishing"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.publishedBy && (
                    <p className="mt-1 text-xs text-danger-500">
                      {errors.publishedBy.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    ISBN <span className="text-danger-500">*</span>
                  </label>
                  <input
                    {...register('isbn', { required: 'ISBN is required' })}
                    placeholder="978-1-23456-789-0"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.isbn && (
                    <p className="mt-1 text-xs text-danger-500">
                      {errors.isbn.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Category
                  </label>
                  <input
                    {...register('category')}
                    placeholder="Urban Planning"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-[1fr_140px] gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    {...register('price', {
                      min: {
                        value: 0,
                        message: 'Price cannot be negative',
                      },
                    })}
                    placeholder="150000"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.price && (
                    <p className="mt-1 text-xs text-danger-500">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Currency
                  </label>
                  <select
                    {...register('priceCurrency')}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Description <span className="text-danger-500">*</span>
                </label>
                <textarea
                  {...register('description', {
                    required: 'Description is required',
                  })}
                  rows={4}
                  placeholder="Short description or summary of the book..."
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
                  Tags{' '}
                  <span className="text-xs text-neutral-400">
                    (comma-separated)
                  </span>
                </label>
                <input
                  {...register('tags')}
                  placeholder="urban planning, sustainability, design"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Rich Text Content */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Additional Information
              </h2>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write full book description, table of contents, or additional notes..."
              />
            </div>

            {/* Publication Details */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Publication Details
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Publication Year
                  </label>
                  <input
                    type="number"
                    {...register('publicationYear')}
                    placeholder="2026"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    {...register('publicationDate')}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Language
                  </label>
                  <input
                    {...register('bookLanguage')}
                    placeholder="English"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Edition
                  </label>
                  <input
                    {...register('edition')}
                    placeholder="First Edition"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Pages
                  </label>
                  <input
                    {...register('pages')}
                    placeholder="320"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    PDF / Preview URL
                  </label>
                  <input
                    {...register('pdfUrl')}
                    placeholder="https://...pdf"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                Publish
              </h2>

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
                      ? 'Update Book'
                      : 'Create Book'}
                </button>
              </div>
            </div>

            {/* Cover Image */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Cover Page
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Portrait cover image is recommended.
                </p>
              </div>

              <ImageUpload value={coverImage} onChange={setCoverImage} />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}