import { useAuth } from '../auth/AuthContext'
import { roleLabel } from '../auth/roles'
import { Button } from '../components/atoms/Button'
import { AppShell } from '../components/templates/AppShell'
import { useNavigate } from 'react-router-dom'

/**
 * Friendly landing for students until their features ship.
 * Keep it warm and clear — not an error page.
 */
export function StudentHomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const name = user?.displayName?.trim() || 'hola'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-lg pt-6 text-center sm:pt-12">
        <p className="m-0 text-[12px] font-semibold uppercase tracking-wide text-accent">
          Espacio {roleLabel('student').toLowerCase()}
        </p>
        <h1 className="mt-3 text-[28px] font-semibold leading-tight tracking-tight text-fg">
          {name === 'hola' ? 'Hola' : `Hola, ${name}`}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
          Acá vas a ver tu grupo, avisos y lo que necesites para la cursada.
          Todavía lo estamos armando — pronto hay novedades.
        </p>
        <div className="mt-8 rounded-lg border border-border bg-surface-1 px-5 py-4 text-left shadow-panel">
          <p className="m-0 text-[13px] font-medium text-fg">Mientras tanto</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] text-fg-muted">
            <li>Tu cuenta ya quedó como alumno</li>
            <li>El tablero de seguimiento es para docentes</li>
            <li>Cuando haya features de alumno, aparecen acá</li>
          </ul>
        </div>
        <div className="mt-8 flex justify-center">
          <Button type="button" variant="ghost" onClick={handleLogout}>
            Salir
          </Button>
        </div>
      </section>
    </AppShell>
  )
}
