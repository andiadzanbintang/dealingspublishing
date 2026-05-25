// src/validators/event.validator.js
import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().default(''),
  content: z.string().optional().default(''),
  coverImage: z.string().optional().default(''),
  eventDate: z.string().min(1, 'Event date is required'),
  endDate: z.string().optional().nullable(),
  location: z.string().optional().default(''),
  locationType: z.enum(['in-person', 'virtual', 'hybrid']).optional().default('in-person'),
  eventType: z.enum(['conference', 'webinar', 'workshop', 'seminar']).optional().default('conference'),
  externalUrl: z.string().optional().default(''),
  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
})

export const updateEventSchema = createEventSchema.partial()