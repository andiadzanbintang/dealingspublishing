// src/components/ui/RoleRoute.jsx
import { Navigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/**
 * Route guard for pages a reviewer must never reach. A reviewer's sidebar
 * already hides these links, but the routes have to be closed too — the server
 * enforces the same rules, this is just so the UI fails honestly instead of
 * rendering an empty screen full of 403s.
 */
export default function RoleRoute({ allow = ['superadmin', 'editor'], children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (!user) return <Navigate to="/login" replace />

  if (!allow.includes(user.role)) {
    return (
      <div className="max-w-xl mx-auto mt-10 bg-white rounded-xl border border-neutral-200 p-10 text-center">
        <div className="w-12 h-12 rounded-xl bg-warning-50 inline-flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-warning-600" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-neutral-900">
          This section is not available to your account
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Your reviewer account covers the events assigned to you. Ask a
          superadmin if you need broader access.
        </p>
      </div>
    )
  }

  return children
}
