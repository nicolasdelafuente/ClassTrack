import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { homePathForRole } from './roles'

/** Blocks app routes until someone is logged in. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

/** Teacher-only screens (board, schedule, attendance, groups). */
export function RequireTeacher({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== 'teacher') {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return children
}

/** Student-only screens. */
export function RequireStudent({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== 'student') {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return children
}
