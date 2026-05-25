// src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>404 — Page Not Found — ResearchHub</title>
      </Helmet>

      <section className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center px-4">
          <div className="text-8xl font-bold text-neutral-200 mb-4">404</div>
          <h1 className="text-3xl font-bold text-neutral-900">Page Not Found</h1>
          <p className="mt-4 text-neutral-500 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/">
              <Button variant="primary" icon={Home} iconPosition="left">
                Go Home
              </Button>
            </Link>
            <button onClick={() => window.history.back()}>
              <Button variant="outline" icon={ArrowLeft} iconPosition="left">
                Go Back
              </Button>
            </button>
          </div>
        </div>
      </section>
    </>
  )
}