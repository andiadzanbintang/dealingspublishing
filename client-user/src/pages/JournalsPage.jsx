// src/pages/JournalsPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import JournalCard from '@/components/ui/JournalCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { journalAPI, topicAPI } from '@/services/api'
import { mockJournals, mockTopics } from '@/data/mockData'

const sortOptions = [
  { value: '-publicationDate', label: 'Newest First' },
  { value: 'publicationDate', label: 'Oldest First' },
  { value: '-viewCount', label: 'Most Viewed' },
  { value: 'title', label: 'Title A-Z' },
]

export default function JournalsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialTopic = searchParams.get('topic') || ''
  const initialSearch = searchParams.get('q') || ''

  const [journals, setJournals] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(initialTopic)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [sortBy, setSortBy] = useState('-publicationDate')
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await topicAPI.getAll()
        const apiTopics = response?.data || []

        if (apiTopics.length > 0) {
          setTopics(apiTopics)
        } else {
          setTopics(mockTopics)
        }
      } catch (error) {
        console.error('Failed to fetch topics:', error)
        setTopics(mockTopics)
      }
    }

    fetchTopics()
  }, [])

  useEffect(() => {
    const fetchJournals = async () => {
      setLoading(true)

      try {
        const selectedTopicData =
          topics.find((topic) => topic.slug === selectedTopic) || null

        const params = {
          limit: 100,
          sort: sortBy,
        }

        if (searchQuery) params.q = searchQuery

        // Backend Journal model field is "topic", so use ObjectId when available.
        if (selectedTopicData?._id && !selectedTopicData._id.startsWith?.('mock')) {
          params.topic = selectedTopicData._id
        }

        const response = await journalAPI.getAll(params)
        const apiJournals = response?.data || []

        if (apiJournals.length > 0) {
          setJournals(apiJournals)
          setUsingFallback(false)
        } else {
          setJournals(mockJournals)
          setUsingFallback(true)
        }
      } catch (error) {
        console.error('Failed to fetch journals:', error)
        setJournals(mockJournals)
        setUsingFallback(true)
      } finally {
        setLoading(false)
      }
    }

    fetchJournals()
  }, [selectedTopic, searchQuery, sortBy, topics])

  useEffect(() => {
    const params = {}

    if (selectedTopic) params.topic = selectedTopic
    if (searchQuery) params.q = searchQuery

    setSearchParams(params, { replace: true })
  }, [selectedTopic, searchQuery, setSearchParams])

  const filteredJournals = useMemo(() => {
    let data = [...journals]

    // If using fallback/mock, filter by topic slug locally.
    // If using backend data, topic filtering is already handled by API where possible.
    if (usingFallback && selectedTopic) {
      data = data.filter((journal) => journal.topic?.slug === selectedTopic)
    }

    // If using fallback/mock, search locally.
    // If backend has data, q is already sent to API, but this also keeps UX consistent.
    if (searchQuery) {
      const keyword = searchQuery.toLowerCase()

      data = data.filter((journal) => {
        const title = journal.title?.toLowerCase() || ''
        const abstract = journal.abstract?.toLowerCase() || ''
        const authors = journal.authors?.join(' ').toLowerCase() || ''
        const keywords = journal.keywords?.join(' ').toLowerCase() || ''

        return (
          title.includes(keyword) ||
          abstract.includes(keyword) ||
          authors.includes(keyword) ||
          keywords.includes(keyword)
        )
      })
    }

    if (usingFallback) {
      data.sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title)
        if (sortBy === 'publicationDate') {
          return new Date(a.publicationDate) - new Date(b.publicationDate)
        }
        if (sortBy === '-viewCount') {
          return (b.viewCount || 0) - (a.viewCount || 0)
        }

        return new Date(b.publicationDate) - new Date(a.publicationDate)
      })
    }

    return data
  }, [journals, selectedTopic, searchQuery, sortBy, usingFallback])

  const selectedTopicData = topics.find((topic) => topic.slug === selectedTopic)

  const clearFilters = () => {
    setSelectedTopic('')
    setSearchQuery('')
    setSortBy('-publicationDate')
  }

  return (
    <>
      <Helmet>
        <title>Journals — Dealings Publishing</title>
        <meta
          name="description"
          content="Explore peer-reviewed journals and research publications across multiple disciplines."
        />
      </Helmet>

      <PageHeader
        title="Journals"
        subtitle="Explore our peer-reviewed research publications across various disciplines."
        breadcrumbs={[{ label: 'Journals' }]}
        backgroundImage="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&q=80"
      />

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="sticky top-28 space-y-6">
                <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      Filters
                    </h2>

                    {(selectedTopic || searchQuery) && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-neutral-500 hover:text-danger-500 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                      Topics
                    </label>

                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedTopic('')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                          selectedTopic === ''
                            ? 'bg-primary-600 text-white'
                            : 'text-neutral-600 hover:bg-white hover:text-neutral-900'
                        }`}
                      >
                        All Topics
                      </button>

                      {topics.map((topic) => (
                        <button
                          key={topic._id}
                          onClick={() => setSelectedTopic(topic.slug)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                            selectedTopic === topic.slug
                              ? 'bg-primary-600 text-white'
                              : 'text-neutral-600 hover:bg-white hover:text-neutral-900'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{topic.icon || '📄'}</span>
                            <span>{topic.name}</span>
                          </span>

                          {topic.journalCount !== undefined && (
                            <span className="text-xs opacity-70">
                              {topic.journalCount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">
                    {selectedTopicData
                      ? selectedTopicData.name
                      : 'All Journals'}
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    {loading
                      ? 'Loading journals...'
                      : `${filteredJournals.length} publication${
                          filteredJournals.length === 1 ? '' : 's'
                        } found`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search journals..."
                      className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedTopicData && (
                <div className="mb-8">
                  <Badge color={selectedTopicData.color} size="md">
                    {selectedTopicData.icon} {selectedTopicData.name}
                  </Badge>

                  {selectedTopicData.description && (
                    <p className="mt-3 text-neutral-500 max-w-2xl">
                      {selectedTopicData.description}
                    </p>
                  )}
                </div>
              )}

              {loading ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div
                      key={item}
                      className="bg-white rounded-2xl border border-neutral-100 overflow-hidden animate-pulse"
                    >
                      <div className="h-52 bg-neutral-100" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-neutral-100 rounded w-3/4" />
                        <div className="h-3 bg-neutral-100 rounded w-full" />
                        <div className="h-3 bg-neutral-100 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredJournals.length > 0 ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredJournals.map((journal, index) => (
                    <JournalCard
                      key={journal._id}
                      journal={journal}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-neutral-50 rounded-3xl border border-neutral-200 p-10 text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    No journals found
                  </h3>
                  <p className="mt-2 text-neutral-500">
                    Try adjusting your search keyword or selected topic.
                  </p>
                  <Button className="mt-6" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}