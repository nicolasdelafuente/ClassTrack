import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { registerUser } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/atoms/Button'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'

export function RegisterPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user = await registerUser({
        email,
        password,
        displayName: displayName.trim() || undefined,
      })
      login(user)
      navigate('/', { replace: true })
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
          Creá tu cuenta de docente
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-lg border border-border bg-surface-1 p-5 shadow-panel"
      >
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
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
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

      <p className="mt-5 text-center text-[13px] text-fg-muted">
        ¿Ya tenés cuenta?{' '}
        <Link className="font-semibold text-accent hover:underline" to="/login">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
