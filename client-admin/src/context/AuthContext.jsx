// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react'
import { authAPI, setAccessToken, clearAccessToken } from '@/services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkAuth = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setIsLoading(true)

    try {
      // Skip auth check if no backend is running yet
      const backendAvailable = import.meta.env.VITE_BACKEND_ENABLED === 'true'

      if (!backendAvailable) {
        clearAccessToken()
        setUser(null)
        setIsAuthenticated(false)
        return
      }

      const response = await authAPI.refresh()
      const token = response?.data?.accessToken

      if (!token) {
        clearAccessToken()
        setUser(null)
        setIsAuthenticated(false)
        return
      }

      setAccessToken(token)

      const meResponse = await authAPI.me()
      const userData = meResponse?.data

      if (!userData) {
        clearAccessToken()
        setUser(null)
        setIsAuthenticated(false)
        return
      }

      setUser(userData)
      setIsAuthenticated(true)
    } catch {
      clearAccessToken()
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password })
    const token = response?.data?.accessToken
    const userData = response?.data?.user

    if (token) {
      setAccessToken(token)
      setUser(userData)
      setIsAuthenticated(true)
    }

    return response
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch {
      // Logout even if API fails
    } finally {
      clearAccessToken()
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext