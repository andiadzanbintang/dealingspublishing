// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import AdminLayout from '@/components/layout/AdminLayout'
import RoleRoute from '@/components/ui/RoleRoute'
import { useAuth } from '@/hooks/useAuth'

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
import UsersManagePage from '@/pages/UsersManagePage'
import UserDetailPage from '@/pages/UserDetailPage'
import ReviewersManagePage from '@/pages/ReviewersManagePage'
import MyEventsPage from '@/pages/MyEventsPage'
import SubscribersPage from '@/pages/SubscribersPage'
import SettingsPage from '@/pages/SettingsPage'
import AIConfigPage from '@/pages/AIConfigPage'
import BooksManagePage from '@/pages/BooksManagePage'
import BookFormPage from '@/pages/BookFormPage'
import PartnershipsManagePage from '@/pages/PartnershipsManagePage'
import PartnershipFormPage from '@/pages/PartnershipFormPage'

const STAFF = ['superadmin', 'editor']
const ALL_ROLES = ['superadmin', 'editor', 'reviewer']

/** A reviewer has no content dashboard — send them to their event list instead. */
function HomeRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null
  if (user?.role === 'reviewer') return <Navigate to="/my-events" replace />

  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route element={<AdminLayout />}>
            <Route
              path="/dashboard"
              element={
                <RoleRoute allow={STAFF}>
                  <DashboardPage />
                </RoleRoute>
              }
            />

            <Route
              path="/journals"
              element={
                <RoleRoute allow={STAFF}>
                  <JournalsManagePage />
                </RoleRoute>
              }
            />
            <Route
              path="/journals/new"
              element={
                <RoleRoute allow={STAFF}>
                  <JournalFormPage />
                </RoleRoute>
              }
            />
            <Route
              path="/journals/edit/:id"
              element={
                <RoleRoute allow={STAFF}>
                  <JournalFormPage />
                </RoleRoute>
              }
            />

            <Route
              path="/topics"
              element={
                <RoleRoute allow={STAFF}>
                  <TopicsManagePage />
                </RoleRoute>
              }
            />

            <Route
              path="/news"
              element={
                <RoleRoute allow={STAFF}>
                  <NewsManagePage />
                </RoleRoute>
              }
            />
            <Route
              path="/news/new"
              element={
                <RoleRoute allow={STAFF}>
                  <NewsFormPage />
                </RoleRoute>
              }
            />
            <Route
              path="/news/edit/:id"
              element={
                <RoleRoute allow={STAFF}>
                  <NewsFormPage />
                </RoleRoute>
              }
            />

            <Route
              path="/events"
              element={
                <RoleRoute allow={STAFF}>
                  <EventsManagePage />
                </RoleRoute>
              }
            />
            <Route
              path="/events/new"
              element={
                <RoleRoute allow={STAFF}>
                  <EventFormPage />
                </RoleRoute>
              }
            />
            <Route
              path="/events/edit/:id"
              element={
                <RoleRoute allow={STAFF}>
                  <EventFormPage />
                </RoleRoute>
              }
            />

            {/* Reviewers work here — scoped server-side to their assigned events */}
            <Route
              path="/my-events"
              element={
                <RoleRoute allow={ALL_ROLES}>
                  <MyEventsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/registrations"
              element={
                <RoleRoute allow={ALL_ROLES}>
                  <RegistrationsManagePage />
                </RoleRoute>
              }
            />
            <Route
              path="/registrations/:id"
              element={
                <RoleRoute allow={ALL_ROLES}>
                  <RegistrationDetailPage />
                </RoleRoute>
              }
            />

            <Route
              path="/users"
              element={
                <RoleRoute allow={STAFF}>
                  <UsersManagePage />
                </RoleRoute>
              }
            />
            <Route
              path="/users/:id"
              element={
                <RoleRoute allow={STAFF}>
                  <UserDetailPage />
                </RoleRoute>
              }
            />

            <Route
              path="/reviewers"
              element={
                <RoleRoute allow={['superadmin']}>
                  <ReviewersManagePage />
                </RoleRoute>
              }
            />

            <Route
              path="/subscribers"
              element={
                <RoleRoute allow={STAFF}>
                  <SubscribersPage />
                </RoleRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <RoleRoute allow={STAFF}>
                  <SettingsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/ai-config"
              element={
                <RoleRoute allow={STAFF}>
                  <AIConfigPage />
                </RoleRoute>
              }
            />

            <Route
              path="/books"
              element={
                <RoleRoute allow={STAFF}>
                  <BooksManagePage />
                </RoleRoute>
              }
            />
            <Route
              path="/books/new"
              element={
                <RoleRoute allow={STAFF}>
                  <BookFormPage />
                </RoleRoute>
              }
            />
            <Route
              path="/books/edit/:id"
              element={
                <RoleRoute allow={STAFF}>
                  <BookFormPage />
                </RoleRoute>
              }
            />

            <Route
              path="/partnerships"
              element={
                <RoleRoute allow={STAFF}>
                  <PartnershipsManagePage />
                </RoleRoute>
              }
            />
            <Route
              path="/partnerships/new"
              element={
                <RoleRoute allow={STAFF}>
                  <PartnershipFormPage />
                </RoleRoute>
              }
            />
            <Route
              path="/partnerships/edit/:id"
              element={
                <RoleRoute allow={STAFF}>
                  <PartnershipFormPage />
                </RoleRoute>
              }
            />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
