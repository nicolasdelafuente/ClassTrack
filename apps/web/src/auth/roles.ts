import type { AuthUser, UserRole } from '../types'

/** Where each role lands after login / register. */
export function homePathForRole(role: UserRole): string {
  return role === 'student' ? '/alumno' : '/'
}

export function roleLabel(role: UserRole): string {
  return role === 'student' ? 'Alumno' : 'Docente'
}

/** Normalize stored sessions from before CT-039 (no role → teacher). */
export function normalizeAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null
  const parsed = raw as Partial<AuthUser>
  if (typeof parsed.id !== 'string' || typeof parsed.email !== 'string') {
    return null
  }
  const role: UserRole =
    parsed.role === 'student' || parsed.role === 'teacher'
      ? parsed.role
      : 'teacher'
  return {
    id: parsed.id,
    email: parsed.email,
    displayName:
      typeof parsed.displayName === 'string' ? parsed.displayName : null,
    role,
  }
}
