// src/validators/event.validator.js
import { z } from 'zod'

const feeSchema = z.object({
  role: z.enum(['presenter', 'participant']),
  mode: z.enum(['online', 'offline']),
  label: z.string().optional().default(''),
  amountIdr: z.coerce.number().min(0).optional().default(0),
  amountUsd: z.coerce.number().min(0).optional().default(0),
})

const outputTypeSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
})

const nullableDate = z.string().optional().nullable()

export const registrationConfigSchema = z
  .object({
    enabled: z.boolean().optional().default(false),
    ctaLabel: z.string().optional().default('Register Event'),
    opensAt: nullableDate,
    closesAt: nullableDate,
    requireManuscript: z.boolean().optional().default(true),
    requireAbstractFile: z.boolean().optional().default(true),
    fees: z.array(feeSchema).optional().default([]),
    outputTypes: z.array(outputTypeSchema).optional().default([]),
    keywordsMin: z.coerce.number().min(0).optional().default(3),
    keywordsMax: z.coerce.number().min(1).optional().default(5),
    maxAbstractSizeMb: z.coerce.number().min(1).max(50).optional().default(15),
    maxFullPaperSizeMb: z.coerce.number().min(1).max(50).optional().default(25),
    abstractDeadline: nullableDate,
    fullPaperDeadline: nullableDate,
    paymentMethods: z
      .object({
        manual: z.boolean().optional().default(true),
        gateway: z.boolean().optional().default(false),
        gatewayNote: z.string().optional(),
      })
      .optional(),
    bank: z
      .object({
        accountNumber: z.string().optional().default(''),
        accountName: z.string().optional().default(''),
        bankName: z.string().optional().default(''),
        swiftCode: z.string().optional().default(''),
        branch: z.string().optional().default(''),
      })
      .optional(),
    ticketPrefix: z.string().optional().default('REG'),
    invoicePrefix: z.string().optional().default('INV'),
    whatsappGroupUrl: z.string().optional().default(''),
    fullPaperUploadUrl: z.string().optional().default(''),
    contactEmail: z.string().optional().default(''),
    contactWhatsapp: z.string().optional().default(''),
    instructions: z.string().optional().default(''),
  })
  .partial()

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
  registration: registrationConfigSchema.optional(),
})

export const updateEventSchema = createEventSchema.partial()
