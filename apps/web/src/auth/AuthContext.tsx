import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser } from '../types'
import { normalizeAuthUser } from './roles'

const STORAGE_KEY = 'classtrack.auth.user'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeAuthUser(JSON.parse(raw))
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    login: (next) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setUser(next)
    },
    logout: () => {
      localStorage.removeItem(STORAGE_KEY)
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
