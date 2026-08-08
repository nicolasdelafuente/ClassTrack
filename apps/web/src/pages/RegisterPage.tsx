import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchInvitePreview, registerUser } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { homePathForRole, roleLabel } from '../auth/roles'
import { Button } from '../components/atoms/Button'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import type { UserRole } from '../types'

type InviteState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      email: string
      role: UserRole
      courseName: string | null
    }

/**
 * Registration is invite-only (CT-042).
 * Open `/register?token=…` from the mail / copied link.
 */
export function RegisterPage() {
  const { isAuthenticated, user, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''

  const [invite, setInvite] = useState<InviteState>(() =>
    token ? { status: 'loading' } : { status: 'missing' },
  )
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setInvite({ status: 'missing' })
      return
    }
    let cancelled = false
    async function load() {
      try {
        const preview = await fetchInvitePreview(token)
        if (!cancelled) {
          setInvite({
            status: 'ready',
            email: preview.email,
            role: preview.role,
            courseName: preview.courseName,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setInvite({
            status: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'Invitación no válida',
          })
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  if (isAuthenticated && user) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setError(null)
    setSubmitting(true)
    try {
      const next = await registerUser({
        token,
        password,
        displayName: displayName.trim() || undefined,
      })
      login(next)
      navigate(homePathForRole(next.role), { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo crear la cuenta',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <p
          className="m-0 text-2xl font-semibold tracking-tight text-fg"
          translate="no"
        >
          ClassTrack
        </p>
        <p className="mt-2 text-[14px] text-fg-muted">
          Completá tu registro con la invitación
        </p>
      </div>

      {invite.status === 'missing' ? (
        <div className="rounded-lg border border-border bg-surface-1 p-5 text-center shadow-panel">
          <p className="m-0 text-[14px] font-medium text-fg">
            Necesitás una invitación
          </p>
          <p className="mt-2 text-[13px] text-fg-muted">
            Pedile a tu docente el link del mail. El registro libre está
            cerrado.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="mt-4"
            onClick={() => navigate('/login')}
          >
            Ir a iniciar sesión
          </Button>
        </div>
      ) : null}

      {invite.status === 'loading' ? (
        <p className="text-center text-[13px] text-fg-muted">
          Validando invitación…
        </p>
      ) : null}

      {invite.status === 'error' ? (
        <div className="rounded-lg border border-border bg-surface-1 p-5 text-center shadow-panel">
          <p className="m-0 text-[14px] font-medium text-critical" role="alert">
            {invite.message}
          </p>
          <Button
            type="button"
            variant="ghost"
            className="mt-4"
            onClick={() => navigate('/login')}
          >
            Ir a iniciar sesión
          </Button>
        </div>
      ) : null}

      {invite.status === 'ready' ? (
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-lg border border-border bg-surface-1 p-5 shadow-panel"
        >
          <div className="rounded-md border border-border bg-surface-2/80 px-3 py-2 text-[13px]">
            <p className="m-0 text-fg-faint">Vas a registrarte como</p>
            <p className="m-0 mt-0.5 font-semibold text-fg">
              {roleLabel(invite.role)} · {invite.email}
            </p>
            {invite.courseName ? (
              <p className="m-0 mt-1 text-[12px] text-fg-muted">
                {invite.courseName}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="register-name">Nombre (opcional)</Label>
            <Input
              id="register-name"
              type="text"
              name="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Cómo querés que te llamemos"
            />
          </div>
          <div>
            <Label htmlFor="register-password">Contraseña</Label>
            <Input
              id="register-password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 4 caracteres"
            />
          </div>

          {error ? (
            <p className="m-0 text-[13px] text-critical" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? 'Creando…' : 'Crear cuenta'}
          </Button>
        </form>
      ) : null}
    </div>
  )
}
