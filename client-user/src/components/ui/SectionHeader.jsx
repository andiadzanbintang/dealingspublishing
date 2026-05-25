// src/components/ui/SectionHeader.jsx
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SectionHeader({
  title,
  subtitle,
  linkText,
  linkTo,
  align = 'left',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className={`mb-12 md:mb-16 ${
        align === 'center' ? 'text-center' : 'flex items-end justify-between'
      }`}
    >
      <div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-lg text-neutral-500 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {linkText && linkTo && align !== 'center' && (
        <Link
          to={linkTo}
          className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors group flex-shrink-0"
        >
          {linkText}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </motion.div>
  )
}