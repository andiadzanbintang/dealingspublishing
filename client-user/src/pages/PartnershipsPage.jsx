import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Handshake, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { partnershipAPI } from '@/services/api'

export default function PartnershipsPage() {
  const [partnerships, setPartnerships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPartnerships = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await partnershipAPI.getAll({
        limit: 100,
        sort: 'displayOrder,-createdAt',
      })

      setPartnerships(response?.data || [])
    } catch (err) {
      console.error('Failed to fetch partnerships:', err)
      setError(
        err.response?.data?.message ||
          'Failed to load partnerships. Please try again later.'
      )
      setPartnerships([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartnerships()
  }, [])

  return (
    <>
      <Helmet>
        <title>Partnerships — Dealings Publishing</title>
        <meta
          name="description"
          content="Explore Dealings Publishing partnerships and collaborations."
        />
      </Helmet>

      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-neutral-900 text-white">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm text-neutral-300 mb-5">
              <Handshake className="w-4 h-4" />
              Partnerships
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Our Partnerships
            </h1>

            <p className="mt-5 text-lg text-neutral-300 leading-relaxed">
              We collaborate with institutions, organizations, and communities
              to advance knowledge, research, and publishing impact.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-neutral-50">
        <div className="container-custom">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">
                Partnership Network
              </h2>
              <p className="mt-1 text-neutral-500">
                Organizations and collaborators connected with Dealings Publishing.
              </p>
            </div>

            <Button
              variant="outline"
              icon={RefreshCw}
              iconPosition="left"
              onClick={fetchPartnerships}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          {error && (
            <div className="mb-8 bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-2xl border border-neutral-100 p-6 animate-pulse"
                >
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 mb-5" />
                  <div className="h-5 bg-neutral-100 rounded w-2/3 mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 bg-neutral-100 rounded w-full" />
                    <div className="h-3 bg-neutral-100 rounded w-5/6" />
                    <div className="h-3 bg-neutral-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : partnerships.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {partnerships.map((partnership, index) => (
                <motion.article
                  key={partnership._id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm hover:shadow-lg hover:border-neutral-200 transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-neutral-100 flex items-center justify-center mb-5">
                    {partnership.photo ? (
                      <img
                        src={partnership.photo}
                        alt={partnership.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Handshake className="w-7 h-7 text-neutral-400" />
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-neutral-900">
                    {partnership.name}
                  </h3>

                  <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
                    {partnership.description}
                  </p>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-neutral-100 p-12 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Handshake className="w-7 h-7 text-neutral-400" />
              </div>

              <h2 className="text-xl font-bold text-neutral-900">
                No partnerships yet
              </h2>

              <p className="mt-2 text-neutral-500 max-w-md mx-auto">
                Partnership information will be displayed here once available.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}