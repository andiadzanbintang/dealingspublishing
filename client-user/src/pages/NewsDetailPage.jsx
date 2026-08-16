// src/pages/NewsDetailPage.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Calendar, ArrowLeft, Share2, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import NewsCard from '@/components/ui/NewsCard'
import AnimatedSection from '@/components/ui/AnimatedSection'
import ExpandableText from '@/components/ui/ExpandableText'
import { formatDate } from '@/lib/utils'
import { mockNews } from '@/data/mockData'
import { newsAPI } from '@/services/api'

export default function NewsDetailPage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [relatedNews, setRelatedNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getFallbackRelated = (currentArticle) => {
      if (!currentArticle) return []

      return mockNews
        .filter(
          (item) =>
            item._id !== currentArticle._id &&
            (!currentArticle.category || item.category === currentArticle.category)
        )
        .slice(0, 3)
    }

    const fetchRelatedNews = async (currentArticle) => {
      try {
        if (!currentArticle?.category) {
          setRelatedNews(getFallbackRelated(currentArticle))
          return
        }

        const response = await newsAPI.getAll({
          category: currentArticle.category,
          limit: 4,
        })

        const apiRelated = (response?.data || [])
          .filter((item) => item._id !== currentArticle._id)
          .slice(0, 3)

        if (apiRelated.length > 0) {
          setRelatedNews(apiRelated)
        } else {
          setRelatedNews(getFallbackRelated(currentArticle))
        }
      } catch (error) {
        console.error('Error fetching related news:', error)
        setRelatedNews(getFallbackRelated(currentArticle))
      }
    }

    const fetchArticle = async () => {
      setLoading(true)

      try {
        const response = await newsAPI.getBySlug(slug)
        const apiArticle = response?.data || null

        if (apiArticle) {
          setArticle(apiArticle)
          await fetchRelatedNews(apiArticle)
          return
        }

        const fallbackArticle = mockNews.find((item) => item.slug === slug)
        setArticle(fallbackArticle || null)
        setRelatedNews(getFallbackRelated(fallbackArticle))
      } catch (error) {
        console.error('Error fetching news article:', error)

        const fallbackArticle = mockNews.find((item) => item.slug === slug)
        setArticle(fallbackArticle || null)
        setRelatedNews(getFallbackRelated(fallbackArticle))
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [slug])

  const handleShare = () => {
    if (!article) return

    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Article — Dealings Publishing</title>
        </Helmet>

        <div className="pt-32 pb-20 bg-neutral-50 min-h-screen">
          <div className="container-custom max-w-4xl">
            <div className="bg-white rounded-3xl border border-neutral-100 p-8 animate-pulse">
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

  if (!article) {
    return (
      <>
        <Helmet>
          <title>Article Not Found — Dealings Publishing</title>
        </Helmet>

        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-6xl mb-4">📰</div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Article Not Found
            </h1>
            <p className="mt-2 text-neutral-500">
              The article you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link to="/news">
              <Button
                variant="primary"
                className="mt-6"
                icon={ArrowLeft}
                iconPosition="left"
              >
                Back to News
              </Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>{article.title} — Dealings Publishing</title>
        <meta name="description" content={article.excerpt || article.title} />

        <meta property="og:title" content={article.title} />
        <meta
          property="og:description"
          content={article.excerpt || article.title}
        />
        {article.coverImage && (
          <meta property="og:image" content={article.coverImage} />
        )}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta
          name="twitter:description"
          content={article.excerpt || article.title}
        />
        {article.coverImage && (
          <meta name="twitter:image" content={article.coverImage} />
        )}
      </Helmet>

      {/* ═══ Hero ═══ */}
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-16 bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0">
          {article.coverImage && (
            <img
              src={article.coverImage}
              alt=""
              className="w-full h-full object-cover opacity-15"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 to-neutral-900" />
        </div>

        <div className="relative container-custom max-w-4xl">
          {/* Breadcrumbs */}
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-sm text-neutral-500 mb-8 flex-wrap"
          >
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-neutral-600">/</span>
            <Link to="/news" className="hover:text-white transition-colors">
              News
            </Link>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-300 line-clamp-1">
              {article.title}
            </span>
          </motion.nav>

          {article.category && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Badge
                className="bg-white/10 text-white backdrop-blur-sm border-0"
                size="md"
              >
                {article.category}
              </Badge>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight"
          >
            {article.title}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center gap-4 text-sm text-neutral-400"
          >
            {article.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(article.publishedAt)}
              </span>
            )}

            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {article.viewCount?.toLocaleString() || 0} views
            </span>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══ Content ═══ */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          {/* Featured Image */}
          {article.coverImage && (
            <AnimatedSection>
              <div className="rounded-2xl overflow-hidden mb-10 shadow-lg">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </AnimatedSection>
          )}

          {/* Article Body */}
          <AnimatedSection delay={0.1}>
            <div>
              {article.excerpt && (
                <p className="text-xl text-neutral-600 leading-relaxed font-medium border-l-2 border-primary-200 pl-5 mb-8">
                  {article.excerpt}
                </p>
              )}

              {article.content ? (
                <ExpandableText
                  collapsedHeight={560}
                  html={article.content}
                  contentClassName="rich-content"
                  moreLabel="Continue reading"
                />
              ) : (
                <div className="rich-content">
                  <p>
                    Full article content is not available yet. Please check back
                    later for more details.
                  </p>
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Back Button */}
          <AnimatedSection delay={0.15}>
            <div className="mt-12 pt-8 border-t border-neutral-200">
              <Link to="/news">
                <Button variant="ghost" icon={ArrowLeft} iconPosition="left">
                  Back to News
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ Related News ═══ */}
      {relatedNews.length > 0 && (
        <section className="section-padding bg-neutral-50">
          <div className="container-custom">
            <AnimatedSection>
              <div className="flex items-end justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">
                    Related Articles
                  </h2>
                  <p className="mt-2 text-neutral-500">
                    Explore more updates from the same category.
                  </p>
                </div>

                <Link
                  to="/news"
                  className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View All News
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </AnimatedSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedNews.map((news, index) => (
                <NewsCard key={news._id} news={news} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}