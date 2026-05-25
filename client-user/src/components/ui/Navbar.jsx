// src/components/layout/Navbar.jsx
import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Search, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Journals', path: '/journals' },
  { name: 'Books', path: '/books' },
  { name: 'News', path: '/news' },
  { name: 'Events', path: '/events' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  // Track scroll for navbar style change
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileOpen])

  const isHomePage = location.pathname === '/'

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled || !isHomePage
            ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-neutral-100'
            : 'bg-transparent'
        )}
      >
        <nav className="container-custom">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* ═══ Logo ═══ */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span
                className={cn(
                  'text-xl font-bold tracking-tight transition-colors',
                  isScrolled || !isHomePage
                    ? 'text-neutral-900'
                    : 'text-white'
                )}
              >
                Design Publishing
              </span>
            </Link>

            {/* ═══ Desktop Nav Links ═══ */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? isScrolled || !isHomePage
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-white bg-white/20'
                        : isScrolled || !isHomePage
                        ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    )
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>

            {/* ═══ Right Actions ═══ */}
            <div className="flex items-center gap-2">
              <button
                className={cn(
                  'p-2.5 rounded-xl transition-all duration-200',
                  isScrolled || !isHomePage
                    ? 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Mobile menu toggle */}
              <button
                className={cn(
                  'md:hidden p-2.5 rounded-xl transition-all duration-200',
                  isScrolled || !isHomePage
                    ? 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle menu"
              >
                {isMobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ═══ Mobile Menu Overlay ═══ */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-5 border-b border-neutral-100">
                  <span className="text-lg font-bold text-neutral-900">Menu</span>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Links */}
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex flex-col gap-1">
                    {navLinks.map((link) => (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                          cn(
                            'px-4 py-3 rounded-xl text-base font-medium transition-all',
                            isActive
                              ? 'text-primary-600 bg-primary-50'
                              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                          )
                        }
                      >
                        {link.name}
                      </NavLink>
                    ))}
                  </div>
                </div>

                {/* Mobile Footer */}
                <div className="p-5 border-t border-neutral-100">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    Ask AI Assistant
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}