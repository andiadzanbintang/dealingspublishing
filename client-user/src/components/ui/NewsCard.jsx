// src/components/ui/NewsCard.jsx
import { Link } from 'react-router-dom'
import { Calendar, ArrowUpRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { formatDate, truncateText } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function NewsCard({ news, index = 0, variant = 'default' }) {
  if (variant === 'featured') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <Link
          to={`/news/${news.slug}`}
          className="group block relative rounded-3xl overflow-hidden h-[420px]"
        >
          <img
            src={news.coverImage}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8">
            <Badge
              className="mb-4 bg-white/20 text-white backdrop-blur-sm border-0"
              size="md"
            >
              {news.category}
            </Badge>
            <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight group-hover:text-primary-200 transition-colors">
              {news.title}
            </h3>
            <p className="mt-3 text-white/70 line-clamp-2">{news.excerpt}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/50">
              <Calendar className="w-4 h-4" />
              {formatDate(news.publishedAt)}
            </div>
          </div>

          <div className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </Link>
      </motion.article>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link
        to={`/news/${news.slug}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-lg hover:border-neutral-200 transition-all duration-300"
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={news.coverImage}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4">
            <Badge className="bg-white/90 backdrop-blur-sm text-neutral-700" size="sm">
              {news.category}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
            {news.title}
          </h3>
          <p className="mt-2 text-sm text-neutral-500 line-clamp-2">
            {truncateText(news.excerpt, 100)}
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-neutral-400">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(news.publishedAt)}
          </div>
        </div>
      </Link>
    </motion.article>
  )
}