// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  Menu,
  X,
  Search,
  MessageCircle,
  User,
  Ticket,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useParticipantAuth } from '@/hooks/useParticipantAuth'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Journals', path: '/journals' },
  { name: 'Books', path: '/books' },
  { name: 'News', path: '/news' },
  { name: 'Events', path: '/events' },
  { name: 'Partnerships', path: '/partnerships' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const accountRef = useRef(null)
  const location = useLocation()

  const { isAuthenticated, participant, logout } = useParticipantAuth()

  // Track scroll for navbar style change
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setIsMobileOpen(false)
    setIsAccountOpen(false)
  }, [location.pathname])

  // Close the account dropdown when clicking outside
  useEffect(() => {
    const handleClick = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setIsAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileOpen])

  const isHomePage = location.pathname === '/'
  const solid = isScrolled || !isHomePage

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          solid
            ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-neutral-100'
            : 'bg-transparent'
        )}
      >
        <nav className="container-custom">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* ═══ Logo ═══ */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-white/90 shadow-sm">
                <img
                  src="/dealingsPublishingLogo.svg"
                  alt="Dealings Publishing"
                  className="w-full h-full object-contain"
                />
              </div>
              <span
                className={cn(
                  'text-xl font-bold tracking-tight transition-colors',
                  solid ? 'text-neutral-900' : 'text-white'
                )}
              >
                Dealings Publishing
              </span>
            </Link>

            {/* ═══ Desktop Nav Links ═══ */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? solid
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-white bg-white/20'
                        : solid
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
                  solid
                    ? 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Participant account */}
              {isAuthenticated ? (
                <div className="relative hidden sm:block" ref={accountRef}>
                  <button
                    onClick={() => setIsAccountOpen((open) => !open)}
                    className={cn(
                      'flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      solid
                        ? 'text-neutral-700 hover:bg-neutral-100'
                        : 'text-white/90 hover:bg-white/10'
                    )}
                  >
                    <span className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(participant?.name || '?').charAt(0).toUpperCase()}
                    </span>
                    <span className="max-w-[110px] truncate">
                      {participant?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <AnimatePresence>
                    {isAccountOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-neutral-100">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {participant?.name}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {participant?.email}
                          </p>
                        </div>

                        <Link
                          to="/my/registrations"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                          <Ticket className="w-4 h-4 text-neutral-400" />
                          My Registrations
                        </Link>

                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors border-t border-neutral-100"
                        >
                          <LogOut className="w-4 h-4 text-neutral-400" />
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/account/login"
                  className={cn(
                    'hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    solid
                      ? 'text-neutral-700 hover:bg-neutral-100'
                      : 'text-white/90 hover:bg-white/10'
                  )}
                >
                  <User className="w-4 h-4" />
                  Sign in
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                className={cn(
                  'lg:hidden p-2.5 rounded-xl transition-all duration-200',
                  solid
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
            className="fixed inset-0 z-40 lg:hidden"
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

                  {/* Participant account */}
                  <div className="mt-6 pt-6 border-t border-neutral-100">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 pb-3">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {participant?.name}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {participant?.email}
                          </p>
                        </div>
                        <Link
                          to="/my/registrations"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-neutral-600 hover:bg-neutral-50"
                        >
                          <Ticket className="w-4 h-4 text-neutral-400" />
                          My Registrations
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-neutral-600 hover:bg-neutral-50"
                        >
                          <LogOut className="w-4 h-4 text-neutral-400" />
                          Sign out
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <Link
                          to="/account/login"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-neutral-600 hover:bg-neutral-50"
                        >
                          <User className="w-4 h-4 text-neutral-400" />
                          Sign in
                        </Link>
                        <Link
                          to="/account/register"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-primary-600 hover:bg-primary-50"
                        >
                          <Ticket className="w-4 h-4" />
                          Create participant account
                        </Link>
                      </div>
                    )}
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
