// src/validators/subscriber.validator.js
import { z } from 'zod'

export const subscribeSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().optional().nullable(),
})