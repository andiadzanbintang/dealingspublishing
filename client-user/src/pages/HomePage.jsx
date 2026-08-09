// src/pages/HomePage.jsx
import { Helmet } from 'react-helmet-async'
import HeroSection from '@/components/sections/HeroSection'
import AboutPreviewSection from '@/components/sections/AboutPreviewSection'
import FeaturedJournalsSection from '@/components/sections/FeaturedJournalsSection'
import NewsSection from '@/components/sections/NewsSection'
import EventsSection from '@/components/sections/EventsSection'
import SubscribeSection from '@/components/sections/SubscribeSection'
import BooksSection from '@/components/sections/BooksSection'

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Dealings Publishing — Advancing Research, Transforming Knowledge</title>
        <meta
          name="description"
          content="Dealings Publishing publishes cutting-edge research across multiple disciplines, connecting scholars worldwide."
        />
      </Helmet>

      <HeroSection />
      <AboutPreviewSection />
      <FeaturedJournalsSection />
      <BooksSection />
      <NewsSection />
      <EventsSection />
      <SubscribeSection />
    </>
  )
}