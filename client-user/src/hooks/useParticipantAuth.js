// src/hooks/useParticipantAuth.js
import { useContext } from 'react'
import ParticipantAuthContext from '@/context/ParticipantAuthContext'

export function useParticipantAuth() {
  const context = useContext(ParticipantAuthContext)

  if (!context) {
    throw new Error(
      'useParticipantAuth must be used inside a <ParticipantAuthProvider>'
    )
  }

  return context
}

export default useParticipantAuth
