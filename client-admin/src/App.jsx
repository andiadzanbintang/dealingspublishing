// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import AdminLayout from '@/components/layout/AdminLayout'

// Pages
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import JournalsManagePage from '@/pages/JournalsManagePage'
import JournalFormPage from '@/pages/JournalFormPage'
import TopicsManagePage from '@/pages/TopicsManagePage'
import NewsManagePage from '@/pages/NewsManagePage'
import NewsFormPage from '@/pages/NewsFormPage'
import EventsManagePage from '@/pages/EventsManagePage'
import EventFormPage from '@/pages/EventFormPage'
import RegistrationsManagePage from '@/pages/RegistrationsManagePage'
import RegistrationDetailPage from '@/pages/RegistrationDetailPage'
import SubscribersPage from '@/pages/SubscribersPage'
import SettingsPage from '@/pages/SettingsPage'
import AIConfigPage from '@/pages/AIConfigPage'
import BooksManagePage from '@/pages/BooksManagePage'
import BookFormPage from '@/pages/BookFormPage'
import PartnershipsManagePage from '@/pages/PartnershipsManagePage'
import PartnershipFormPage from '@/pages/PartnershipFormPage'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/journals" element={<JournalsManagePage />} />
            <Route path="/journals/new" element={<JournalFormPage />} />
            <Route path="/journals/edit/:id" element={<JournalFormPage />} />

            <Route path="/topics" element={<TopicsManagePage />} />

            <Route path="/news" element={<NewsManagePage />} />
            <Route path="/news/new" element={<NewsFormPage />} />
            <Route path="/news/edit/:id" element={<NewsFormPage />} />

            <Route path="/events" element={<EventsManagePage />} />
            <Route path="/events/new" element={<EventFormPage />} />
            <Route path="/events/edit/:id" element={<EventFormPage />} />

            <Route path="/registrations" element={<RegistrationsManagePage />} />
            <Route path="/registrations/:id" element={<RegistrationDetailPage />} />

            <Route path="/subscribers" element={<SubscribersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/ai-config" element={<AIConfigPage />} />


            <Route path="/books" element={<BooksManagePage />} />
            <Route path="/books/new" element={<BookFormPage />} />
            <Route path="/books/edit/:id" element={<BookFormPage />} />

            <Route path="/partnerships" element={<PartnershipsManagePage />} />
            <Route path="/partnerships/new" element={<PartnershipFormPage />} />
            <Route path="/partnerships/edit/:id" element={<PartnershipFormPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
