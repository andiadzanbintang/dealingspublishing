// src/services/api.js
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// ═══ Token management ═══
let accessToken = null

export const setAccessToken = (token) => {
  accessToken = token
}

export const getAccessToken = () => accessToken

export const clearAccessToken = () => {
  accessToken = null
}

// ═══ Request interceptor — attach token ═══
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ═══ Response interceptor — handle 401 + refresh ═══
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh')

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const newToken = response.data?.data?.accessToken

        if (newToken) {
          setAccessToken(newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        clearAccessToken()

        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// ════════════════════════════════
// AUTH
// ════════════════════════════════
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// ════════════════════════════════
// DASHBOARD
// ════════════════════════════════
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: (params) => api.get('/dashboard/activity', { params }),
  getPopularJournals: () => api.get('/dashboard/popular-journals'),
  getJournalsByTopic: () => api.get('/dashboard/journals-by-topic'),
  getAnalytics: (params) => api.get('/dashboard/analytics', { params }),
}

// ════════════════════════════════
// JOURNALS
// ════════════════════════════════
export const journalAPI = {
  getAll: (params) => api.get('/journals', { params }),
  getById: (id) => api.get(`/journals/${id}`),
  create: (data) => api.post('/journals', data),
  update: (id, data) => api.put(`/journals/${id}`, data),
  delete: (id) => api.delete(`/journals/${id}`),
  toggleFeatured: (id) => api.patch(`/journals/${id}/featured`),
  toggleStatus: (id) => api.patch(`/journals/${id}/status`),
}

// ════════════════════════════════
// TOPICS
// ════════════════════════════════
export const topicAPI = {
  getAll: (params) => api.get('/topics', { params }),
  create: (data) => api.post('/topics', data),
  update: (id, data) => api.put(`/topics/${id}`, data),
  delete: (id) => api.delete(`/topics/${id}`),
}

// ════════════════════════════════
// NEWS
// ════════════════════════════════
export const newsAPI = {
  getAll: (params) => api.get('/news', { params }),
  getById: (id) => api.get(`/news/${id}`),
  create: (data) => api.post('/news', data),
  update: (id, data) => api.put(`/news/${id}`, data),
  delete: (id) => api.delete(`/news/${id}`),
  togglePublish: (id) => api.patch(`/news/${id}/publish`),
  toggleFeatured: (id) => api.patch(`/news/${id}/featured`),
}

// ════════════════════════════════
// EVENTS
// ════════════════════════════════
export const eventAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  togglePublish: (id) => api.patch(`/events/${id}/publish`),
  toggleFeatured: (id) => api.patch(`/events/${id}/featured`),
}

// ════════════════════════════════
// SUBSCRIBERS
// ════════════════════════════════
export const subscriberAPI = {
  getAll: (params) => api.get('/subscribers', { params }),
  getStats: () => api.get('/subscribers/stats'),
  delete: (id) => api.delete(`/subscribers/${id}`),
  sendNewsletter: (data) => api.post('/subscribers/newsletter', data),
}

// ════════════════════════════════
// UPLOAD
// ════════════════════════════════
export const uploadAPI = {
  uploadImage: (formData, folder = 'researchhub/general') =>
    api.post('/upload/image', formData, {
      params: { folder },
      headers: { 'Content-Type': 'multipart/form-data' },
    }), 

  uploadMultiple: (formData, folder = 'researchhub/gallery') =>
    api.post('/upload/images', formData, {
      params: { folder },
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteImage: (data) => api.delete('/upload/image', { data }),
}

// ════════════════════════════════
// SETTINGS
// ════════════════════════════════
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
}

// ════════════════════════════════
// AI CONFIG
// ════════════════════════════════
export const aiConfigAPI = {
  reindex: () => api.post('/ai/reindex'),
}

// ════════════════════════════════
// BOOKS
// ════════════════════════════════
export const bookAPI = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
  togglePublish: (id) => api.patch(`/books/${id}/publish`),
  toggleFeatured: (id) => api.patch(`/books/${id}/featured`),
}

// ════════════════════════════════
// PARTNERSHIPS
// ════════════════════════════════
export const partnershipAPI = {
  getAll: (params) => api.get('/partnerships', { params }),
  getById: (id) => api.get(`/partnerships/${id}`),
  create: (data) => api.post('/partnerships', data),
  update: (id, data) => api.put(`/partnerships/${id}`, data),
  delete: (id) => api.delete(`/partnerships/${id}`),
  togglePublish: (id) => api.patch(`/partnerships/${id}/publish`),
}

export default api