// src/components/layout/TopBar.jsx
import {
  Search,
  Bell,
  LogOut,
  ChevronDown,
  User,
  Loader2,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'

export default function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left — Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications — placeholder for now */}
        <button
          type="button"
          disabled
          title="Notifications are not available yet"
          className="relative p-2 rounded-lg text-neutral-300 cursor-not-allowed transition-all"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-neutral-100 transition-all"
          >
            <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'Admin'}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                getInitials(user?.name || 'Admin')
              )}
            </div>

            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-neutral-800 leading-none">
                {user?.name || 'Admin'}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {user?.role || 'admin'}
              </p>
            </div>

            <ChevronDown className="w-4 h-4 text-neutral-400 hidden md:block" />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-neutral-100">
                <p className="text-sm font-medium text-neutral-800">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-neutral-500">
                  {user?.email || 'No email'}
                </p>
              </div>

              <button
                type="button"
                disabled
                title="Profile page is not available yet"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-300 cursor-not-allowed transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger-500 hover:bg-danger-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}