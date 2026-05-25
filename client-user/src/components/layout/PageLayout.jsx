// src/components/layout/PageLayout.jsx
import Navbar from '../ui/Navbar'
import Footer from './Footer'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'

export default function PageLayout({ children }) {
  const { pathname } = useLocation()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
