// src/components/sections/HeroSection.jsx
import { useEffect, useState } from 'react'
import { ArrowRight, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import { siteAPI } from '@/services/api'

const defaultHero = {
  heroTitle: 'Advancing Research, Transforming Knowledge',
  heroSubtitle:
    'We publish cutting-edge research across multiple disciplines, connecting scholars worldwide and driving innovation forward.',
  heroImage:
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
}

export default function HeroSection() {
  const [hero, setHero] = useState(defaultHero)

  const renderStyledTitle = (title) => {
  const words = title.split(' ')
  const middleIndex = Math.floor(words.length / 2)

  return words.map((word, index) => {
    if (index === middleIndex) {
      return (
        <span
          key={index}
          className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500"
        >
          {word}{' '}
        </span>
      )
    }

    return <span key={index}>{word} </span>
  })
}
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await siteAPI.getSettings()
        const settings = response?.data

        if(settings) {
          setHero({
            heroTitle: settings.heroTitle || defaultHero.heroTitle,
            heroSubtitle: settings.heroSubtitle || defaultHero.heroSubtitle,
            heroImage: settings.heroImage || defaultHero.heroImage,
          })
        }

      } catch (error) {
        console.error('Failed to fetch site settings:', error)
      }
    }

    fetchSettings()
  }, [])


  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* ═══ Background ═══ */}
      <div className="absolute inset-0">
        <img
          src={hero.heroImage}
          alt="Research Background"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/90 via-neutral-900/70 to-neutral-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent" />
      </div>

      {/* ═══ Animated Background Elements ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl"
        />
      </div>

      {/* ═══ Content ═══ */}
      <div className="relative container-custom pt-32 pb-20">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-sm text-white/80 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Now publishing 2025 editions
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]"
          >
            {renderStyledTitle(hero.heroTitle)}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed"
          >
            {hero.heroSubtitle}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link to="/journals">
              <Button size="lg" icon={ArrowRight}>
                Explore Journals
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="white" size="lg" icon={Play} iconPosition="left">
                Learn More
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-16 flex flex-wrap gap-12"
          >
            {[
              { value: '500+', label: 'Published Journals' },
              { value: '120+', label: 'Global Researchers' },
              { value: '25+', label: 'Research Topics' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ═══ Scroll Indicator ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
        >
          <div className="w-1 h-2 bg-white/60 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  )
}