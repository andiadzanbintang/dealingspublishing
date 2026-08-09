// src/pages/ParticipantLoginPage.jsx
import { useState } from 'react'
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useParticipantAuth } from '@/hooks/useParticipantAuth'

export default function ParticipantLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading: sessionLoading } = useParticipantAuth()

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = location.state?.from || '/my/registrations'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '' } })

  if (!sessionLoading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const onSubmit = async (values) => {
    setLoading(true)
    setError('')

    try {
      await login(values.email.trim().toLowerCase(), values.password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not sign you in. Please check your email and password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Participant Login — Dealings Publishing</title>
      </Helmet>

      <section className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 pt-28 pb-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary-600 rounded-2xl inline-flex items-center justify-center">
                <LogIn className="w-5 h-5 text-white" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-neutral-900">
                Participant sign in
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                Access your event registrations, payment status and e-ticket.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@university.ac.id"
                    {...register('email', { required: 'Email is required' })}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password', { required: 'Password is required' })}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-500">
              Don&apos;t have an account yet?{' '}
              <Link
                to="/account/register"
                state={location.state}
                className="text-primary-600 font-medium hover:text-primary-700"
              >
                Create one
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-neutral-400">
            This account is for event participants. Organisers sign in through
            the admin dashboard.
          </p>
        </div>
      </section>
    </>
  )
}
