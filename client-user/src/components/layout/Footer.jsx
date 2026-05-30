import { Link } from 'react-router-dom'
import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { subscriberAPI, siteAPI, topicAPI } from '@/services/api'
import { mockSettings, mockTopics } from '@/data/mockData'

const LinkedinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const TwitterXIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const quickLinks = [
  { name: 'Home', path: '/' },
  { name: 'About Us', path: '/about' },
  { name: 'Journals', path: '/journals' },
  { name: 'News', path: '/news' },
  { name: 'Events', path: '/events' },
  { name: 'Books', path: '/books' },
  { name: 'Partnerships', path: '/partnerships' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState('idle')
  const [subscribeMessage, setSubscribeMessage] = useState('')
  const [settings, setSettings] = useState(mockSettings)
  const [topics, setTopics] = useState(mockTopics)

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const [settingsResponse, topicsResponse] = await Promise.allSettled([
          siteAPI.getSettings(),
          topicAPI.getAll(),
        ])

        if (settingsResponse.status === 'fulfilled' && settingsResponse.value?.data) {
          setSettings(settingsResponse.value.data)
        }

        if (topicsResponse.status === 'fulfilled' && topicsResponse.value?.data?.length > 0) {
          setTopics(topicsResponse.value.data)
        }
      } catch (err) {
        console.error('Failed to fetch footer data:', err)
      }
    }

    fetchFooterData()
  }, [])

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email) return

    setSubscribeStatus('loading')
    setSubscribeMessage('')

    try {
      const response = await subscriberAPI.subscribe({ email })

      setSubscribeStatus('success')
      setSubscribeMessage(response?.message || 'Please check your email to verify.')
      setEmail('')

      setTimeout(() => {
        setSubscribeStatus('idle')
        setSubscribeMessage('')
      }, 5000)
    } catch (err) {
      setSubscribeStatus('error')
      setSubscribeMessage(
        err.response?.data?.message ||
          'Subscription failed. Please try again later.'
      )
    }
  }

  const socialLinks = settings.socialLinks || {}

  return (
    <footer className="bg-neutral-900 text-white">
      <div className="border-b border-neutral-800">
        <div className="container-custom py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                Stay Updated
              </h3>
              <p className="mt-2 text-neutral-400 max-w-md">
                Subscribe to receive the latest research news, journal releases,
                and event updates.
              </p>
            </div>

            <div className="w-full md:w-auto">
              <form
                onSubmit={handleSubscribe}
                className="flex w-full md:w-auto gap-3"
              >
                <div className="relative flex-1 md:w-80">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={subscribeStatus === 'loading'}
                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={subscribeStatus === 'loading'}
                  className="px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 flex-shrink-0 disabled:opacity-60"
                >
                  {subscribeStatus === 'loading' && 'Sending...'}
                  {subscribeStatus === 'success' && '✓ Sent'}
                  {subscribeStatus === 'error' && 'Try Again'}
                  {subscribeStatus === 'idle' && 'Subscribe'}
                  {subscribeStatus === 'idle' && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              {subscribeMessage && (
                <p
                  className={`mt-3 text-xs ${
                    subscribeStatus === 'error'
                      ? 'text-red-300'
                      : 'text-neutral-400'
                  }`}
                >
                  {subscribeMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold tracking-tight">
                Dealings Publishing
              </span>
            </Link>

            <p className="mt-4 text-sm text-neutral-400 leading-relaxed">
              {settings.footerText ||
                settings.aboutUsShort ||
                'Fosters creativity and expertise through global knowledge while promoting a scientific culture in society.'}
            </p>

            <div className="flex items-center gap-3 mt-6">
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"
                  aria-label="LinkedIn"
                >
                  <LinkedinIcon />
                </a>
              )}

              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"
                  aria-label="Twitter / X"
                >
                  <TwitterXIcon />
                </a>
              )}

              {socialLinks.researchGate && (
                <a
                  href={socialLinks.researchGate}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"
                  aria-label="ResearchGate"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 mb-5">
              Journals
            </h4>
            <ul className="space-y-3">
              {topics.slice(0, 5).map((topic) => (
                <li key={topic._id}>
                  <Link
                    to={`/journals?topic=${topic.slug}`}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {topic.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 mb-5">
              Contact
            </h4>
            <ul className="space-y-4">
              {settings.contactEmail && (
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {settings.contactEmail}
                  </a>
                </li>
              )}

              {settings.contactPhone && (
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {settings.contactPhone}
                  </a>
                </li>
              )}

              {settings.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-neutral-400">
                    {settings.address}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-800">
        <div className="container-custom py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Dealings Publishing. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}