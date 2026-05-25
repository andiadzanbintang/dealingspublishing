// src/seed/seed.js
import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import User from '../models/User.js'
import Topic from '../models/Topic.js'
import SiteSetting from '../models/SiteSetting.js'
import { logger } from '../config/logger.js'

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    logger.info('Connected to MongoDB for seeding')

    // ═══ SEED SUPERADMIN ═══
    const existingAdmin = await User.findOne({ email: 'admin@researchhub.com' })
    if (!existingAdmin) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@researchhub.com',
        password: 'Admin@123456',
        role: 'superadmin',
      })
      logger.info('✅ Superadmin created: admin@researchhub.com / Admin@123456')
    } else {
      logger.info('Superadmin already exists')
    }

    // ═══ SEED TOPICS ═══
    const topicsData = [
      { name: 'Computer Science', slug: 'computer-science', icon: '💻', color: '#3B82F6', sortOrder: 1 },
      { name: 'Mathematics', slug: 'mathematics', icon: '📐', color: '#8B5CF6', sortOrder: 2 },
      { name: 'Physics', slug: 'physics', icon: '⚛️', color: '#06B6D4', sortOrder: 3 },
      { name: 'Biology', slug: 'biology', icon: '🧬', color: '#10B981', sortOrder: 4 },
      { name: 'Chemistry', slug: 'chemistry', icon: '🧪', color: '#F59E0B', sortOrder: 5 },
      { name: 'Engineering', slug: 'engineering', icon: '⚙️', color: '#EF4444', sortOrder: 6 },
      { name: 'Medicine', slug: 'medicine', icon: '🩺', color: '#EC4899', sortOrder: 7 },
      { name: 'Environmental Science', slug: 'environmental-science', icon: '🌍', color: '#22C55E', sortOrder: 8 },
      { name: 'Social Sciences', slug: 'social-sciences', icon: '👥', color: '#F97316', sortOrder: 9 },
      { name: 'Economics', slug: 'economics', icon: '📊', color: '#6366F1', sortOrder: 10 },
    ]

    for (const topic of topicsData) {
      await Topic.findOneAndUpdate({ slug: topic.slug }, topic, { upsert: true, new: true })
    }
    logger.info(`✅ ${topicsData.length} topics seeded`)

    // ═══ SEED SITE SETTINGS ═══
    const existingSettings = await SiteSetting.findOne()
    if (!existingSettings) {
      await SiteSetting.create({
        heroTitle: 'Advancing Research, Transforming Knowledge',
        heroSubtitle:
          'A leading platform for publishing, discovering, and sharing cutting-edge research across disciplines.',
        aboutUsShort:
          'ResearchHub is dedicated to advancing scientific knowledge through accessible, high-quality academic publishing.',
        mission:
          'To democratize access to research and provide a platform where knowledge knows no boundaries.',
        vision:
          'A world where every researcher has the tools and platform to share their discoveries with the global community.',
        contactEmail: 'contact@researchhub.com',
        contactPhone: '+1 (555) 123-4567',
        address: '123 Research Avenue, Science City, SC 12345',
        socialLinks: {
          linkedin: 'https://linkedin.com/company/researchhub',
          twitter: 'https://twitter.com/researchhub',
          researchGate: 'https://researchgate.net/researchhub',
        },
        footerText: '© 2025 ResearchHub. All rights reserved.',
      })
      logger.info('✅ Site settings seeded')
    } else {
      logger.info('Site settings already exist')
    }

    logger.info('🎉 Seed complete!')
    process.exit(0)
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`)
    process.exit(1)
  }
}

seed()