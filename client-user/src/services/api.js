// client-user/src/services/api.js
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// ════════════════════════════════
// PARTICIPANT TOKEN MANAGEMENT
// ════════════════════════════════
// The access token is kept in memory only. The refresh token lives in an
// httpOnly cookie set by the server, so a page reload silently re-authenticates
// through /participants/refresh.
let accessToken = null

export const setAccessToken = (token) => {
  accessToken = token
}

export const getAccessToken = () => accessToken

export const clearAccessToken = () => {
  accessToken = null
}

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — unwrap payload, retry once after a token refresh
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    const isAuthRoute =
      originalRequest?.url?.includes('/participants/login') ||
      originalRequest?.url?.includes('/participants/register') ||
      originalRequest?.url?.includes('/participants/refresh')

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true

      try {
        const response = await axios.post(
          `${API_BASE_URL}/participants/refresh`,
          {},
          { withCredentials: true }
        )

        const newToken = response.data?.data?.accessToken

        if (newToken) {
          setAccessToken(newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } catch {
        clearAccessToken()
      }
    }

    const message = error.response?.data?.message || 'Something went wrong'
    console.error('API Error:', message)
    return Promise.reject(error)
  }
)

// File uploads need a much longer ceiling than a normal JSON call.
const uploadConfig = (onUploadProgress) => ({
  timeout: 180000,
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress,
})

// ════════════════════════════════
// JOURNALS
// ════════════════════════════════
export const journalAPI = {
  getAll: (params) => api.get('/journals/public', { params }),
  getFeatured: () => api.get('/journals/featured'),
  getBySlug: (slug) => api.get(`/journals/public/${slug}`),
  search: (params) => api.get('/journals/search', { params }),
}

// ════════════════════════════════
// TOPICS
// ════════════════════════════════
export const topicAPI = {
  getAll: () => api.get('/topics/public'),
  getJournals: (slug, params) =>
    api.get(`/topics/public/${slug}/journals`, { params }),
}

// ════════════════════════════════
// NEWS
// ════════════════════════════════
export const newsAPI = {
  getAll: (params) => api.get('/news/public', { params }),
  getFeatured: () => api.get('/news/featured'),
  getBySlug: (slug) => api.get(`/news/public/${slug}`),
}

// ════════════════════════════════
// EVENTS
// ════════════════════════════════
export const eventAPI = {
  getAll: (params) => api.get('/events/public', { params }),
  getUpcoming: () => api.get('/events/upcoming'),
  getBySlug: (slug) => api.get(`/events/public/${slug}`),
}

// ════════════════════════════════
// PARTICIPANT ACCOUNTS
// ════════════════════════════════
export const participantAuthAPI = {
  register: (data) => api.post('/participants/register', data),
  login: (data) => api.post('/participants/login', data),
  refresh: () => api.post('/participants/refresh'),
  logout: () => api.post('/participants/logout'),
  me: () => api.get('/participants/me'),
  updateMe: (data) => api.put('/participants/me', data),
  changePassword: (data) => api.put('/participants/me/password', data),
}

// ════════════════════════════════
// EVENT REGISTRATION
// ════════════════════════════════
export const registrationAPI = {
  // Form definition for an event (fees, output types, deadlines, limits).
  // Includes `myRegistration` when the visitor is logged in.
  getEventConfig: (eventIdOrSlug) =>
    api.get(`/registrations/events/${eventIdOrSlug}/config`),

  submit: (eventIdOrSlug, formData, onUploadProgress) =>
    api.post(
      `/registrations/events/${eventIdOrSlug}`,
      formData,
      uploadConfig(onUploadProgress)
    ),

  getMine: () => api.get('/registrations/me'),
  getOne: (id) => api.get(`/registrations/me/${id}`),

  submitPayment: (id, formData, onUploadProgress) =>
    api.post(`/registrations/me/${id}/payment`, formData, uploadConfig(onUploadProgress)),

  uploadFullPaper: (id, formData, onUploadProgress) =>
    api.post(`/registrations/me/${id}/full-paper`, formData, uploadConfig(onUploadProgress)),

  // Files are streamed through the API so the browser receives the correct
  // Content-Type and the original filename, instead of an extensionless blob
  // from the CDN. kind: 'abstract' | 'full-paper' | 'payment-<index>'
  downloadFile: (id, kind) =>
    api.get(`/registrations/me/${id}/download/${kind}`, {
      responseType: 'blob',
      timeout: 120000,
    }),
}

// ════════════════════════════════
// SITE SETTINGS
// ════════════════════════════════
export const siteAPI = {
  getSettings: () => api.get('/settings'),
}

// ════════════════════════════════
// SUBSCRIBERS
// ════════════════════════════════
export const subscriberAPI = {
  subscribe: (data) => api.post('/subscribers/subscribe', data),
  verify: (token) => api.get('/subscribers/verify', { params: { token } }),
  unsubscribe: (token) =>
    api.get('/subscribers/unsubscribe', { params: { token } }),
}

// ════════════════════════════════
// AI CHAT
// ════════════════════════════════
export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  chatAboutJournal: (journalId, data) =>
    api.post('/ai/chat', { ...data, journalId }),
  getConversation: (sessionId) => api.get(`/ai/conversation/${sessionId}`),
}

// ════════════════════════════════
// BOOKS
// ════════════════════════════════
export const bookAPI = {
  getAll: (params) => api.get('/books/public', { params }),
  getFeatured: () => api.get('/books/featured'),
  getBySlug: (slug) => api.get(`/books/public/${slug}`),
}

// ════════════════════════════════
// PARTNERSHIPS
// ════════════════════════════════
export const partnershipAPI = {
  getAll: (params) => api.get('/partnerships/public', { params }),
}

export default api
