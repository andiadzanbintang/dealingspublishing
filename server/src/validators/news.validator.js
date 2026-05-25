// src/validators/news.validator.js
import { z } from 'zod'

export const createNewsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional().default(''),
  content: z.string().optional().default(''),
  coverImage: z.string().optional().default(''),
  category: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
  publishedAt: z.string().optional().nullable(),
})

export const updateNewsSchema = createNewsSchema.partial()