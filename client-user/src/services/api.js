// src/services/api.js
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong'
    console.error('API Error:', message)
    return Promise.reject(error)
  }
)

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


export default api