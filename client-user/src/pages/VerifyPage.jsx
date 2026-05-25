import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react'
import { subscriberAPI } from '@/services/api'
import Button from '@/components/ui/Button'

export default function VerifyPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('Verification token is missing.')
        return
      }

      try {
        const response = await subscriberAPI.verify(token)

        setStatus('success')
        setMessage(
          response?.message ||
            'Your email has been verified successfully. You are now subscribed.'
        )
      } catch (err) {
        setStatus('error')
        setMessage(
          err.response?.data?.message ||
            'Verification failed. The link may be invalid or expired.'
        )
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <section className="min-h-[70vh] flex items-center justify-center bg-neutral-50 px-4 pt-32 pb-20">
      <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-100 shadow-sm p-8 text-center">
        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          )}

          {status === 'success' && (
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          )}

          {status === 'error' && (
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-neutral-900">
          {status === 'loading' && 'Verifying Email'}
          {status === 'success' && 'Email Verified'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
          {message}
        </p>

        <div className="mt-8">
          <Link to="/">
            <Button icon={Home} iconPosition="left">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}