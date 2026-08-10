// src/pages/ParticipantRegisterPage.jsx
import { useState } from 'react'
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { UserPlus, AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useParticipantAuth } from '@/hooks/useParticipantAuth'

const PHONE_PATTERN = /^\+[1-9]\d{0,3}[\s-]?\d[\d\s-]{5,17}$/

export default function ParticipantRegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register: registerAccount, isAuthenticated, isLoading: sessionLoading } =
    useParticipantAuth()

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const redirectTo = location.state?.from || '/my/registrations'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      affiliation: '',
      country: '',
    },
  })

  const passwordValue = watch('password') || ''
  const confirmValue = watch('confirmPassword') || ''
  const passwordsMatch = passwordValue.length > 0 && passwordValue === confirmValue

  if (!sessionLoading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const onSubmit = async (values) => {
    setLoading(true)
    setError('')

    try {
      await registerAccount({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        phone: values.phone.trim(),
        affiliation: values.affiliation.trim(),
        country: values.country.trim(),
      })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not create your account. Please review the form and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  return (
    <>
      <Helmet>
        <title>Create Participant Account — Dealings Publishing</title>
      </Helmet>

      <section className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 pt-28 pb-16">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary-600 rounded-2xl inline-flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-neutral-900">
                Create your participant account
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                One account covers every Dealings Publishing event you join.
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
                  Full name <span className="text-rose-500">*</span>
                </label>
                <input
                  placeholder="Dr. Abdillah Rahman"
                  {...register('name', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name is too short' },
                  })}
                  className={inputClass}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@university.ac.id"
                  {...register('email', { required: 'Email is required' })}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-neutral-400">
                  Your ticket and invoice are sent to this address.
                </p>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Use at least 6 characters' },
                    })}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Retype password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Type the same password again"
                    {...register('confirmPassword', {
                      required: 'Please retype your password',
                      validate: (value) =>
                        value === passwordValue || 'The two passwords do not match',
                    })}
                    className={cn(
                      inputClass,
                      'pr-20',
                      confirmValue.length > 0 &&
                        (passwordsMatch ? 'border-emerald-300' : 'border-rose-300')
                    )}
                  />

                  {confirmValue.length > 0 && (
                    <span className="absolute right-11 top-1/2 -translate-y-1/2">
                      {passwordsMatch ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <X className="w-4 h-4 text-rose-500" />
                      )}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    WhatsApp / Phone
                  </label>
                  <input
                    placeholder="+6281234567890"
                    {...register('phone', {
                      validate: (value) =>
                        !value ||
                        PHONE_PATTERN.test(value) ||
                        'Start with a country code, e.g. +6281234567890',
                    })}
                    className={inputClass}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Country
                  </label>
                  <input
                    placeholder="Indonesia"
                    {...register('country')}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Affiliation
                </label>
                <input
                  placeholder="Universitas Islam Riau"
                  {...register('affiliation')}
                  className={inputClass}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-500">
              Already registered?{' '}
              <Link
                to="/account/login"
                state={location.state}
                className="text-primary-600 font-medium hover:text-primary-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
