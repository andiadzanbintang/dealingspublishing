// src/components/sections/FeaturedJournalsSection.jsx
import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import JournalCard from '@/components/ui/JournalCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { mockJournals } from '@/data/mockData'
import { journalAPI } from '@/services/api'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default function FeaturedJournalsSection() {
  const [featuredJournals, setFeaturedJournals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedJournals = async () => {
      try {
        const response = await journalAPI.getFeatured()
        const apiJournals = response?.data || []

        if (apiJournals.length > 0) {
          setFeaturedJournals(apiJournals)
        } else {
          setFeaturedJournals(mockJournals.filter((j) => j.isFeatured))
        }
      } catch (error) {
        console.error('Failed to fetch featured journals:', error)
        setFeaturedJournals(mockJournals.filter((j) => j.isFeatured))
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedJournals()
  }, [])

  const journalsToDisplay = featuredJournals.length > 0
    ? featuredJournals
    : mockJournals.filter((j) => j.isFeatured)

  return (
    <section className="section-padding bg-neutral-50">
      <div className="container-custom">
        <SectionHeader
          title="Latest Journals"
          subtitle="Explore our most recent peer-reviewed publications across various disciplines."
          linkText="View All Journals"
          linkTo="/journals"
        />

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
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
        ) : (
          <>
            <div className="relative group/carousel">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={24}
                slidesPerView={1}
                navigation={{
                  prevEl: '.journals-prev',
                  nextEl: '.journals-next',
                }}
                pagination={{
                  clickable: true,
                  el: '.journals-pagination',
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
                {journalsToDisplay.map((journal, index) => (
                  <SwiperSlide key={journal._id}>
                    <JournalCard journal={journal} index={index} />
                  </SwiperSlide>
                ))}
              </Swiper>

              <button
                className="journals-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-11 h-11 bg-white rounded-full shadow-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-200 transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-30"
                aria-label="Previous"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                className="journals-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-11 h-11 bg-white rounded-full shadow-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-200 transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-30"
                aria-label="Next"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="journals-pagination flex items-center justify-center gap-2 mt-8" />
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link
                to="/journals"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600"
              >
                View All Journals
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}