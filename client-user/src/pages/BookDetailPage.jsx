// src/pages/BookDetailPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Building2,
  UserRound,
  PenLine,
  Hash,
  Languages,
  Files,
  ExternalLink,
  Download,
  Share2,
  Copy,
  Tag,
  Home,
  ChevronRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { formatDate } from '@/lib/utils'
import { bookAPI } from '@/services/api'

export default function BookDetailPage() {
  const { slug } = useParams()

  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await bookAPI.getBySlug(slug)
        setBook(response?.data || null)
      } catch (err) {
        console.error('Failed to fetch book:', err)
        setError(
          err.response?.data?.message ||
            'Failed to load book. Please try again later.'
        )
        setBook(null)
      } finally {
        setLoading(false)
      }
    }

    fetchBook()
  }, [slug])

  const writers = book?.writers || []
  const tags = book?.tags || []

  const hasAdditionalInformation = Boolean(
    book?.content && book.content.trim() && book.content.trim() !== '<p></p>'
  )

  const citationText = useMemo(() => {
    if (!book) return ''

    const writerText =
      writers.length > 0 ? writers.join(', ') : 'Unknown writer'
    const year =
      book.publicationYear ||
      (book.publicationDate
        ? new Date(book.publicationDate).getFullYear()
        : 'n.d.')

    return `${writerText}. (${year}). ${book.title}. ${
      book.publishedBy || 'Dealings Publishing'
    }. ISBN: ${book.isbn || 'N/A'}`
  }, [book, writers])

  const handleCopyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citationText)
    } catch (err) {
      console.error('Failed to copy citation:', err)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: book.title,
          text: book.description,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
      }
    } catch (err) {
      console.error('Failed to share book:', err)
    }
  }

  if (loading) {
    return (
      <div className="pt-32 pb-20 bg-neutral-50 min-h-screen">
        <div className="container-custom">
          <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-neutral-100 p-8 animate-pulse">
            <div className="grid md:grid-cols-[220px_1fr] gap-8">
              <div className="h-80 bg-neutral-100 rounded-2xl" />
              <div>
                <div className="h-8 bg-neutral-100 rounded w-3/4 mb-4" />
                <div className="h-4 bg-neutral-100 rounded w-1/2 mb-8" />
                <div className="space-y-3">
                  <div className="h-4 bg-neutral-100 rounded w-full" />
                  <div className="h-4 bg-neutral-100 rounded w-full" />
                  <div className="h-4 bg-neutral-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 border border-neutral-100">
            <BookOpen className="w-7 h-7 text-neutral-400" />
          </div>

          <h1 className="text-2xl font-bold text-neutral-900">
            Book Not Found
          </h1>

          <p className="mt-2 text-neutral-500">
            {error ||
              "The book you're looking for doesn't exist or is not published."}
          </p>

          <Link to="/books">
            <Button
              variant="primary"
              className="mt-6"
              icon={ArrowLeft}
              iconPosition="left"
            >
              Back to Books
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{book.title} — Dealings Publishing</title>
        <meta name="description" content={book.description} />
      </Helmet>

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0">
          {book.coverImage && (
            <img
              src={book.coverImage}
              alt=""
              className="w-full h-full object-cover opacity-10 blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/80 to-neutral-900" />
        </div>

        <div className="relative container-custom">
          {/* Breadcrumbs */}
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-1.5 text-sm text-neutral-500 mb-10 flex-wrap"
          >
            <Link
              to="/"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <Link to="/books" className="hover:text-white transition-colors">
              Books
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <span className="text-neutral-300 line-clamp-1">{book.title}</span>
          </motion.nav>

          <div className="grid lg:grid-cols-[280px_1fr] gap-10 lg:gap-14 items-start">
            {/* Cover */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mx-auto lg:mx-0"
            >
              <div className="w-56 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-800 shadow-2xl border border-white/10">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500">
                    <BookOpen className="w-12 h-12" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Info */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-2"
              >
                {book.category && <Badge size="md">{book.category}</Badge>}
                {book.isFeatured && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white border border-white/10">
                    Featured
                  </span>
                )}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="mt-5 text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight"
              >
                {book.title}
              </motion.h1>

              {book.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                  className="mt-4 text-xl text-neutral-300 leading-relaxed max-w-3xl"
                >
                  {book.subtitle}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 grid sm:grid-cols-2 gap-4 text-sm text-neutral-300"
              >
                <div className="flex items-center gap-2">
                  <UserRound className="w-4 h-4 text-neutral-500" />
                  <span>{writers.join(', ') || 'Unknown writer'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-neutral-500" />
                  <span>Editor: {book.editor || '—'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-neutral-500" />
                  <span>{book.publishedBy || '—'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-neutral-500" />
                  <span>ISBN: {book.isbn || '—'}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {book.pdfUrl && (
                  <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary" icon={Download} iconPosition="left">
                      Download / Preview
                    </Button>
                  </a>
                )}

                {book.externalUrl && (
                  <a
                    href={book.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                      icon={ExternalLink}
                      iconPosition="left"
                    >
                      View External
                    </Button>
                  </a>
                )}

                <Button
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  icon={Share2}
                  iconPosition="left"
                  onClick={handleShare}
                >
                  Share
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main */}
            <div className="lg:col-span-2">
              {book.description && (
                <AnimatedSection>
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                      Description
                    </h2>
                    <p className="text-neutral-600 leading-relaxed text-lg">
                      {book.description}
                    </p>
                  </div>
                </AnimatedSection>
              )}

              {hasAdditionalInformation && (
                <AnimatedSection delay={0.1}>
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                      Additional Information
                    </h2>
                    <div
                      className="prose prose-neutral prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: book.content }}
                    />
                  </div>
                </AnimatedSection>
              )}

              {tags.length > 0 && (
                <AnimatedSection delay={0.15}>
                  <div className="mb-10">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 bg-neutral-100 text-neutral-600 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              <AnimatedSection delay={0.2}>
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      Cite this Book
                    </h3>

                    <button
                      type="button"
                      onClick={handleCopyCitation}
                      className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Citation
                    </button>
                  </div>

                  <p className="text-sm text-neutral-600 leading-relaxed bg-white p-4 rounded-xl border border-neutral-200 font-mono">
                    {citationText}
                  </p>
                </div>
              </AnimatedSection>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <AnimatedSection delay={0.2}>
                <div className="sticky top-28 space-y-6">
                  <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-5">
                      Book Details
                    </h3>

                    <dl className="space-y-4">
                      <MetaItem
                        icon={UserRound}
                        label="Writers"
                        value={writers.join(', ') || '—'}
                      />
                      <MetaItem
                        icon={PenLine}
                        label="Editor"
                        value={book.editor || '—'}
                      />
                      <MetaItem
                        icon={Building2}
                        label="Published By"
                        value={book.publishedBy || '—'}
                      />
                      <MetaItem icon={Hash} label="ISBN" value={book.isbn || '—'} />
                      <MetaItem
                        icon={Calendar}
                        label="Publication"
                        value={
                          book.publicationDate
                            ? formatDate(book.publicationDate)
                            : book.publicationYear || '—'
                        }
                      />
                      <MetaItem
                        icon={Languages}
                        label="Language"
                        value={book.language || '—'}
                      />
                      <MetaItem
                        icon={Files}
                        label="Edition / Pages"
                        value={
                          [
                            book.edition || '',
                            book.pages ? `${book.pages} pages` : '',
                          ]
                            .filter(Boolean)
                            .join(' · ') || '—'
                        }
                      />
                      <MetaItem
                        icon={BookOpen}
                        label="Category"
                        value={book.category || '—'}
                      />
                    </dl>
                  </div>

                  <Link
                    to="/books"
                    className="block p-5 rounded-2xl border border-neutral-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Browse more</p>
                        <p className="text-sm font-semibold text-neutral-900">
                          All Books
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
      <div>
        <dt className="text-xs text-neutral-500 uppercase tracking-wider">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm font-medium text-neutral-800 break-words">
          {value}
        </dd>
      </div>
    </div>
  )
}