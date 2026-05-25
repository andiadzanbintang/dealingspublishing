// src/pages/SettingsPage.jsx
import { useEffect, useState } from 'react'
import { Save, Loader2, RefreshCw } from 'lucide-react'
import ImageUpload from '@/components/ui/ImageUpload'
import { settingsAPI, uploadAPI } from '@/services/api'

// ═══ Moved OUTSIDE the component ═══
function InputField({ label, value, onChange, type = 'text', rows }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {label}
      </label>
      {rows ? (
        <textarea
          value={value}
          onChange={onChange}
          rows={rows}
          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      )}
    </div>
  )
}

const defaultSettings = {
  heroTitle: '',
  heroSubtitle: '',
  heroImage: '',
  aboutUsShort: '',
  aboutUsFull: '',
  mission: '',
  vision: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  linkedinUrl: '',
  twitterUrl: '',
  researchGateUrl: '',
  footerText: '',
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [heroImage, setHeroImage] = useState(null)
  const [settings, setSettings] = useState(defaultSettings)

  const mapBackendToForm = (data) => ({
    heroTitle: data?.heroTitle || '',
    heroSubtitle: data?.heroSubtitle || '',
    heroImage: data?.heroImage || '',
    aboutUsShort: data?.aboutUsShort || '',
    aboutUsFull: data?.aboutUsFull || '',
    mission: data?.mission || '',
    vision: data?.vision || '',
    contactEmail: data?.contactEmail || '',
    contactPhone: data?.contactPhone || '',
    address: data?.address || '',
    linkedinUrl: data?.socialLinks?.linkedin || '',
    twitterUrl: data?.socialLinks?.twitter || '',
    researchGateUrl: data?.socialLinks?.researchGate || '',
    footerText: data?.footerText || '',
  })

  const fetchSettings = async () => {
    setPageLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await settingsAPI.get()
      const data = response?.data

      const mappedSettings = mapBackendToForm(data)
      setSettings(mappedSettings)
      setHeroImage(mappedSettings.heroImage || null)
    } catch (err) {
      console.error('Failed to fetch settings:', err)
      setError(
        err.response?.data?.message ||
          'Failed to load site settings. Please try again.'
      )
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleChange = (key) => (e) => {
    setSettings((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const uploadHeroImageIfNeeded = async () => {
    if (!heroImage) return ''

    // Existing backend image URL
    if (typeof heroImage === 'string') {
      return heroImage
    }

    // New File object from ImageUpload
    if (heroImage instanceof File) {
      const formData = new FormData()
      formData.append('image', heroImage)

      const response = await uploadAPI.uploadImage(
        formData,
        'researchhub/settings'
      )

      return response?.data?.url || ''
    }

    return ''
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const uploadedHeroImage = await uploadHeroImageIfNeeded()

      const payload = {
        heroTitle: settings.heroTitle || '',
        heroSubtitle: settings.heroSubtitle || '',
        heroImage: uploadedHeroImage,
        aboutUsShort: settings.aboutUsShort || '',
        aboutUsFull: settings.aboutUsFull || '',
        mission: settings.mission || '',
        vision: settings.vision || '',
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        address: settings.address || '',
        socialLinks: {
          linkedin: settings.linkedinUrl || '',
          twitter: settings.twitterUrl || '',
          researchGate: settings.researchGateUrl || '',
        },
        footerText: settings.footerText || '',
      }

      const response = await settingsAPI.update(payload)
      const updatedSettings = mapBackendToForm(response?.data)

      setSettings(updatedSettings)
      setHeroImage(updatedSettings.heroImage || null)
      setSuccessMessage('Site settings saved successfully.')
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError(
        err.response?.data?.message ||
          'Failed to save settings. Please check the form and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-neutral-200 p-10">
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Site Settings</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your public website content and configuration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            disabled={loading || pageLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ${pageLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-success-50 border border-success-200 text-success-600 rounded-xl px-4 py-3 text-sm">
          {successMessage}
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-neutral-900">Hero Section</h2>

        <InputField
          label="Hero Title"
          value={settings.heroTitle}
          onChange={handleChange('heroTitle')}
          rows={2}
        />

        <InputField
          label="Hero Subtitle"
          value={settings.heroSubtitle}
          onChange={handleChange('heroSubtitle')}
          rows={2}
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Hero Background Image
          </label>
          <ImageUpload value={heroImage} onChange={setHeroImage} />
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-neutral-900">About Us</h2>

        <InputField
          label="Short Description (Homepage)"
          value={settings.aboutUsShort}
          onChange={handleChange('aboutUsShort')}
          rows={3}
        />

        <InputField
          label="Full About Description"
          value={settings.aboutUsFull}
          onChange={handleChange('aboutUsFull')}
          rows={6}
        />

        <InputField
          label="Mission"
          value={settings.mission}
          onChange={handleChange('mission')}
          rows={2}
        />

        <InputField
          label="Vision"
          value={settings.vision}
          onChange={handleChange('vision')}
          rows={2}
        />
      </div>

      {/* Contact */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-neutral-900">
          Contact Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Email"
            value={settings.contactEmail}
            onChange={handleChange('contactEmail')}
            type="email"
          />

          <InputField
            label="Phone"
            value={settings.contactPhone}
            onChange={handleChange('contactPhone')}
          />
        </div>

        <InputField
          label="Address"
          value={settings.address}
          onChange={handleChange('address')}
        />
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-neutral-900">Social Links</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="LinkedIn URL"
            value={settings.linkedinUrl}
            onChange={handleChange('linkedinUrl')}
          />

          <InputField
            label="Twitter / X URL"
            value={settings.twitterUrl}
            onChange={handleChange('twitterUrl')}
          />

          <InputField
            label="ResearchGate URL"
            value={settings.researchGateUrl}
            onChange={handleChange('researchGateUrl')}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-neutral-900">Footer</h2>

        <InputField
          label="Footer Text"
          value={settings.footerText}
          onChange={handleChange('footerText')}
          rows={2}
        />
      </div>
    </div>
  )
}