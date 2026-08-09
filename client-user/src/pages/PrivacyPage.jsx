// src/pages/PrivacyPage.jsx
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — Dealings Publishing</title>
        <meta
          name="description"
          content="Read the Dealings Publishing privacy policy and learn how we collect, use, and protect your information."
        />
      </Helmet>

      <PageHeader
        title="Privacy Policy"
        subtitle="Learn how we collect, use, and protect your information."
        breadcrumbs={[{ label: 'Privacy Policy' }]}
        backgroundImage="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1920&q=80"
      />

      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          <div className="mb-10 flex items-start gap-4 p-6 bg-primary-50 border border-primary-100 rounded-2xl">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Your privacy matters
              </h2>
              <p className="mt-1 text-sm text-neutral-600 leading-relaxed">
                This policy explains how Dealings Publishing handles information
                submitted through our website, including newsletter subscriptions,
                research inquiries, and general site usage.
              </p>
            </div>
          </div>

          <div className="prose prose-neutral prose-lg max-w-none">
            <p className="text-sm text-neutral-500">
              Last updated: {new Date().getFullYear()}
            </p>

            <h2>1. Information We Collect</h2>
            <p>
              We may collect information that you voluntarily provide, such as
              your name, email address, subscription preferences, and messages
              submitted through forms on this website.
            </p>
            <p>
              We may also collect limited technical information, such as browser
              type, device information, pages visited, and general usage data to
              improve the performance and reliability of our website.
            </p>

            <h2>2. How We Use Your Information</h2>
            <p>
              We use your information to provide website services, manage
              newsletter subscriptions, send research updates, respond to
              inquiries, improve our platform, and maintain the security of our
              services.
            </p>

            <h2>3. Newsletter and Email Communications</h2>
            <p>
              If you subscribe to our updates, we may send you emails about new
              publications, events, announcements, and related research content.
              You may unsubscribe at any time through the unsubscribe link
              included in our emails.
            </p>

            <h2>4. Data Protection</h2>
            <p>
              We take reasonable administrative, technical, and organizational
              measures to protect your information from unauthorized access,
              loss, misuse, or disclosure.
            </p>

            <h2>5. Third-Party Services</h2>
            <p>
              Our website may use third-party services for hosting, analytics,
              email delivery, media storage, or other operational needs. These
              services may process limited information in accordance with their
              own privacy practices.
            </p>

            <h2>6. Cookies and Similar Technologies</h2>
            <p>
              We may use cookies or similar technologies to improve user
              experience, remember preferences, and understand how visitors use
              our website. You may control cookies through your browser settings.
            </p>

            <h2>7. Data Retention</h2>
            <p>
              We retain information only as long as necessary for the purposes
              described in this policy, unless a longer retention period is
              required by law or necessary for legitimate operational reasons.
            </p>

            <h2>8. Your Rights</h2>
            <p>
              Depending on your location and applicable law, you may have the
              right to request access, correction, deletion, or restriction of
              your personal information.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes
              will be posted on this page with an updated effective date.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or how your
              information is handled, please contact us through the contact
              information provided on this website.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-neutral-200">
            <Link to="/">
              <Button variant="ghost" icon={ArrowLeft} iconPosition="left">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}