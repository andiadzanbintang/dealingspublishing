// src/services/email.service.js
import nodemailer from 'nodemailer'
import { logger } from '../config/logger.js'

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter()

    await transporter.sendMail({
      from: `"Dealings Publishing" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    })

    logger.info(`Email sent to ${to}: ${subject}`)
    return true
  } catch (error) {
    logger.error(`Email failed to ${to}: ${error.message}`)
    return false
  }
}

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