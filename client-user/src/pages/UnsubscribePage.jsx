// src/pages/UnsubscribePage.jsx
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CheckCircle, XCircle, Loader2, Home, MailX } from 'lucide-react'
import Button from '@/components/ui/Button'
import { subscriberAPI } from '@/services/api'

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('Processing your unsubscribe request...')

  useEffect(() => {
    const unsubscribe = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('Unsubscribe token is missing.')
        return
      }

      try {
        const response = await subscriberAPI.unsubscribe(token)

        setStatus('success')
        setMessage(
          response?.message ||
            'You have been unsubscribed successfully. You will no longer receive email updates.'
        )
      } catch (error) {
        setStatus('error')
        setMessage(
          error.response?.data?.message ||
            'Unsubscribe failed. The link may be invalid or expired.'
        )
      }
    }

    unsubscribe()
  }, [searchParams])

  return (
    <>
      <Helmet>
        <title>Unsubscribe — Dealings Publishing</title>
        <meta
          name="description"
          content="Unsubscribe from Dealings Publishing email updates."
        />
      </Helmet>

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

          <div className="flex justify-center mb-4">
            <MailX className="w-5 h-5 text-neutral-400" />
          </div>

          <h1 className="text-2xl font-bold text-neutral-900">
            {status === 'loading' && 'Unsubscribing'}
            {status === 'success' && 'Unsubscribed'}
            {status === 'error' && 'Unsubscribe Failed'}
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
    </>
  )
}