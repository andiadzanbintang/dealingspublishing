// src/controllers/email.controller.js
import {
  getEmailConfig,
  verifyTransport,
  sendTestEmail,
  getRecentEmailAttempts,
} from '../services/email.service.js'
import { AppError } from '../utils/AppError.js'
import { catchAsync } from '../utils/catchAsync.js'

/**
 * Known-good settings for the providers this project is likely to use, shown in
 * the dashboard next to whatever is currently configured. Saves a search when
 * something is wrong at 2am.
 */
const PROVIDER_PRESETS = [
  {
    id: 'hostinger',
    name: 'Hostinger (the mailbox you already own)',
    host: 'smtp.hostinger.com',
    ports: [465, 587],
    user: 'The full mailbox address, e.g. abdillah@dealingspublishing.com',
    pass: 'The mailbox password set in hPanel',
    note: 'Simplest option when the From address is a Hostinger mailbox: the account already owns the address, so there is no separate domain verification and no restriction on who you may write to.',
  },
  {
    id: 'resend',
    name: 'Resend',
    host: 'smtp.resend.com',
    ports: [465, 587],
    user: 'The literal word "resend"',
    pass: 'An API key beginning with re_',
    note: 'The sending domain must show as Verified in the Resend dashboard. Until it does, Resend only accepts messages addressed to your own account email and refuses everything else.',
  },
  {
    id: 'gmail',
    name: 'Gmail / Google Workspace',
    host: 'smtp.gmail.com',
    ports: [465, 587],
    user: 'The full Gmail address',
    pass: 'A 16-character App Password (not the account password)',
    note: 'Requires 2-Step Verification. Google removed "less secure app" access in May 2025.',
  },
  {
    id: 'brevo',
    name: 'Brevo',
    host: 'smtp-relay.brevo.com',
    ports: [587],
    user: 'The login shown on the Brevo SMTP page',
    pass: 'An SMTP key generated in Brevo',
    note: 'Free tier around 300 messages a day.',
  },
]

/** Configuration health: what is set, and whether the server will talk to us. */
export const getEmailHealth = catchAsync(async (req, res) => {
  const config = getEmailConfig()
  const verification = await verifyTransport()

  res.status(200).json({
    status: 'success',
    data: {
      config: {
        host: config.host || null,
        port: config.port,
        encryption: config.secure ? 'Implicit TLS (port 465)' : 'STARTTLS',
        user: config.user || null,
        hasPassword: config.hasPassword,
        from: config.from || null,
        fromName: config.fromName,
        replyTo: config.replyTo || null,
        missing: config.missing,
        debug: config.debug,
      },
      verification,
      recentAttempts: getRecentEmailAttempts(),
      presets: PROVIDER_PRESETS,
    },
  })
})

/** Sends one real message and reports exactly what the mail server said. */
export const sendTest = catchAsync(async (req, res, next) => {
  const to = String(req.body?.to || '').trim()

  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return next(new AppError('Please provide a valid recipient address.', 400))
  }

  const verification = await verifyTransport()
  const result = await sendTestEmail(to)

  res.status(result.ok ? 200 : 502).json({
    status: result.ok ? 'success' : 'fail',
    message: result.ok
      ? `Accepted by the mail server for ${to}. Check that inbox, including spam.`
      : `The mail server refused the message: ${result.error?.response || 'unknown error'}`,
    data: {
      ok: result.ok,
      messageId: result.messageId || null,
      response: result.response || null,
      error: result.error || null,
      verification,
    },
  })
})
