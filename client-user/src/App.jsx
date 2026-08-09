// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import PageLayout from '@/components/layout/PageLayout'
import ChatWidget from '@/components/ai/ChatWidget'
import { ParticipantAuthProvider } from '@/context/ParticipantAuthContext'
import ParticipantRoute from '@/components/ui/ParticipantRoute'

// Pages
import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import JournalsPage from '@/pages/JournalsPage'
import JournalDetailPage from '@/pages/JournalDetailPage'
import NewsPage from '@/pages/NewsPage'
import NewsDetailPage from '@/pages/NewsDetailPage'
import EventsPage from '@/pages/EventsPage'
import EventDetailPage from '@/pages/EventDetailPage'
import NotFoundPage from '@/pages/NotFoundPage'
import VerifyPage from '@/pages/VerifyPage'
import UnsubscribePage from '@/pages/UnsubscribePage'
import PrivacyPage from '@/pages/PrivacyPage'
import TermsPage from '@/pages/TermsPage'
import BooksPage from '@/pages/BooksPage'
import BookDetailPage from '@/pages/BookDetailPage'
import PartnershipsPage from '@/pages/PartnershipsPage'

// Participant account & event registration
import ParticipantLoginPage from '@/pages/ParticipantLoginPage'
import ParticipantRegisterPage from '@/pages/ParticipantRegisterPage'
import EventRegisterPage from '@/pages/EventRegisterPage'
import MyRegistrationsPage from '@/pages/MyRegistrationsPage'
import RegistrationDetailPage from '@/pages/RegistrationDetailPage'

export default function App() {
  return (
    <HelmetProvider>
      <Router>
        <ParticipantAuthProvider>
          <PageLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/journals" element={<JournalsPage />} />
              <Route path="/journals/:slug" element={<JournalDetailPage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/books/:slug" element={<BookDetailPage />} />
              <Route path="/partnerships" element={<PartnershipsPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/news/:slug" element={<NewsDetailPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:slug" element={<EventDetailPage />} />

              {/* Participant account */}
              <Route path="/account/login" element={<ParticipantLoginPage />} />
              <Route path="/account/register" element={<ParticipantRegisterPage />} />

              {/* Event registration (participant only) */}
              <Route
                path="/events/:slug/register"
                element={
                  <ParticipantRoute>
                    <EventRegisterPage />
                  </ParticipantRoute>
                }
              />
              <Route
                path="/my/registrations"
                element={
                  <ParticipantRoute>
                    <MyRegistrationsPage />
                  </ParticipantRoute>
                }
              />
              <Route
                path="/my/registrations/:id"
                element={
                  <ParticipantRoute>
                    <RegistrationDetailPage />
                  </ParticipantRoute>
                }
              />

              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </PageLayout>

          {/* Global AI Chat Widget */}
          <ChatWidget />
        </ParticipantAuthProvider>
      </Router>
    </HelmetProvider>
  )
}
