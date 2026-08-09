// src/seed/seedEventRegistration.js
//
// Turns registration on for the ICUCE'26 conference and fills in the config
// exactly as specified in revisi/FiturEvent.md.
//
//   npm run seed:registration                  → matches the ICUCE event by slug/title
//   npm run seed:registration -- <event-slug>  → target a specific event
//
// Safe to re-run: it only writes the `registration` sub-document.

import 'dotenv/config'
import mongoose from 'mongoose'
import Event from '../models/Event.js'

const TARGET_SLUG = process.argv[2] || null

const ICUCE_LOCATION =
  'Gedung Fisipol Lantai 2, Fakultas Ilmu Sosial dan Ilmu Politik, Universitas Islam Riau, ' +
  'Jl. Kaharuddin Nasution No. 113, Pekanbaru 28284, Indonesia'

const registrationConfig = {
  enabled: true,
  ctaLabel: 'Register Event',
  opensAt: null,
  closesAt: null,
  requireManuscript: true,
  requireAbstractFile: true,

  // Prices exactly as written in the specification.
  fees: [
    {
      role: 'presenter',
      mode: 'offline',
      label: 'Presenter — Offline attendance',
      amountIdr: 1800000,
      amountUsd: 100,
    },
    {
      role: 'presenter',
      mode: 'online',
      label: 'Presenter — Online attendance',
      amountIdr: 2700000,
      amountUsd: 150,
    },
    {
      role: 'participant',
      mode: 'offline',
      label: 'Participant — Offline attendance',
      amountIdr: 270000,
      amountUsd: 15,
    },
    {
      role: 'participant',
      mode: 'online',
      label: 'Participant — Online attendance',
      amountIdr: 270000,
      amountUsd: 15,
    },
  ],

  outputTypes: [
    { value: 'book-series-scopus', label: 'Book Series (Scopus indexed)' },
    { value: 'journal-nasional-sinta', label: 'National Journal (SINTA accredited)' },
  ],

  keywordsMin: 3,
  keywordsMax: 5,
  maxAbstractSizeMb: 15,
  maxFullPaperSizeMb: 25,

  abstractDeadline: null,
  fullPaperDeadline: new Date('2026-11-10T23:59:59+07:00'),

  paymentMethods: {
    manual: true,
    gateway: false,
    gatewayNote:
      'Online payment gateway is still awaiting licensing approval. Please use manual bank transfer for now.',
  },

  bank: {
    accountNumber: '7339645897',
    accountName: 'FAKULTAS FISIPOL UIR',
    bankName: 'Bank Syariah Indonesia (BSI)',
    swiftCode: '',
    branch: '',
  },

  ticketPrefix: 'ICUCE26',
  invoicePrefix: 'INV/ICUCE26',

  // Replace both with the real links when they are ready.
  whatsappGroupUrl: 'https://chat.whatsapp.com/REPLACE-WITH-REAL-GROUP-LINK',
  fullPaperUploadUrl: '',

  contactEmail: '',
  contactWhatsapp: '',

  instructions:
    'Submit your abstract first (PDF or Microsoft Word). The committee reviews every abstract before the payment step opens. Full chapter submissions are due 10 November 2026.',
}

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Check server/.env')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  const query = TARGET_SLUG
    ? { slug: TARGET_SLUG.toLowerCase() }
    : { $or: [{ slug: /icuce/i }, { title: /ICUCE/i }] }

  const event = await Event.findOne(query)

  if (!event) {
    console.error(
      TARGET_SLUG
        ? `No event found with slug "${TARGET_SLUG}".`
        : 'No ICUCE event found. Create the event in the admin panel first, then re-run with its slug:\n  npm run seed:registration -- <event-slug>'
    )
    await mongoose.disconnect()
    process.exit(1)
  }

  event.registration = registrationConfig

  if (!event.location || /^\s*$/.test(event.location)) {
    event.location = ICUCE_LOCATION
  }

  await event.save()

  console.log(`Registration enabled for: ${event.title}`)
  console.log(`  slug           : ${event.slug}`)
  console.log(`  fees           : ${registrationConfig.fees.length} tiers`)
  console.log(`  bank           : ${registrationConfig.bank.bankName} / ${registrationConfig.bank.accountNumber}`)
  console.log(`  full paper due : 10 November 2026`)
  console.log('\nRemember to replace the placeholder WhatsApp group link in the admin panel.')

  await mongoose.disconnect()
  process.exit(0)
}

run().catch(async (error) => {
  console.error(error)
  await mongoose.disconnect()
  process.exit(1)
})
