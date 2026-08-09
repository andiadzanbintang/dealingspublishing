// src/validators/participant.validator.js
import { z } from 'zod'

// Must start with a country code, e.g. +6281234567890 or +1 555 123 4567
export const phoneField = z
  .string()
  .trim()
  .min(8, 'Phone number is too short')
  .regex(
    /^\+[1-9]\d{0,3}[\s-]?\d[\d\s-]{5,17}$/,
    'Phone must start with a country code, e.g. +6281234567890'
  )

export const participantRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: phoneField.optional().or(z.literal('')),
  affiliation: z.string().trim().optional().default(''),
  country: z.string().trim().optional().default(''),
})

export const participantLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const participantUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  phone: phoneField.optional().or(z.literal('')),
  affiliation: z.string().trim().optional(),
  country: z.string().trim().optional(),
})

export const participantPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})
