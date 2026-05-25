// src/pages/NewsPage.jsx
import { useEffect, useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import NewsCard from '@/components/ui/NewsCard'
import SubscribeSection from '@/components/sections/SubscribeSection'
import { mockNews } from '@/data/mockData'
import { newsAPI } from '@/services/api'

export default function NewsPage() {
  const [newsList, setNewsList] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)

      try {
        const response = await newsAPI.getAll({
          limit: 100,
          sort: '-publishedAt',
        })

        const apiNews = response?.data || []

        if (apiNews.length > 0) {
          setNewsList(apiNews)
          setUsingFallback(false)
        } else {
          setNewsList(mockNews)
          setUsingFallback(true)
        }
      } catch (error) {
        console.error('Failed to fetch news:', error)
        setNewsList(mockNews)
        setUsingFallback(true)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  // Extract unique categories from current data source
  const categories = useMemo(() => {
    const cats = [
      ...new Set(
        newsList
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ]

    return cats
  }, [newsList])

  // Filter locally for both API and fallback data
  const filteredNews = useMemo(() => {
    let result = [...newsList]

    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()

      result = result.filter((item) => {
        const title = item.title?.toLowerCase() || ''
        const excerpt = item.excerpt?.toLowerCase() || ''
        const content = item.content?.toLowerCase() || ''
        const category = item.category?.toLowerCase() || ''
        const tags = item.tags?.join(' ').toLowerCase() || ''

        return (
          title.includes(query) ||
          excerpt.includes(query) ||
          content.includes(query) ||
          category.includes(query) ||
          tags.includes(query)
        )
      })
    }

    result.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt || 0)
      const dateB = new Date(b.publishedAt || b.createdAt || 0)
      return dateB - dateA
    })

    return result
  }, [newsList, searchQuery, selectedCategory])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
  }

  return (
    <>
      <Helmet>
        <title>News — Design Publishing</title>
        <meta
          name="description"
          content="Stay informed with the latest news and updates from Design Publishing."
        />
      </Helmet>

      <PageHeader
        title="News & Updates"
        subtitle="Stay informed with the latest happenings, announcements, and stories from our research community."
        breadcrumbs={[{ label: 'News' }]}
        backgroundImage="https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=1920&q=80"
      />

      {/* ═══ Filter Bar ═══ */}
      <section className="sticky top-16 md:top-20 z-30 bg-white/95 backdrop-blur-xl border-b border-neutral-100 shadow-sm">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search news..."
                className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-200 text-neutral-400"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 text-xs font-medium rounded-full border transition-all ${
                  !selectedCategory
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                }`}
              >
                All
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? null : cat)
                  }
                  className={`px-4 py-2 text-xs font-medium rounded-full border transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ News Grid ═══ */}
      <section className="section-padding bg-neutral-50">
        <div className="container-custom">
          <div className="mb-6">
            <p className="text-sm text-neutral-500">
              {loading
                ? 'Loading articles...'
                : `${filteredNews.length} article${
                    filteredNews.length !== 1 ? 's' : ''
                  } found`}
            </p>

            {usingFallback && !loading && (
              <p className="mt-1 text-xs text-neutral-400">
                Showing sample articles while backend content is unavailable or empty.
              </p>
            )}
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-2xl border border-neutral-100 overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-neutral-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-neutral-100 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 rounded w-full" />
                    <div className="h-3 bg-neutral-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNews.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((news, index) => (
                <NewsCard key={news._id} news={news} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📰</div>
              <h3 className="text-xl font-semibold text-neutral-900">
                No articles found
              </h3>
              <p className="mt-2 text-neutral-500">
                Try adjusting your search or filter.
              </p>
              <button
                onClick={clearFilters}
                className="mt-6 px-6 py-3 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      <SubscribeSection />
    </>
  )
}