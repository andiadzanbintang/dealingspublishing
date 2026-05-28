// src/components/ui/BookCard.jsx
import { Link } from 'react-router-dom'
import { BookOpen, UserRound, Building2, Calendar, Banknote } from 'lucide-react'
import { motion } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import { truncateText, formatBookPrice } from '@/lib/utils'

export default function BookCard({ book, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        to={`/books/${book.slug}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-lg hover:border-neutral-200 transition-all duration-300"
      >
        <div className="p-5">
          <div className="flex gap-5">
            {/* Portrait Cover */}
            <div className="w-28 h-40 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 shadow-sm">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <BookOpen className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {book.category && (
                <Badge size="xs" className="mb-3">
                  {book.category}
                </Badge>
              )}

              <h3 className="text-lg font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
                {book.title}
              </h3>

              {book.subtitle && (
                <p className="mt-1 text-sm text-neutral-500 line-clamp-1">
                  {book.subtitle}
                </p>
              )}

              <p className="mt-3 text-sm text-neutral-500 line-clamp-2">
                {truncateText(book.description, 120)}
              </p>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <UserRound className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {book.writers?.join(', ') || 'Unknown writer'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {book.publishedBy || 'Unknown publisher'}
                  </span>
                </div>

                {formatBookPrice(book.price, book.priceCurrency) && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                    <Banknote className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{formatBookPrice(book.price, book.priceCurrency)}</span>
                  </div>
                )}

                {book.publicationYear && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{book.publicationYear}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}