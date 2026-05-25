// src/pages/BooksPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search, BookOpen, RefreshCw } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import BookCard from '@/components/ui/BookCard'
import Button from '@/components/ui/Button'
import { bookAPI } from '@/services/api'

export default function BooksPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const fetchBooks = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await bookAPI.getAll({
        limit: 100,
        sort: '-createdAt',
      })

      setBooks(response?.data || [])
    } catch (err) {
      console.error('Failed to fetch books:', err)
      setError(
        err.response?.data?.message ||
          'Failed to load books. Please try again later.'
      )
      setBooks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const categories = useMemo(() => {
    const uniqueCategories = books
      .map((book) => book.category)
      .filter(Boolean)

    return ['all', ...new Set(uniqueCategories)]
  }, [books])

  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return books.filter((book) => {
      const matchesCategory =
        categoryFilter === 'all' || book.category === categoryFilter

      const searchableText = [
        book.title,
        book.subtitle,
        book.description,
        book.isbn,
        book.publishedBy,
        book.editor,
        book.category,
        ...(book.writers || []),
        ...(book.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = !query || searchableText.includes(query)

      return matchesCategory && matchesSearch
    })
  }, [books, searchQuery, categoryFilter])

  return (
    <>
      <Helmet>
        <title>Books — Dealings Publishing</title>
        <meta
          name="description"
          content="Explore books published and featured by Dealings Publishing."
        />
      </Helmet>

      <PageHeader
        title="Books"
        subtitle="Explore our books, publications, and curated knowledge resources."
        breadcrumbs={[{ label: 'Books' }]}
        backgroundImage="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1600&q=80"
      />

      <section className="section-padding bg-neutral-50">
        <div className="container-custom">
          {/* Filters */}
          <div className="mb-10 bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
            <div className="grid md:grid-cols-[1fr_auto_auto] gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, writer, ISBN, publisher..."
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={fetchBooks}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              Showing{' '}
              <span className="font-semibold text-neutral-800">
                {filteredBooks.length}
              </span>{' '}
              {filteredBooks.length === 1 ? 'book' : 'books'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8 bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-2xl border border-neutral-100 p-5 animate-pulse"
                >
                  <div className="flex gap-5">
                    <div className="w-28 h-40 bg-neutral-100 rounded-xl flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-neutral-100 rounded w-1/3 mb-4" />
                      <div className="h-5 bg-neutral-100 rounded w-5/6 mb-3" />
                      <div className="h-4 bg-neutral-100 rounded w-2/3 mb-5" />
                      <div className="space-y-2">
                        <div className="h-3 bg-neutral-100 rounded w-full" />
                        <div className="h-3 bg-neutral-100 rounded w-4/5" />
                        <div className="h-3 bg-neutral-100 rounded w-3/5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredBooks.map((book, index) => (
                <BookCard key={book._id} book={book} index={index} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-neutral-100 p-12 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <BookOpen className="w-7 h-7 text-neutral-400" />
              </div>

              <h2 className="text-xl font-bold text-neutral-900">
                No books found
              </h2>

              <p className="mt-2 text-neutral-500 max-w-md mx-auto">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Try adjusting your search keyword or category filter.'
                  : 'There are no published books available yet.'}
              </p>

              {(searchQuery || categoryFilter !== 'all') && (
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => {
                    setSearchQuery('')
                    setCategoryFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}