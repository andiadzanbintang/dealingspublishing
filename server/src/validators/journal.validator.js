// src/validators/journal.validator.js
import { z } from 'zod'

export const createJournalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  topicId: z.string().min(1, 'Topic is required'),
  authors: z.array(z.string()).optional().default([]),
  abstract: z.string().optional().default(''),
  content: z.string().optional().default(''),
  coverImage: z.string().optional().default(''),
  issn: z.string().optional().default(''),
  eissn: z.string().optional().default(''),
  volume: z.string().optional().default(''),
  issue: z.string().optional().default(''),
  pages: z.string().optional().default(''),
  doi: z.string().optional().default(''),
  keywords: z.array(z.string()).optional().default([]),
  publicationDate: z.string().optional().nullable(),
  externalUrl: z.string().optional().default(''),
  pdfUrl: z.string().optional().default(''),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  isFeatured: z.boolean().optional().default(false),
})

export const updateJournalSchema = createJournalSchema.partial()