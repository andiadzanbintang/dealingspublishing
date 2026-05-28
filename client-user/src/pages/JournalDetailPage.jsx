// src/pages/JournalDetailPage.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Calendar,
  Users,
  BookOpen,
  Hash,
  ExternalLink,
  Download,
  Share2,
  Copy,
  MessageCircle,
  Eye,
  ArrowLeft,
  Tag,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import JournalCard from '@/components/ui/JournalCard'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { formatDate } from '@/lib/utils'
import { mockJournals } from '@/data/mockData'
import { journalAPI } from '@/services/api'

export default function JournalDetailPage() {
  const { slug } = useParams()
  const [journal, setJournal] = useState(null)
  const [relatedJournals, setRelatedJournals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getFallbackRelated = (currentJournal) => {
      if (!currentJournal) return []

      return mockJournals
        .filter(
          (item) =>
            item.topic?._id === currentJournal.topic?._id &&
            item._id !== currentJournal._id
        )
        .slice(0, 3)
    }

    const fetchRelatedJournals = async (currentJournal) => {
      try {
        if (!currentJournal?.topic?._id) {
          setRelatedJournals(getFallbackRelated(currentJournal))
          return
        }

        const response = await journalAPI.getAll({
          topic: currentJournal.topic._id,
          limit: 4,
        })

        const apiRelated = (response?.data || [])
          .filter((item) => item._id !== currentJournal._id)
          .slice(0, 3)

        if (apiRelated.length > 0) {
          setRelatedJournals(apiRelated)
        } else {
          setRelatedJournals(getFallbackRelated(currentJournal))
        }
      } catch (error) {
        console.error('Error fetching related journals:', error)
        setRelatedJournals(getFallbackRelated(currentJournal))
      }
    }

    const fetchJournal = async () => {
      setLoading(true)

      try {
        const response = await journalAPI.getBySlug(slug)
        const apiJournal = response?.data || null

        if (apiJournal) {
          setJournal(apiJournal)
          await fetchRelatedJournals(apiJournal)
          return
        }

        const fallbackJournal = mockJournals.find((item) => item.slug === slug)
        setJournal(fallbackJournal || null)
        setRelatedJournals(getFallbackRelated(fallbackJournal))
      } catch (error) {
        console.error('Error fetching journal:', error)

        const fallbackJournal = mockJournals.find((item) => item.slug === slug)
        setJournal(fallbackJournal || null)
        setRelatedJournals(getFallbackRelated(fallbackJournal))
      } finally {
        setLoading(false)
      }
    }

    fetchJournal()
  }, [slug])

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Journal — Design Publishing</title>
        </Helmet>

        <div className="pt-32 pb-20 bg-neutral-50 min-h-screen">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-neutral-100 p-8 animate-pulse">
              <div className="h-8 bg-neutral-100 rounded w-3/4 mb-4" />
              <div className="h-4 bg-neutral-100 rounded w-1/2 mb-8" />
              <div className="h-80 bg-neutral-100 rounded-2xl mb-8" />
              <div className="space-y-3">
                <div className="h-4 bg-neutral-100 rounded w-full" />
                <div className="h-4 bg-neutral-100 rounded w-full" />
                <div className="h-4 bg-neutral-100 rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!journal) {
    return (
      <>
        <Helmet>
          <title>Journal Not Found — Design Publishing</title>
        </Helmet>

        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-6xl mb-4">📄</div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Journal Not Found
            </h1>
            <p className="mt-2 text-neutral-500">
              The journal you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link to="/journals">
              <Button
                variant="primary"
                className="mt-6"
                icon={ArrowLeft}
                iconPosition="left"
              >
                Back to Journals
              </Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  const authors = journal.authors || []
  const keywords = journal.keywords || []

  const publicationYear = journal.publicationDate
    ? new Date(journal.publicationDate).getFullYear()
    : 'n.d.'

  const citationAPA = `${authors.join(', ') || 'Unknown author'} (${publicationYear}). ${
    journal.title
  }. Design Publishing${journal.volume ? `, ${journal.volume}` : ''}${
    journal.issue ? `(${journal.issue})` : ''
  }${journal.pages ? `, ${journal.pages}` : ''}${
    journal.doi ? `. https://doi.org/${journal.doi}` : ''
  }`

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(citationAPA)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: journal.title,
        text: journal.abstract,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <>
      <Helmet>
        <title>{journal.title} — Design Publishing</title>
        <meta name="description" content={journal.abstract || journal.title} />

        <meta property="og:title" content={journal.title} />
        <meta
          property="og:description"
          content={journal.abstract || journal.title}
        />
        {journal.coverImage && (
          <meta property="og:image" content={journal.coverImage} />
        )}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={journal.title} />
        <meta
          name="twitter:description"
          content={journal.abstract || journal.title}
        />
        {journal.coverImage && (
          <meta name="twitter:image" content={journal.coverImage} />
        )}
      </Helmet>

      {/* ═══ Hero ═══ */}
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-16 bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0">
          {journal.coverImage && (
            <img
              src={journal.coverImage}
              alt=""
              className="w-full h-full object-cover opacity-10 blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/80 to-neutral-900" />
        </div>

        <div className="relative container-custom">
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-sm text-neutral-500 mb-8 flex-wrap"
          >
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-neutral-600">/</span>
            <Link to="/journals" className="hover:text-white transition-colors">
              Journals
            </Link>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-300 line-clamp-1">
              {journal.title}
            </span>
          </motion.nav>

          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {journal.topic && (
                  <Badge color={journal.topic?.color} size="md">
                    {journal.topic?.name}
                  </Badge>
                )}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight"
              >
                {journal.title}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex flex-wrap items-center gap-4 text-sm text-neutral-400"
              >
                {authors.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {authors.join(', ')}
                  </span>
                )}

                {journal.publicationDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(journal.publicationDate)}
                  </span>
                )}

                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {journal.viewCount?.toLocaleString() || 0} views
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {journal.pdfUrl && (
                  <a href={journal.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary" icon={Download} iconPosition="left">
                      Download PDF
                    </Button>
                  </a>
                )}

                {journal.externalUrl && (
                  <a
                    href={journal.externalUrl}
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

            {journal.coverImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="hidden lg:block"
              >
                <img
                  src={journal.coverImage}
                  alt={journal.title}
                  className="w-full h-80 object-cover rounded-2xl shadow-2xl"
                />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ Main Content ═══ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {journal.abstract && (
                <AnimatedSection>
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                      About the Journal
                    </h2>
                    <p className="text-neutral-600 leading-relaxed text-lg">
                      {journal.abstract}
                    </p>
                  </div>
                </AnimatedSection>
              )}

              <AnimatedSection delay={0.1}>
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                    Description
                  </h2>

                  {journal.content ? (
                    <div
                      className="prose prose-neutral prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: journal.content }}
                    />
                  ) : (
                    <p className="text-neutral-600 leading-relaxed">
                      Full journal content is not available yet.
                    </p>
                  )}
                </div>
              </AnimatedSection>

              {keywords.length > 0 && (
                <AnimatedSection delay={0.15}>
                  <div className="mb-10">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="px-3 py-1.5 bg-neutral-100 text-neutral-600 text-sm rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {/* Copy Site */}
              {/* <AnimatedSection delay={0.2}>
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      Cite this Journal
                    </h3>
                    <button
                      onClick={handleCopyCitation}
                      className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy APA
                    </button>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed bg-white p-4 rounded-xl border border-neutral-200 font-mono">
                    {citationAPA}
                  </p>
                </div>
              </AnimatedSection> */}

              <AnimatedSection delay={0.25}>
                <div className="mt-10 p-6 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-2xl border border-primary-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">
                        Have questions about this journal?
                      </h3>
                      <p className="mt-1 text-sm text-neutral-600">
                        Our AI research assistant can help you understand the
                        findings, methodology, and implications of this
                        publication.
                      </p>
                      <button className="mt-4 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
                        Ask AI Assistant
                      </button>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            <div className="lg:col-span-1">
              <AnimatedSection delay={0.2}>
                <div className="sticky top-28 space-y-6">
                  <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-5">
                      Journal Details
                    </h3>

                    <dl className="space-y-4">
                      {journal.issn && (
                        <div className="flex items-start gap-3">
                          <Hash className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <dt className="text-xs text-neutral-500 uppercase tracking-wider">
                              ISSN
                            </dt>
                            <dd className="mt-0.5 text-sm font-medium text-neutral-800">
                              {journal.issn}
                            </dd>
                          </div>
                        </div>
                      )}

                      {journal.doi && (
                        <div className="flex items-start gap-3">
                          <ExternalLink className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <dt className="text-xs text-neutral-500 uppercase tracking-wider">
                              DOI
                            </dt>
                            <dd className="mt-0.5 text-sm font-medium text-primary-600 break-all">
                              <a
                                href={`https://doi.org/${journal.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {journal.doi}
                              </a>
                            </dd>
                          </div>
                        </div>
                      )}

                      {(journal.volume || journal.issue) && (
                        <div className="flex items-start gap-3">
                          <BookOpen className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <dt className="text-xs text-neutral-500 uppercase tracking-wider">
                              Volume / Issue
                            </dt>
                            <dd className="mt-0.5 text-sm font-medium text-neutral-800">
                              {journal.volume && `Vol. ${journal.volume}`}
                              {journal.volume && journal.issue && ', '}
                              {journal.issue && `Issue ${journal.issue}`}
                            </dd>
                          </div>
                        </div>
                      )}

                      {journal.pages && (
                        <div className="flex items-start gap-3">
                          <BookOpen className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <dt className="text-xs text-neutral-500 uppercase tracking-wider">
                              Pages
                            </dt>
                            <dd className="mt-0.5 text-sm font-medium text-neutral-800">
                              {journal.pages}
                            </dd>
                          </div>
                        </div>
                      )}

                      {journal.publicationDate && (
                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <dt className="text-xs text-neutral-500 uppercase tracking-wider">
                              Published
                            </dt>
                            <dd className="mt-0.5 text-sm font-medium text-neutral-800">
                              {formatDate(journal.publicationDate)}
                            </dd>
                          </div>
                        </div>
                      )}

                      {authors.length > 0 && (
                        <div className="flex items-start gap-3">
                          <Users className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <dt className="text-xs text-neutral-500 uppercase tracking-wider">
                              Chief in Editors
                            </dt>
                            <dd className="mt-0.5 text-sm font-medium text-neutral-800">
                              {authors.map((author) => (
                                <span key={author} className="block">
                                  {author}
                                </span>
                              ))}
                            </dd>
                          </div>
                        </div>
                      )}
                    </dl>
                  </div>

                  {journal.topic && (
                    <Link
                      to={`/journals?topic=${journal.topic?.slug || ''}`}
                      className="block p-5 rounded-2xl border border-neutral-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                          style={{
                            backgroundColor: `${journal.topic?.color}15`,
                          }}
                        >
                          {journal.topic?.icon || '📚'}
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">
                            Browse more in
                          </p>
                          <p className="text-sm font-semibold text-neutral-900">
                            {journal.topic?.name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Related Journals ═══ */}
      {relatedJournals.length > 0 && (
        <section className="section-padding bg-neutral-50">
          <div className="container-custom">
            <AnimatedSection>
              <div className="flex items-end justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">
                    Related Journals
                  </h2>
                  <p className="mt-2 text-neutral-500">
                    Explore more publications from the same topic.
                  </p>
                </div>

                <Link
                  to="/journals"
                  className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View All Journals
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </AnimatedSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedJournals.map((item, index) => (
                <JournalCard key={item._id} journal={item} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}