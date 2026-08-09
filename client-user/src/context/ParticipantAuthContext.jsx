// src/context/ParticipantAuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react'
import {
  participantAuthAPI,
  setAccessToken,
  clearAccessToken,
} from '@/services/api'

const ParticipantAuthContext = createContext(null)

export function ParticipantAuthProvider({ children }) {
  const [participant, setParticipant] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const reset = useCallback(() => {
    clearAccessToken()
    setParticipant(null)
    setIsAuthenticated(false)
  }, [])

  // Silently restores the session on page load using the httpOnly refresh cookie.
  const checkAuth = useCallback(async () => {
    try {
      const response = await participantAuthAPI.refresh()
      const token = response?.data?.accessToken

      if (!token) {
        reset()
        return
      }

      setAccessToken(token)

      const meResponse = await participantAuthAPI.me()
      const data = meResponse?.data

      if (!data) {
        reset()
        return
      }

      setParticipant(data)
      setIsAuthenticated(true)
    } catch {
      reset()
    } finally {
      setIsLoading(false)
    }
  }, [reset])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email, password) => {
    const response = await participantAuthAPI.login({ email, password })
    const token = response?.data?.accessToken

    if (token) {
      setAccessToken(token)
      setParticipant(response.data.participant)
      setIsAuthenticated(true)
    }

    return response
  }

  const register = async (payload) => {
    const response = await participantAuthAPI.register(payload)
    const token = response?.data?.accessToken

    if (token) {
      setAccessToken(token)
      setParticipant(response.data.participant)
      setIsAuthenticated(true)
    }

    return response
  }

  const logout = async () => {
    try {
      await participantAuthAPI.logout()
    } catch {
      // Log out locally even if the network call fails
    } finally {
      reset()
    }
  }

  const updateProfile = async (payload) => {
    const response = await participantAuthAPI.updateMe(payload)
    if (response?.data) setParticipant(response.data)
    return response
  }

  const value = {
    participant,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
  }

  return (
    <ParticipantAuthContext.Provider value={value}>
      {children}
    </ParticipantAuthContext.Provider>
  )
}

export default ParticipantAuthContext
