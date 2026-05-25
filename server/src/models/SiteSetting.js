// src/models/SiteSetting.js
import mongoose from 'mongoose'

const siteSettingSchema = new mongoose.Schema(
  {
    heroTitle: { type: String, default: 'Advancing Research, Transforming Knowledge' },
    heroSubtitle: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    aboutUsShort: { type: String, default: '' },
    aboutUsFull: { type: String, default: '' },
    mission: { type: String, default: '' },
    vision: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    address: { type: String, default: '' },
    socialLinks: {
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      researchGate: { type: String, default: '' },
    },
    footerText: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.model('SiteSetting', siteSettingSchema)