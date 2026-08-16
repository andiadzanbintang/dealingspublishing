// src/services/email.service.js
import nodemailer from 'nodemailer'
import { logger } from '../config/logger.js'

/**
 * A note on what this file is and is not.
 *
 * Nodemailer is not an email *service* — it is the SMTP client library. The
 * service is whatever `EMAIL_HOST` points at (Resend, Hostinger, Gmail, …).
 * Switching provider is a change to `.env`, never a change to this code.
 *
 * The previous version of this file swallowed every failure and returned false,
 * and callers ignored that, so the dashboard reported "emailed" for messages
 * that were never accepted by the server. Everything here returns a result you
 * can act on, and the reason for a failure is preserved all the way up.
 */

const REQUIRED_KEYS = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM']

/**
 * `.env` values sometimes carry a trailing comment or stray quotes. dotenv v17
 * strips inline comments already, but a hand-edited file can still contain
 * something like `EMAIL_FROM="Name <a@b.com>" ` — normalise defensively so a
 * malformed envelope never becomes a silent rejection.
 */
const clean = (value = '') => String(value).trim().replace(/^["']|["']$/g, '')

/** Pulls a bare address out of "Display Name <a@b.com>" or plain "a@b.com". */
const bareAddress = (value = '') => {
  const match = /<([^>]+)>/.exec(value)
  const candidate = clean(match ? match[1] : value)
  return candidate.split(/\s+/)[0] || ''
}

export const getEmailConfig = () => {
  const port = parseInt(clean(process.env.EMAIL_PORT), 10) || 587
  const from = bareAddress(process.env.EMAIL_FROM)

  return {
    host: clean(process.env.EMAIL_HOST),
    port,
    // 465 is implicit TLS. 587 and 25 start in the clear and upgrade with
    // STARTTLS — forcing `secure: true` there makes the handshake hang or fail,
    // which is one of the most common silent SMTP misconfigurations.
    secure: port === 465,
    requireTLS: port !== 465,
    user: clean(process.env.EMAIL_USER),
    hasPassword: Boolean(clean(process.env.EMAIL_PASS)),
    from,
    fromName: clean(process.env.EMAIL_FROM_NAME) || 'Dealings Publishing',
    replyTo: bareAddress(process.env.EMAIL_REPLY_TO) || '',
    debug: clean(process.env.EMAIL_DEBUG) === 'true',
    missing: REQUIRED_KEYS.filter((key) => !clean(process.env[key])),
  }
}

let transporter = null
let transporterSignature = ''

const buildTransporter = () => {
  const config = getEmailConfig()

  // Rebuild if the environment changed under us (nodemon reload, test harness)
  const signature = [config.host, config.port, config.user, config.secure].join('|')
  if (transporter && signature === transporterSignature) return transporter

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: config.requireTLS,
    auth: { user: config.user, pass: clean(process.env.EMAIL_PASS) },
    // One connection reused across a burst of notifications instead of a fresh
    // TCP + TLS handshake per message.
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    logger: config.debug,
    debug: config.debug,
  })

  transporterSignature = signature
  return transporter
}

/**
 * Provider fingerprints. `EMAIL_HOST` decides which service you are talking to,
 * and each one has its own rule for what `EMAIL_USER` must be. Mixing them —
 * a Resend host with a mailbox address as the username, say — fails with a
 * terse "535 Invalid username" that does not say which half is wrong.
 */
const PROVIDER_RULES = [
  {
    match: /resend/i,
    name: 'Resend',
    expects: 'the literal word "resend"',
    isValidUser: (user) => user === 'resend',
    passHint: 'an API key beginning with re_',
    isValidPass: (pass) => pass.startsWith('re_'),
  },
  {
    match: /hostinger/i,
    name: 'Hostinger',
    expects: 'the full mailbox address',
    isValidUser: (user) => user.includes('@'),
    passHint: 'the mailbox password from hPanel',
    isValidPass: () => true,
  },
  {
    match: /gmail|google/i,
    name: 'Gmail / Google Workspace',
    expects: 'the full Gmail address',
    isValidUser: (user) => user.includes('@'),
    passHint: 'a 16-character App Password (not the account password)',
    isValidPass: () => true,
  },
  {
    match: /brevo|sendinblue/i,
    name: 'Brevo',
    expects: 'the login shown on the Brevo SMTP page',
    isValidUser: (user) => user.length > 0,
    passHint: 'an SMTP key generated in Brevo',
    isValidPass: () => true,
  },
]

/**
 * Problems that can be spotted from the configuration alone, before any
 * connection is attempted. Each one carries the fix, not just the complaint.
 */
export const getConfigWarnings = () => {
  const config = getEmailConfig()
  const password = clean(process.env.EMAIL_PASS)
  const warnings = []

  const provider = PROVIDER_RULES.find((rule) => rule.match.test(config.host))

  if (provider && config.user && !provider.isValidUser(config.user)) {
    warnings.push({
      severity: 'error',
      title: `EMAIL_HOST points at ${provider.name}, but EMAIL_USER is not what ${provider.name} expects`,
      detail: `${provider.name} expects the username to be ${provider.expects}. Yours is "${config.user}". This combination cannot authenticate — it is the usual cause of "535 Invalid username".`,
      fixes: buildMismatchFixes(config, provider, password),
    })
  }

  if (provider && password && !provider.isValidPass(password)) {
    warnings.push({
      severity: 'warning',
      title: `EMAIL_PASS does not look like a ${provider.name} credential`,
      detail: `${provider.name} expects ${provider.passHint}.`,
    })
  }

  // A mailbox provider will normally only let you send as the mailbox you
  // authenticated with. A relay (Resend, Brevo) will not.
  const mailboxProvider = provider && /hostinger|gmail|google/i.test(config.host)
  if (mailboxProvider && config.user && config.from && config.user !== config.from) {
    warnings.push({
      severity: 'warning',
      title: 'The authenticated mailbox and the From address differ',
      detail: `You authenticate as "${config.user}" but send as "${config.from}". Most mailbox providers reject that, or silently rewrite the sender.`,
    })
  }

  if (!provider && config.host) {
    warnings.push({
      severity: 'info',
      title: `Unrecognised SMTP host "${config.host}"`,
      detail: 'No provider-specific checks available. Confirm the username and password format with your provider.',
    })
  }

  return warnings
}

/**
 * When the host and the username disagree, there are always exactly two honest
 * ways out: correct the username for the host you configured, or change the
 * host to match the username you already have. Spell out both.
 */
const buildMismatchFixes = (config, provider, password) => {
  const fixes = []

  if (provider.name === 'Resend') {
    fixes.push({
      label: 'Keep Resend — correct the username',
      lines: [
        'EMAIL_HOST=smtp.resend.com',
        'EMAIL_PORT=465',
        'EMAIL_USER=resend',
        `EMAIL_PASS=${password.startsWith('re_') ? '<keep your existing re_ API key>' : '<an API key from the Resend dashboard, starts with re_>'}`,
        `EMAIL_FROM=${config.from || 'you@yourdomain.com'}`,
      ],
      note: `Resend must also show the domain of ${config.from || 'your From address'} as Verified. Until it does, it only accepts mail addressed to your own Resend account address.`,
    })

    if (config.user.includes('@')) {
      const domain = config.user.split('@')[1] || ''
      const looksHostinger = /dealingspublishing/i.test(domain)

      fixes.push({
        label: `Send through the mailbox that already owns ${config.user}`,
        lines: [
          looksHostinger ? 'EMAIL_HOST=smtp.hostinger.com' : 'EMAIL_HOST=<your mail provider SMTP host>',
          'EMAIL_PORT=465',
          `EMAIL_USER=${config.user}`,
          'EMAIL_PASS=<the mailbox password, not an API key>',
          `EMAIL_FROM=${config.user}`,
        ],
        note: 'No domain verification step, and no restriction on who you may write to, because the account already owns the address.',
      })
    }
  } else {
    fixes.push({
      label: `Use a username ${provider.name} accepts`,
      lines: [`EMAIL_USER=${provider.expects}`],
    })
  }

  return fixes
}

/**
 * Turns an SMTP failure into something a human can act on. The raw errors are
 * terse ("EAUTH", "550") and the fix differs per provider, so the guidance is
 * spelled out here rather than left for someone to search for.
 */
export const describeEmailError = (error) => {
  const config = getEmailConfig()
  const code = error?.code || ''
  const responseCode = error?.responseCode || error?.responseCode || null
  const response = error?.response || error?.message || String(error)

  let hint = 'Check the EMAIL_* values in server/.env, then restart the server.'

  if (config.missing.length > 0) {
    hint = `These .env values are empty: ${config.missing.join(', ')}.`
  } else if (code === 'EAUTH' || responseCode === 535) {
    // If the configuration itself is inconsistent, say exactly that rather than
    // listing every provider's rule and leaving the reader to work it out.
    const configError = getConfigWarnings().find((w) => w.severity === 'error')

    hint = configError
      ? `${configError.title}. ${configError.detail}`
      : 'The mail server rejected the username or password. For Resend the username must be the literal word "resend" and the password must be an API key starting with re_. For Hostinger or Gmail the username is the full mailbox address; Gmail additionally requires an App Password, not the account password.'
  } else if (code === 'ECONNECTION' || code === 'ESOCKET' || code === 'ETIMEDOUT') {
    hint = `Could not open an SMTP connection to ${config.host}:${config.port}. Either the host or port is wrong, or outbound SMTP is blocked on this network. Port 465 needs secure=true, port 587 needs STARTTLS — this service picks that automatically from the port number.`
  } else if (code === 'EENVELOPE' || responseCode === 403) {
    hint = `The server refused the envelope. With Resend this usually means the sending domain of "${config.from}" is not verified yet — until it is, Resend only accepts messages addressed to your own account email. Verify the domain in the Resend dashboard, or send through the mailbox provider that already owns the address.`
  } else if (responseCode === 550 || responseCode === 553) {
    hint = `The server will not let this account send as "${config.from}". The From address normally has to match the authenticated mailbox, or a domain you have verified with the provider.`
  } else if (code === 'EMESSAGE') {
    hint = 'The message itself was rejected — usually a malformed From or To address.'
  } else if (/self.signed|certificate/i.test(response)) {
    hint = 'TLS certificate problem. Confirm the host name matches the certificate.'
  }

  return { code: code || null, responseCode, response, hint }
}

// A short in-process history so the dashboard can answer "did that actually
// send?" without a schema change. Not persisted — it is a debugging aid.
const RECENT_LIMIT = 25
const recentAttempts = []

const record = (entry) => {
  recentAttempts.unshift({ ...entry, at: new Date().toISOString() })
  if (recentAttempts.length > RECENT_LIMIT) recentAttempts.length = RECENT_LIMIT
}

export const getRecentEmailAttempts = () => [...recentAttempts]

/** Opens a connection and authenticates without sending anything. */
export const verifyTransport = async () => {
  const config = getEmailConfig()

  if (config.missing.length > 0) {
    return {
      ok: false,
      error: {
        code: 'ECONFIG',
        responseCode: null,
        response: `Missing .env values: ${config.missing.join(', ')}`,
        hint: 'Fill these in server/.env and restart the server.',
      },
    }
  }

  try {
    await buildTransporter().verify()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: describeEmailError(error) }
  }
}

/**
 * Sends one message.
 *
 * Returns { ok, messageId, accepted, rejected, response, error } — never throws,
 * but never claims success it did not get either. A caller that shows a message
 * to a human must read `ok`.
 */
export const sendEmail = async ({ to, subject, html, text, replyTo, attachments }) => {
  const config = getEmailConfig()

  if (config.missing.length > 0) {
    const error = {
      code: 'ECONFIG',
      responseCode: null,
      response: `Missing .env values: ${config.missing.join(', ')}`,
      hint: 'Fill these in server/.env and restart the server.',
    }
    logger.error(`Email not sent to ${to}: ${error.response}`)
    record({ to, subject, ok: false, error })
    return { ok: false, error }
  }

  try {
    const info = await buildTransporter().sendMail({
      from: `"${config.fromName}" <${config.from}>`,
      to,
      subject,
      html,
      text,
      replyTo: replyTo || config.replyTo || undefined,
      attachments,
    })

    // A server can accept the connection and still refuse a recipient
    const rejected = info.rejected || []
    if (rejected.length > 0) {
      const error = {
        code: 'EREJECTED',
        responseCode: null,
        response: `The server rejected: ${rejected.join(', ')}. ${info.response || ''}`.trim(),
        hint: 'The recipient was refused. With Resend on an unverified domain only your own account address is accepted.',
      }
      logger.error(`Email rejected for ${to}: ${error.response}`)
      record({ to, subject, ok: false, error })
      return { ok: false, error, messageId: info.messageId }
    }

    logger.info(`Email sent to ${to}: ${subject} (${info.messageId})`)
    record({ to, subject, ok: true, messageId: info.messageId, response: info.response })

    return {
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected,
      response: info.response,
    }
  } catch (rawError) {
    const error = describeEmailError(rawError)
    logger.error(`Email failed to ${to}: ${error.response} | ${error.hint}`)
    record({ to, subject, ok: false, error })
    return { ok: false, error }
  }
}

// ═══════════════════════════════════════════════════════════
// SUBSCRIBER EMAILS (unchanged content, honest return value)
// ═══════════════════════════════════════════════════════════

export const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.CLIENT_USER_URL}/verify?token=${token}`

  return sendEmail({
    to: email,
    subject: 'Verify your Dealings Publishing subscription',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 48px; height: 48px; background: #4F46E5; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold; font-size: 20px;">D</span>
          </div>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; color: #171717; text-align: center; margin-bottom: 16px;">
          Verify your email
        </h1>
        <p style="color: #737373; text-align: center; margin-bottom: 32px;">
          Click the button below to verify your subscription to Dealings Publishing updates.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #4F46E5; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">
            Verify Email
          </a>
        </div>
        <p style="color: #A3A3A3; font-size: 12px; text-align: center;">
          If you didn't subscribe, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

export const sendNewsletterEmail = async (email, subject, content, unsubscribeToken) => {
  const unsubscribeUrl = `${process.env.CLIENT_USER_URL}/unsubscribe?token=${unsubscribeToken}`

  return sendEmail({
    to: email,
    subject,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        ${content}
        <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 32px 0;" />
        <p style="color: #A3A3A3; font-size: 12px; text-align: center;">
          <a href="${unsubscribeUrl}" style="color: #A3A3A3;">Unsubscribe</a>
        </p>
      </div>
    `,
  })
}

/** Plain diagnostic message used by the test tools. */
export const sendTestEmail = async (to) => {
  const config = getEmailConfig()

  return sendEmail({
    to,
    subject: 'Dealings Publishing — email delivery test',
    text: `This is a test message from the Dealings Publishing server.\n\nHost: ${config.host}:${config.port}\nFrom: ${config.from}\n\nIf you are reading this, outgoing email works.`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 20px; color: #171717; margin: 0 0 12px;">Email delivery works</h1>
        <p style="color: #525252; line-height: 1.6; margin: 0 0 20px;">
          This is a test message from the Dealings Publishing server. If it reached
          your inbox, participant tickets, invoices and organiser notifications will
          reach it too.
        </p>
        <table style="width: 100%; border-collapse: collapse; background: #FAFAFA; border: 1px solid #E5E5E5; border-radius: 12px;">
          <tr><td style="padding: 10px 14px; font-size: 12px; color: #A3A3A3;">SMTP host</td><td style="padding: 10px 14px; font-size: 14px; color: #262626;">${config.host}:${config.port}</td></tr>
          <tr><td style="padding: 10px 14px; font-size: 12px; color: #A3A3A3;">Encryption</td><td style="padding: 10px 14px; font-size: 14px; color: #262626;">${config.secure ? 'Implicit TLS (465)' : 'STARTTLS'}</td></tr>
          <tr><td style="padding: 10px 14px; font-size: 12px; color: #A3A3A3;">From</td><td style="padding: 10px 14px; font-size: 14px; color: #262626;">${config.from}</td></tr>
        </table>
      </div>
    `,
  })
}
