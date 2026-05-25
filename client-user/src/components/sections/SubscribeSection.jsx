import { useState } from 'react'
import { Mail, ArrowRight, CheckCircle, Sparkles, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { subscriberAPI } from '@/services/api'

export default function SubscribeSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setMessage('')

    try {
      const response = await subscriberAPI.subscribe({ email })
      setStatus('success')
      setMessage(response?.message || 'Subscribed! Please check your email to verify.')
      setEmail('')

      setTimeout(() => {
        setStatus('idle')
        setMessage('') 
      }, 5000)
    } catch (err) {
      setStatus('error')
      setMessage(
        err.response?.data?.message ||
          'Subscription failed. Please try again later.'
      )
    }
  }

  return (
    <section className="section-padding bg-neutral-50">
      <div className="container-custom">
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-6 py-16 md:px-16 md:py-20 text-center">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles className="w-7 h-7 text-primary-200" />
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Stay Updated with Our Research
              </h2>
              <p className="mt-4 text-lg text-primary-100/80 max-w-xl mx-auto">
                Get notified about new journal publications, upcoming events,
                and the latest research news delivered to your inbox.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    disabled={status === 'loading'}
                    className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-neutral-800 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-70 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 flex-shrink-0"
                >
                  {status === 'loading' && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                  {status === 'success' && <CheckCircle className="w-4 h-4" />}
                  {status === 'error' && <AlertCircle className="w-4 h-4" />}
                  {status === 'idle' && 'Subscribe'}
                  {status === 'loading' && 'Subscribing...'}
                  {status === 'success' && 'Subscribed'}
                  {status === 'error' && 'Try Again'}
                  {status === 'idle' && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              {message && (
                <p className="mt-4 text-sm text-primary-100">
                  {message}
                </p>
              )}

              <p className="mt-4 text-xs text-primary-200/50">
                No spam, ever. Unsubscribe at any time. We respect your privacy.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}