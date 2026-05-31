import { z } from 'zod'

export const createPartnershipSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  photo: z.string().min(1, 'Photo is required'),

  externalUrl: z.string().optional().default(''),

  isPublished: z.boolean().optional().default(true),

  displayOrder: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return 0
      return Number(val)
    }),
})

export const updatePartnershipSchema = createPartnershipSchema.partial()