// src/components/sections/BooksSection.jsx
import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { ArrowLeft, ArrowRight, BookOpen, UserRound, Building2, Banknote } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/ui/SectionHeader'
import Badge from '@/components/ui/Badge'
import { truncateText, formatBookPrice } from '@/lib/utils'
import { bookAPI } from '@/services/api'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

function FeaturedBookCard({ book, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="h-full"
    >
      <Link
        to={`/books/${book.slug}`}
        className="group h-full block bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-lg hover:border-neutral-200 transition-all duration-300"
      >
        {/* Large visual area, consistent with journal/news/event cards */}
        <div className="relative h-64 bg-neutral-100 overflow-hidden">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              <BookOpen className="w-10 h-10" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/10 to-transparent opacity-80" />

          <div className="absolute left-4 right-4 bottom-4 flex items-center justify-between gap-3">
            {book.category ? (
              <Badge size="sm">{book.category}</Badge>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-neutral-700">
                Book
              </span>
            )}

            {book.publicationYear && (
              <span className="text-xs font-medium text-white/90 bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-full">
                {book.publicationYear}
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-lg font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
            {book.title}
          </h3>

          {book.subtitle && (
            <p className="mt-1 text-sm text-neutral-500 line-clamp-1">
              {book.subtitle}
            </p>
          )}

          <p className="mt-3 text-sm text-neutral-500 leading-relaxed line-clamp-3">
            {truncateText(book.description, 140)}
          </p>

          <div className="mt-5 pt-4 border-t border-neutral-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <UserRound className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {book.writers?.join(', ') || 'Unknown writer'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {book.publishedBy || 'Dealings Publishing'}
              </span>
            </div>

            {formatBookPrice(book.price, book.priceCurrency) && (
              <div className="flex items-center gap-1.5 text-xs text-primary-600 font-medium">
                <Banknote className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">
                  {formatBookPrice(book.price, book.priceCurrency)}
                </span>
              </div>
            )}
            
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

export default function BooksSection() {
  const [featuredBooks, setFeaturedBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedBooks = async () => {
      setLoading(true)

      try {
        const response = await bookAPI.getFeatured()
        setFeaturedBooks(response?.data || [])
      } catch (error) {
        console.error('Failed to fetch featured books:', error)
        setFeaturedBooks([])
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedBooks()
  }, [])

  if (!loading && featuredBooks.length === 0) {
    return null
  }

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <SectionHeader
          title="Featured Books"
          subtitle="Explore selected books and publications from Dealings Publishing."
          linkText="View All Books"
          linkTo="/books"
        />

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-white rounded-2xl border border-neutral-100 overflow-hidden animate-pulse"
              >
                <div className="h-64 bg-neutral-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-neutral-100 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                  <div className="h-3 bg-neutral-100 rounded w-2/3" />
                  <div className="h-3 bg-neutral-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="relative group/carousel">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={24}
                slidesPerView={1}
                navigation={{
                  prevEl: '.books-prev',
                  nextEl: '.books-next',
                }}
                pagination={{
                  clickable: true,
                  el: '.books-pagination',
                  bulletClass: 'swiper-dot',
                  bulletActiveClass: 'swiper-dot-active',
                }}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                  1280: { slidesPerView: 4 },
                }}
                className="!pb-14"
              >
                {featuredBooks.map((book, index) => (
                  <SwiperSlide key={book._id} className="h-auto">
                    <FeaturedBookCard book={book} index={index} />
                  </SwiperSlide>
                ))}
              </Swiper>

              <button
                className="books-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-11 h-11 bg-white rounded-full shadow-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-200 transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-30"
                aria-label="Previous"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                className="books-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-11 h-11 bg-white rounded-full shadow-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-200 transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-30"
                aria-label="Next"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="books-pagination flex items-center justify-center gap-2 mt-8" />
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link
                to="/books"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600"
              >
                View All Books
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}