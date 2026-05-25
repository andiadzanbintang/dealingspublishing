// src/components/ui/JournalCard.jsx
import { Link } from 'react-router-dom'
import { Calendar, Users, Eye } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { formatDate, truncateText } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function JournalCard({ journal, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link
        to={`/journals/${journal.slug}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-lg hover:border-neutral-200 transition-all duration-300"
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={journal.coverImage}
            alt={journal.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Topic Badge */}
          <div className="absolute top-4 left-4">
            <Badge color={journal.topic?.color} size="sm">
              {journal.topic?.name}
            </Badge>
          </div>

          {/* View Count */}
          <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-white/80 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
            <Eye className="w-3 h-3" />
            {journal.viewCount?.toLocaleString()}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
            {journal.title}
          </h3>

          <p className="mt-2 text-sm text-neutral-500 line-clamp-2">
            {truncateText(journal.abstract, 100)}
          </p>

          {/* Meta */}
          <div className="mt-4 flex items-center gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {journal.authors?.slice(0, 2).join(', ')}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(journal.publicationDate)}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}