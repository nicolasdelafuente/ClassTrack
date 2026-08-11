import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  fetchLoginHints,
  loginUser,
  type LoginHintAccount,
} from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { homePathForRole, roleLabel } from '../auth/roles'
import { Button } from '../components/atoms/Button'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import { Panel } from '../components/atoms/Panel'
import { cn } from '../lib/cn'

export function LoginPage() {
  const { isAuthenticated, user, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [hintPassword, setHintPassword] = useState('demo123')
  const [hintAccounts, setHintAccounts] = useState<LoginHintAccount[]>([])

  useEffect(() => {
    let cancelled = false
    void fetchLoginHints()
      .then((hints) => {
        if (cancelled) return
        setHintPassword(hints.password)
        setHintAccounts(hints.accounts)
      })
      .catch(() => {
        if (!cancelled) setHintAccounts([])
      })
    return () => {
      cancelled = true
    }
  }, [])

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

  const teachers = hintAccounts.filter((a) => a.role === 'teacher')
  const students = hintAccounts.filter((a) => a.role === 'student')

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 px-4 py-10">
      <div className="mb-2 text-center">
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

      <Panel className="p-5">
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="flex flex-col gap-4"
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
              placeholder="tu@email.com"
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
      </Panel>

      {hintAccounts.length > 0 ? (
        <Panel tone="soft" className="p-5">
          <h2 className="m-0 text-[15px] font-semibold tracking-tight text-fg">
            Cuentas de prueba (seed)
          </h2>
          <p className="mt-1.5 text-[13px] text-fg-muted">
            Contraseña para todas:{' '}
            <code className="rounded-md border border-border bg-surface-1 px-1.5 py-0.5 text-[12px] font-semibold text-fg">
              {hintPassword}
            </code>
          </p>
          <p className="mt-1 text-[12px] text-fg-faint">
            Tocá un mail para entrar con esa cuenta.
          </p>

          {teachers.length > 0 ? (
            <div className="mt-4">
              <p className="m-0 mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-fg-faint">
                Docentes
              </p>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {teachers.map((account) => (
                  <HintRow
                    key={account.email}
                    account={account}
                    disabled={submitting}
                    onPick={() => void enterAs(account.email, hintPassword)}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {students.length > 0 ? (
            <div className="mt-4">
              <p className="m-0 mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-fg-faint">
                Alumnos (algunos)
              </p>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {students.map((account) => (
                  <HintRow
                    key={account.email}
                    account={account}
                    disabled={submitting}
                    onPick={() => void enterAs(account.email, hintPassword)}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </Panel>
      ) : null}

      <p className="mt-1 text-center text-[13px] text-fg-muted">
        Si te invitaron, usá el link del mail para registrarte.
      </p>
    </div>
  )
}

function HintRow({
  account,
  disabled,
  onPick,
}: {
  account: LoginHintAccount
  disabled: boolean
  onPick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onPick}
        className={cn(
          'flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-surface-1 px-3 py-2 text-left transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out',
          'hover:border-border-strong hover:bg-surface-hover hover:shadow-lift motion-safe:hover:-translate-y-px',
          'motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-fg">
            {account.displayName || account.email}
          </span>
          <span className="block truncate text-[12px] text-fg-faint">
            {account.email}
          </span>
        </span>
        <span className="shrink-0 text-[11px] font-medium text-fg-muted">
          {roleLabel(account.role)}
        </span>
      </button>
    </li>
  )
}
