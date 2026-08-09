// src/components/ui/ParticipantRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useParticipantAuth } from '@/hooks/useParticipantAuth'

/**
 * Gate for participant-only pages. Remembers where the visitor was heading so
 * the login page can send them straight back after signing in.
 */
export default function ParticipantRoute({ children }) {
  const { isLoading, isAuthenticated } = useParticipantAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-neutral-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-neutral-500 text-sm">Checking your session…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/account/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  return children
}
