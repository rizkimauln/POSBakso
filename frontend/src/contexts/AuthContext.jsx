import { useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import {
  clearAuthStorage,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '../lib/storage'
import { resetEcho } from '../lib/echo'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }) {
  const [token, setAuthToken] = useState(() => getToken())
  const [user, setUser] = useState(() => getStoredUser())
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(getToken()))

  const clearSession = useCallback(() => {
    clearAuthStorage()
    resetEcho()
    setAuthToken(null)
    setUser(null)
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials)
    const nextToken = data.access_token
    const nextUser = data.user

    setToken(nextToken)
    setStoredUser(nextUser)
    setAuthToken(nextToken)
    setUser(nextUser)

    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    function handleUnauthorized() {
      clearSession()
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [clearSession])

  useEffect(() => {
    if (!token) {
      return
    }

    let isMounted = true

    authService
      .me()
      .then((data) => {
        if (!isMounted) {
          return
        }

        const currentUser = data.user

        setStoredUser(currentUser)
        setUser(currentUser)
      })
      .catch(() => {
        if (isMounted) {
          clearSession()
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [clearSession, token])

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isBootstrapping,
      login,
      logout,
    }),
    [isBootstrapping, login, logout, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
