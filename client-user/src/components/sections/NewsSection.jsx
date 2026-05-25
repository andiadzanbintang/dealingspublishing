import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import NewsCard from '@/components/ui/NewsCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { mockNews } from '@/data/mockData'
import { newsAPI } from '@/services/api'

import 'swiper/css'
import 'swiper/css/navigation' 

export default function NewsSection() {
  const [featuredNews, setFeaturedNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedNews = async () => {
      try {
        const response = await newsAPI.getFeatured()
        const apiNews = response?.data || []

        if (apiNews.length > 0) {
          setFeaturedNews(apiNews)
        } else {
          setFeaturedNews(mockNews.filter((n) => n.isFeatured))
        }
      } catch (error) {
        console.error('Failed to fetch featured news:', error)
        setFeaturedNews(mockNews.filter((n) => n.isFeatured))
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedNews()
  }, [])

  const newsToDisplay =
    featuredNews.length > 0 ? featuredNews : mockNews.filter((n) => n.isFeatured)

  const mainFeatured = newsToDisplay[0]
  const otherNews = newsToDisplay.slice(1)

  return (
    <section className="section-padding bg-neutral-50">
      <div className="container-custom">
        <SectionHeader
          title="News & Updates"
          subtitle="Stay informed with the latest happenings from our research community."
          linkText="See All News"
          linkTo="/news"
        />

        {loading ? (
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[420px] bg-neutral-100 rounded-3xl animate-pulse" />
            <div className="flex flex-col gap-6">
              <div className="h-[198px] bg-neutral-100 rounded-2xl animate-pulse" />
              <div className="h-[198px] bg-neutral-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mainFeatured && (
                <div className="lg:col-span-2">
                  <NewsCard news={mainFeatured} variant="featured" index={0} />
                </div>
              )}

              <div className="flex flex-col gap-6">
                {otherNews.slice(0, 2).map((news, index) => (
                  <NewsCard key={news._id} news={news} index={index + 1} />
                ))}
              </div>
            </div>

            <div className="md:hidden relative group/carousel">
              <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={16}
                slidesPerView={1.15}
                centeredSlides={false}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                }}
              >
                {newsToDisplay.map((news, index) => (
                  <SwiperSlide key={news._id}>
                    <NewsCard news={news} index={index} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link
            to="/news"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600"
          >
            See All News
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}