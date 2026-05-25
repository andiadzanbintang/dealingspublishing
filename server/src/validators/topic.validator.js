// src/validators/topic.validator.js
import { z } from 'zod'

export const createTopicSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().default(''),
  icon: z.string().optional().default('📄'),
  color: z.string().optional().default('#6366F1'),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
})

export const updateTopicSchema = createTopicSchema.partial()