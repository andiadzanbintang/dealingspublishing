// src/services/registrationEmail.service.js
import { sendEmail } from './email.service.js'

const BRAND = '#4F46E5'

const formatIdr = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const formatUsd = (value) => `$${(Number(value) || 0).toLocaleString('en-US')} USD`

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const clientUrl = () => (process.env.CLIENT_USER_URL || '').replace(/\/$/, '')

const layout = ({ title, intro, body = '', cta, footerNote = '' }) => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="width: 48px; height: 48px; background: ${BRAND}; border-radius: 12px; display: inline-block; line-height: 48px;">
        <span style="color: #ffffff; font-weight: 700; font-size: 20px;">D</span>
      </div>
      <p style="margin: 10px 0 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: #A3A3A3;">Dealings Publishing</p>
    </div>

    <h1 style="font-size: 22px; font-weight: 700; color: #171717; text-align: center; margin: 0 0 12px;">${title}</h1>
    <p style="color: #525252; text-align: center; line-height: 1.6; margin: 0 0 28px;">${intro}</p>

    ${body}

    ${
      cta
        ? `<div style="text-align: center; margin: 32px 0 8px;">
             <a href="${cta.url}" style="display: inline-block; padding: 14px 32px; background: ${BRAND}; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">${cta.label}</a>
           </div>`
        : ''
    }

    <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 32px 0 16px;" />
    <p style="color: #A3A3A3; font-size: 12px; text-align: center; line-height: 1.6; margin: 0;">
      ${footerNote || 'This is an automated message from Dealings Publishing. Please do not reply directly to this email.'}
    </p>
  </div>
`

const table = (rows) => `
  <table style="width: 100%; border-collapse: collapse; background: #FAFAFA; border: 1px solid #E5E5E5; border-radius: 12px; overflow: hidden;">
    ${rows
      .filter(Boolean)
      .map(
        ([label, value]) => `
      <tr>
        <td style="padding: 12px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #A3A3A3; border-bottom: 1px solid #EEEEEE; width: 42%;">${label}</td>
        <td style="padding: 12px 16px; font-size: 14px; color: #262626; border-bottom: 1px solid #EEEEEE; font-weight: 500;">${value}</td>
      </tr>`
      )
      .join('')}
  </table>
`

const registrationUrl = (registration) =>
  `${clientUrl()}/my/registrations/${registration._id}`

// ═══════════════════════════════════════════════════════════
// 1. Account created
// ═══════════════════════════════════════════════════════════
export const sendParticipantWelcomeEmail = async (participant) =>
  sendEmail({
    to: participant.email,
    subject: 'Your Dealings Publishing participant account is ready',
    html: layout({
      title: 'Welcome aboard',
      intro: `Hi ${escapeHtml(participant.name)}, your participant account has been created. You can now register for events, track your submission status, and download your ticket from one place.`,
      cta: { url: `${clientUrl()}/my/registrations`, label: 'Go to My Registrations' },
    }),
  })

// ═══════════════════════════════════════════════════════════
// 2. Submission received
// ═══════════════════════════════════════════════════════════
export const sendRegistrationSubmittedEmail = async (registration, event) =>
  sendEmail({
    to: registration.profile.email,
    subject: `Submission received — ${event.title}`,
    html: layout({
      title: 'We have received your submission',
      intro: `Thank you, ${escapeHtml(registration.profile.fullName)}. Your abstract is now in the review queue. You will receive another email as soon as the committee has made a decision.`,
      body: table([
        ['Registration code', escapeHtml(registration.registrationCode)],
        ['Event', escapeHtml(event.title)],
        ['Attendance', escapeHtml(registration.ticket?.attendanceLabel || '')],
        registration.manuscript?.title ? ['Article title', escapeHtml(registration.manuscript.title)] : null,
        ['Status', 'Waiting for review'],
      ]),
      cta: { url: registrationUrl(registration), label: 'Track My Submission' },
    }),
  })

// ═══════════════════════════════════════════════════════════
// 3. Accepted → proceed to payment
// ═══════════════════════════════════════════════════════════
export const sendRegistrationAcceptedEmail = async (registration, event) => {
  const bank = event.registration?.bank || {}

  return sendEmail({
    to: registration.profile.email,
    subject: `Abstract accepted — complete your payment for ${event.title}`,
    html: layout({
      title: 'Your abstract has been accepted',
      intro: `Congratulations, ${escapeHtml(registration.profile.fullName)}. The next step is the registration payment. Your place is confirmed once the committee verifies your transfer.`,
      body: `
        ${table([
          ['Registration code', escapeHtml(registration.registrationCode)],
          ['Attendance', escapeHtml(registration.ticket?.attendanceLabel || '')],
          ['Amount (IDR)', formatIdr(registration.fee?.amountIdr)],
          ['Amount (USD)', formatUsd(registration.fee?.amountUsd)],
        ])}
        <p style="margin: 24px 0 8px; font-size: 13px; font-weight: 600; color: #171717;">Manual transfer details</p>
        ${table([
          ['Bank', escapeHtml(bank.bankName || '—')],
          ['Account number', escapeHtml(bank.accountNumber || '—')],
          ['Account name', escapeHtml(bank.accountName || '—')],
          bank.swiftCode ? ['SWIFT / BIC', escapeHtml(bank.swiftCode)] : null,
        ])}
        <p style="margin: 20px 0 0; font-size: 13px; color: #525252; line-height: 1.6;">
          After transferring, upload your proof of payment on your registration page so the committee can verify it.
        </p>
      `,
      cta: { url: registrationUrl(registration), label: 'Upload Proof of Payment' },
    }),
  })
}

// ═══════════════════════════════════════════════════════════
// 4. Rejected → resubmit (unlimited)
// ═══════════════════════════════════════════════════════════
export const sendRegistrationRejectedEmail = async (registration, event, note = '') =>
  sendEmail({
    to: registration.profile.email,
    subject: `Revision requested — ${event.title}`,
    html: layout({
      title: 'Your submission needs a revision',
      intro: `Hi ${escapeHtml(registration.profile.fullName)}, the committee has asked for a revision before your registration can continue. You may resubmit as many times as needed.`,
      body: `
        ${table([
          ['Registration code', escapeHtml(registration.registrationCode)],
          ['Event', escapeHtml(event.title)],
        ])}
        ${
          note
            ? `<div style="margin-top: 20px; padding: 16px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px;">
                 <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #B45309;">Reviewer note</p>
                 <p style="margin: 0; font-size: 14px; color: #92400E; line-height: 1.6;">${escapeHtml(note)}</p>
               </div>`
            : ''
        }
      `,
      cta: { url: registrationUrl(registration), label: 'Revise & Resubmit' },
    }),
  })

// ═══════════════════════════════════════════════════════════
// 5. Payment proof received → pending
// ═══════════════════════════════════════════════════════════
export const sendPaymentReceivedEmail = async (registration, event) =>
  sendEmail({
    to: registration.profile.email,
    subject: `Payment proof received — ${event.title}`,
    html: layout({
      title: 'Proof of payment received',
      intro: 'Your payment is now pending verification by the committee. This usually takes 1–3 working days. We will email you the moment it is confirmed.',
      body: table([
        ['Registration code', escapeHtml(registration.registrationCode)],
        ['Amount (IDR)', formatIdr(registration.fee?.amountIdr)],
        ['Status', 'Pending verification'],
      ]),
      cta: { url: registrationUrl(registration), label: 'View Status' },
    }),
  })

// ═══════════════════════════════════════════════════════════
// 6. Payment rejected
// ═══════════════════════════════════════════════════════════
export const sendPaymentRejectedEmail = async (registration, event, note = '') =>
  sendEmail({
    to: registration.profile.email,
    subject: `Payment could not be verified — ${event.title}`,
    html: layout({
      title: 'We could not verify your payment',
      intro: `Hi ${escapeHtml(registration.profile.fullName)}, the committee could not verify the proof of payment you submitted. Please review the note below and submit a new proof.`,
      body: note
        ? `<div style="padding: 16px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px;">
             <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #B91C1C;">Note from the committee</p>
             <p style="margin: 0; font-size: 14px; color: #991B1B; line-height: 1.6;">${escapeHtml(note)}</p>
           </div>`
        : '',
      cta: { url: registrationUrl(registration), label: 'Submit New Proof' },
    }),
  })

// ═══════════════════════════════════════════════════════════
// 7. Payment confirmed → ticket + invoice + links + deadline
// ═══════════════════════════════════════════════════════════
export const sendTicketEmail = async (registration, event) => {
  const cfg = event.registration || {}
  const fullPaperDeadline = formatDate(cfg.fullPaperDeadline)

  const ticketBlock = `
    <div style="margin: 8px 0 24px; padding: 24px; border: 2px dashed ${BRAND}; border-radius: 16px; background: #EEF2FF; text-align: center;">
      <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #4338CA;">E-Ticket</p>
      <p style="margin: 0 0 4px; font-size: 26px; font-weight: 700; letter-spacing: 2px; color: #312E81;">${escapeHtml(registration.ticket?.code || '')}</p>
      <p style="margin: 0; font-size: 14px; color: #4338CA; font-weight: 600;">${escapeHtml(registration.ticket?.attendanceLabel || '')}</p>
      <p style="margin: 12px 0 0; font-size: 13px; color: #4B5563;">${escapeHtml(registration.profile.fullName)} — ${escapeHtml(registration.profile.affiliation)}</p>
    </div>
  `

  const invoiceBlock = `
    <p style="margin: 24px 0 8px; font-size: 13px; font-weight: 600; color: #171717;">Invoice</p>
    ${table([
      ['Invoice number', escapeHtml(registration.invoice?.number || '')],
      ['Issued', formatDate(registration.invoice?.issuedAt)],
      ['Description', `Registration fee — ${escapeHtml(event.title)}`],
      ['Amount (IDR)', formatIdr(registration.invoice?.amountIdr)],
      ['Amount (USD)', formatUsd(registration.invoice?.amountUsd)],
      ['Payment status', 'PAID'],
    ])}
  `

  const linksRows = [
    cfg.whatsappGroupUrl
      ? ['WhatsApp group', `<a href="${cfg.whatsappGroupUrl}" style="color:${BRAND};">Join the participant group</a>`]
      : null,
    cfg.fullPaperUploadUrl
      ? ['Full chapter upload', `<a href="${cfg.fullPaperUploadUrl}" style="color:${BRAND};">Open upload form</a>`]
      : ['Full chapter upload', `<a href="${registrationUrl(registration)}" style="color:${BRAND};">Upload from your registration page</a>`],
    ['Full paper deadline', `<strong>${fullPaperDeadline}</strong>`],
    event.location ? ['Venue', escapeHtml(event.location)] : null,
    ['Event date', formatDate(event.eventDate)],
  ]

  return sendEmail({
    to: registration.profile.email,
    subject: `Payment confirmed — your ticket for ${event.title}`,
    html: layout({
      title: 'Payment confirmed. You are registered.',
      intro: `Thank you, ${escapeHtml(registration.profile.fullName)}. Your registration is complete. Keep this email — it contains your ticket number and invoice.`,
      body: `
        ${ticketBlock}
        ${invoiceBlock}
        <p style="margin: 24px 0 8px; font-size: 13px; font-weight: 600; color: #171717;">What happens next</p>
        ${table(linksRows)}
      `,
      cta: { url: registrationUrl(registration), label: 'Open My Registration' },
      footerNote: 'Please bring this ticket number with you on the event day. Questions? Reply to the organiser contact listed on the event page.',
    }),
  })
}


// ═══════════════════════════════════════════════════════════
// 8. ORGANISER NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
//
// These go out through the same SMTP transport already configured in .env, so
// they cost nothing extra — no new service, no new account. Delivery is
// best-effort: a bounced organiser notification must never fail a participant's
// submission.

const adminUrl = () => (process.env.CLIENT_ADMIN_URL || '').replace(/\/$/, '')

const adminRegistrationUrl = (registration) =>
  `${adminUrl()}/registrations/${registration._id}`

/**
 * Fan-out helper: one email per recipient. A failure for one organiser must not
 * stop the others, but it is reported rather than swallowed — `sendEmail`
 * returns { ok, error }, so a rejected message is no longer mistaken for a sent
 * one just because the object is truthy.
 */
const sendToEach = async (recipients, buildMessage) => {
  const list = [...new Set((recipients || []).filter(Boolean))]
  if (list.length === 0) return { ok: false, sent: 0, failed: 0, results: [] }

  const results = await Promise.all(
    list.map(async (to) => {
      try {
        const result = await sendEmail({ to, ...buildMessage(to) })
        return { to, ...result }
      } catch (error) {
        return { to, ok: false, error: { response: error?.message || String(error) } }
      }
    })
  )

  const sent = results.filter((r) => r.ok).length

  return {
    ok: sent > 0,
    sent,
    failed: results.length - sent,
    results,
  }
}

/** New abstract submitted (or resubmitted after a revision request). */
export const sendAdminSubmissionNotification = async (
  recipients,
  registration,
  event,
  { isResubmission = false } = {}
) =>
  sendToEach(recipients, () => ({
    subject: `${isResubmission ? 'Revised submission' : 'New registration'} — ${event.title}`,
    html: layout({
      title: isResubmission ? 'A submission has been revised' : 'New event registration',
      intro: isResubmission
        ? `${escapeHtml(registration.profile.fullName)} has resubmitted after a revision request. It is waiting for review again.`
        : `${escapeHtml(registration.profile.fullName)} has registered and is waiting for the committee's decision.`,
      body: table([
        ['Registration code', escapeHtml(registration.registrationCode)],
        ['Event', escapeHtml(event.title)],
        ['Name', escapeHtml(registration.profile.fullName)],
        ['Affiliation', escapeHtml(registration.profile.affiliation)],
        ['Email', escapeHtml(registration.profile.email)],
        ['Phone', escapeHtml(registration.profile.phone)],
        ['Attendance', escapeHtml(registration.ticket?.attendanceLabel || '')],
        ['Fee', formatIdr(registration.fee?.amountIdr)],
        registration.manuscript?.title
          ? ['Article title', escapeHtml(registration.manuscript.title)]
          : null,
        registration.manuscript?.keywords?.length
          ? ['Keywords', escapeHtml(registration.manuscript.keywords.join(', '))]
          : null,
        isResubmission ? ['Revision', `#${registration.submissionCount}`] : null,
      ]),
      cta: { url: adminRegistrationUrl(registration), label: 'Open in the dashboard' },
      footerNote:
        'You are receiving this because your address is listed as an organiser contact for this event, or you are an assigned reviewer.',
    }),
  }))

/** A participant uploaded a proof of transfer that needs verifying. */
export const sendAdminPaymentNotification = async (recipients, registration, event) => {
  const latest = registration.payments?.[registration.payments.length - 1]

  return sendToEach(recipients, () => ({
    subject: `Payment to verify — ${registration.registrationCode} (${event.title})`,
    html: layout({
      title: 'A payment is waiting for verification',
      intro: `${escapeHtml(registration.profile.fullName)} has uploaded a proof of transfer. Open the dashboard to confirm or reject it.`,
      body: table([
        ['Registration code', escapeHtml(registration.registrationCode)],
        ['Event', escapeHtml(event.title)],
        ['Name', escapeHtml(registration.profile.fullName)],
        ['Amount due', formatIdr(registration.fee?.amountIdr)],
        latest ? ['Transfer from', escapeHtml(latest.accountName || '')] : null,
        latest ? ['Bank', escapeHtml(latest.bankName || '')] : null,
        latest ? ['Account number', escapeHtml(latest.accountNumber || '')] : null,
        latest?.swiftCode ? ['SWIFT / BIC', escapeHtml(latest.swiftCode)] : null,
        ['Attempt', `#${registration.payments?.length || 1}`],
      ]),
      cta: { url: adminRegistrationUrl(registration), label: 'Verify this payment' },
      footerNote:
        'You are receiving this because your address is listed as an organiser contact for this event, or you are an assigned reviewer.',
    }),
  }))
}

/** Credentials handed to a newly created reviewer account. */
export const sendReviewerAccountEmail = async (reviewer, plainPassword, events = []) =>
  sendEmail({
    to: reviewer.email,
    subject: 'Your Dealings Publishing reviewer account',
    html: layout({
      title: 'You have been given reviewer access',
      intro: `Hi ${escapeHtml(reviewer.name)}, a reviewer account has been created for you. It gives access to the events listed below and nothing else.`,
      body: `
        ${table([
          ['Sign-in email', escapeHtml(reviewer.email)],
          ['Temporary password', `<code>${escapeHtml(plainPassword)}</code>`],
          [
            'Assigned events',
            events.length
              ? events.map((event) => escapeHtml(event.title)).join('<br />')
              : 'None yet',
          ],
        ])}
        <p style="margin: 20px 0 0; font-size: 13px; color: #525252; line-height: 1.6;">
          Please sign in and change this password as soon as you can. Ask a superadmin
          if you need access to another event.
        </p>
      `,
      cta: { url: adminUrl() || '#', label: 'Open the dashboard' },
      footerNote: 'If you were not expecting this email, please contact the organiser.',
    }),
  })
