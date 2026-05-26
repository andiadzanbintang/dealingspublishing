// src/validators/book.validator.js
import { z } from 'zod'

export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),

  subtitle: z.string().optional().default(''),

  writers: z.array(z.string()).min(1, 'At least one writer is required'),
  editor: z.string().min(1, 'Editor is required'),
  publishedBy: z.string().min(1, 'Publisher is required'),

  isbn: z.string().min(1, 'ISBN is required'),

  description: z.string().min(1, 'Description is required'),
  content: z.string().optional().default(''),

  coverImage: z.string().min(1, 'Cover image is required'),

  publicationYear: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return null
      return Number(val)
    }),

  publicationDate: z.string().optional().nullable(),

  language: z.string().optional().default(''),
  edition: z.string().optional().default(''),
  pages: z.string().optional().default(''),
  category: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),

  externalUrl: z.string().optional().default(''),
  pdfUrl: z.string().optional().default(''),

  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),

  price: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return null
      return Number(value)
    },
    z.number().min(0).nullable().optional()
  ),

  priceCurrency: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .default('IDR')
    .optional(),
})

export const updateBookSchema = createBookSchema.partial()