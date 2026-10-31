import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // status: 'loading' | 'authed' | 'guest' | 'error'
  const [state, setState] = useState({ status: 'loading', user: null, error: null })

  const refresh = useCallback(async () => {
    // The session cookie itself is httpOnly; this readable marker only says one exists.
    if (!document.cookie.split('; ').includes('pf_signed_in=1')) {
      setState({ status: 'guest', user: null, error: null })
      return
    }
    try {
      const { user } = await api('/auth/me')
      setState({ status: 'authed', user, error: null })
    } catch (error) {
      if (error.status === 401) {
        document.cookie = 'pf_signed_in=; Max-Age=0; Path=/' // stale marker from an expired session
        setState({ status: 'guest', user: null, error: null })
      } else {
        setState({ status: 'error', user: null, error })
      }
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = async (email, password) => {
    const { user } = await api('/auth/login', { method: 'POST', body: { email, password } })
    setState({ status: 'authed', user, error: null })
    return user
  }

  const signup = async (details) => {
    const { user } = await api('/auth/signup', { method: 'POST', body: details })
    setState({ status: 'authed', user, error: null })
    return user
  }

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setState({ status: 'guest', user: null, error: null })
  }

  return <AuthContext.Provider value={{ ...state, refresh, login, signup, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export function initialsOf(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('') || '?'
  )
}
