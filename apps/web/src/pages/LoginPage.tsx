import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { loginUser } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { DEMO_STUDENT, DEMO_TEACHER } from '../auth/demoAccounts'
import { homePathForRole } from '../auth/roles'
import { Button } from '../components/atoms/Button'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'

export function LoginPage() {
  const { isAuthenticated, user, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated && user) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  async function enterAs(nextEmail: string, nextPassword: string) {
    setError(null)
    setSubmitting(true)
    setEmail(nextEmail)
    setPassword(nextPassword)
    try {
      const next = await loginUser({ email: nextEmail, password: nextPassword })
      login(next)
      navigate(homePathForRole(next.role), { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo iniciar sesión',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    await enterAs(email, password)
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
          Docentes y alumnos, cada uno en su espacio
        </p>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-full"
          disabled={submitting}
          onClick={() => void enterAs(DEMO_TEACHER.email, DEMO_TEACHER.password)}
        >
          Entrar como docente
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-full"
          disabled={submitting}
          onClick={() => void enterAs(DEMO_STUDENT.email, DEMO_STUDENT.password)}
        >
          Entrar como alumno
        </Button>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="flex flex-col gap-4 rounded-lg border border-border bg-surface-1 p-5 shadow-panel"
      >
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="docente@classtrack.local"
          />
        </div>
        <div>
          <Label htmlFor="login-password">Contraseña</Label>
          <Input
            id="login-password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <p className="m-0 text-[13px] text-critical" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={submitting} className="mt-1 w-full">
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-fg-muted">
        Si te invitaron, usá el link del mail para registrarte.
      </p>
      <p className="mt-3 text-center text-[12px] leading-relaxed text-fg-faint">
        Las cuentas demo usan la contraseña <code>demo123</code> (solo local).
      </p>
    </div>
  )
}
