// src/scripts/testEmail.js
//
// Answers one question: does outgoing email actually work, and if not, why.
//
//   npm run email:test                       → verify the connection only
//   npm run email:test -- you@example.com    → verify, then send a real message
//
// Prints the raw SMTP conversation on failure, which is the part the dashboard
// cannot show you.

import 'dotenv/config'
import {
  getEmailConfig,
  verifyTransport,
  sendTestEmail,
} from '../services/email.service.js'

const recipient = process.argv[2] || null

const line = (char = '─') => console.log(char.repeat(64))
const label = (k, v) => console.log(`  ${k.padEnd(14)} ${v}`)

const run = async () => {
  const config = getEmailConfig()

  line('═')
  console.log('  DEALINGS PUBLISHING — EMAIL DIAGNOSTIC')
  line('═')

  console.log('\nConfiguration read from server/.env:\n')
  label('Host', config.host || '(empty)')
  label('Port', config.port)
  label('Encryption', config.secure ? 'Implicit TLS (correct for 465)' : 'STARTTLS (correct for 587/25)')
  label('Username', config.user || '(empty)')
  label('Password', config.hasPassword ? '(set)' : '(EMPTY)')
  label('From', config.from || '(empty)')
  label('From name', config.fromName)
  if (config.replyTo) label('Reply-To', config.replyTo)

  if (config.missing.length > 0) {
    console.log(`\n  ✗ These values are empty: ${config.missing.join(', ')}`)
    console.log('    Fill them in server/.env and run this again.\n')
    process.exit(1)
  }

  // Provider-specific sanity checks that catch the usual copy-paste mistakes
  const warnings = []
  if (config.host.includes('resend') && config.user !== 'resend') {
    warnings.push(`Resend expects the username to be the literal word "resend", not "${config.user}".`)
  }
  if (config.host.includes('hostinger') && !config.user.includes('@')) {
    warnings.push('Hostinger expects the full mailbox address as the username.')
  }
  if (config.host.includes('gmail') && !config.user.includes('@')) {
    warnings.push('Gmail expects the full address as the username.')
  }
  if (config.host.includes('hostinger') && config.user && config.from && config.user !== config.from) {
    warnings.push(`The username (${config.user}) and the From address (${config.from}) differ. Most mailbox providers require them to match.`)
  }

  if (warnings.length > 0) {
    console.log('\n  Warnings:')
    warnings.forEach((w) => console.log(`  ! ${w}`))
  }

  console.log('\n')
  line()
  console.log('Step 1 — opening a connection and authenticating')
  line()

  const verification = await verifyTransport()

  if (!verification.ok) {
    console.log('\n  ✗ FAILED\n')
    label('Code', verification.error.code || '(none)')
    label('SMTP code', verification.error.responseCode || '(none)')
    console.log(`\n  Server said:\n    ${verification.error.response}`)
    console.log(`\n  What this usually means:\n    ${verification.error.hint}\n`)
    process.exit(1)
  }

  console.log('\n  ✓ The mail server accepted the connection and the credentials.\n')

  if (!recipient) {
    console.log('  Pass an address to send a real test message:')
    console.log('    npm run email:test -- you@example.com\n')
    process.exit(0)
  }

  line()
  console.log(`Step 2 — sending a test message to ${recipient}`)
  line()

  const result = await sendTestEmail(recipient)

  if (result.ok) {
    console.log('\n  ✓ ACCEPTED BY THE MAIL SERVER\n')
    label('Message ID', result.messageId)
    label('Response', result.response || '(none)')
    console.log('\n  Now check that inbox, including the spam folder.')
    console.log('  If it never arrives despite this success, the message was accepted')
    console.log('  and then dropped later — check the provider dashboard for bounces,')
    console.log('  and confirm SPF, DKIM and DMARC for the sending domain.\n')
    process.exit(0)
  }

  console.log('\n  ✗ REFUSED\n')
  label('Code', result.error.code || '(none)')
  label('SMTP code', result.error.responseCode || '(none)')
  console.log(`\n  Server said:\n    ${result.error.response}`)
  console.log(`\n  What this usually means:\n    ${result.error.hint}\n`)
  process.exit(1)
}

run().catch((error) => {
  console.error('\nUnexpected failure:', error)
  process.exit(1)
})
