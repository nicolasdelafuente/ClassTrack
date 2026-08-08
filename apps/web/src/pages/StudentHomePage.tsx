import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchCurrentCourse,
  fetchMyCourseGroups,
  joinGroupAsStudent,
  leaveGroupAsStudent,
} from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { roleLabel } from '../auth/roles'
import { Button } from '../components/atoms/Button'
import { fieldControlClassName } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import { Text } from '../components/atoms/Text'
import { StateBox } from '../components/molecules/StateBox'
import { AppShell } from '../components/templates/AppShell'
import { cn } from '../lib/cn'
import type { StudentGroupEnrollment } from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: StudentGroupEnrollment }

/**
 * Student home: join/leave groups while enrollment is open (CT-045).
 */
export function StudentHomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const name = user?.displayName?.trim() || 'hola'
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [leaveReason, setLeaveReason] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const course = await fetchCurrentCourse()
      const data = await fetchMyCourseGroups(course.id)
      setState({ status: 'ready', data })
    } catch (err) {
      setState({
        status: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'No se pudo cargar tu cursada. ¿Corriste el seed?',
      })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  async function handleJoin(groupId: string) {
    setBusyId(groupId)
    try {
      const data = await joinGroupAsStudent(groupId)
      setState({ status: 'ready', data })
      setLeaveReason('')
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudo unir al grupo',
      )
    } finally {
      setBusyId(null)
    }
  }

  async function handleLeave(groupId: string) {
    const reason = leaveReason.trim()
    if (reason.length < 5) {
      window.alert('Escribí una justificación de al menos 5 caracteres')
      return
    }
    setBusyId(groupId)
    try {
      const data = await leaveGroupAsStudent(groupId, reason)
      setState({ status: 'ready', data })
      setLeaveReason('')
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudo salir del grupo',
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AppShell>
      <section className="mx-auto flex max-w-lg flex-col gap-6 pt-4 sm:pt-8">
        <header className="text-center">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-wide text-accent">
            Espacio {roleLabel('student').toLowerCase()}
          </p>
          <h1 className="mt-3 text-[28px] font-semibold leading-tight tracking-tight text-fg">
            {name === 'hola' ? 'Hola' : `Hola, ${name}`}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
            Elegí un grupo con cupo. Si necesitás cambiar, salí con una
            justificación mientras la inscripción esté abierta.
          </p>
        </header>

        {state.status === 'loading' ? (
          <Text className="text-center text-fg-muted">Cargando grupos…</Text>
        ) : null}

        {state.status === 'error' ? (
          <StateBox title="No pudimos cargar" message={state.message} />
        ) : null}

        {state.status === 'ready' ? (
          <>
            <div className="rounded-lg border border-border bg-surface-1 px-4 py-3 text-left shadow-panel">
              <p className="m-0 text-[13px] font-medium text-fg">
                {state.data.course.name}
              </p>
              <p className="mt-1 m-0 text-[12px] text-fg-muted">
                Inscripción{' '}
                <strong>
                  {state.data.course.groupEnrollmentOpen
                    ? 'abierta'
                    : 'cerrada'}
                </strong>
                {state.data.myGroup
                  ? ` · Estás en G${state.data.myGroup.number}`
                  : ' · Todavía no estás en un grupo'}
              </p>
            </div>

            {state.data.myGroup && state.data.course.groupEnrollmentOpen ? (
              <div className="rounded-lg border border-border bg-surface-1 px-4 py-3 text-left shadow-panel">
                <Label htmlFor="leave-reason">
                  Justificación para salir de G{state.data.myGroup.number}
                </Label>
                <textarea
                  id="leave-reason"
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Contá por qué querés cambiar de grupo…"
                  className={cn(fieldControlClassName, 'mt-1 min-h-[4.5rem]')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2"
                  disabled={busyId !== null}
                  onClick={() =>
                    void handleLeave(state.data.myGroup!.id)
                  }
                >
                  Salir del grupo
                </Button>
              </div>
            ) : null}

            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {state.data.groups.map((g) => {
                const title = g.name?.trim() || `Grupo ${g.number}`
                const canJoin =
                  state.data.course.groupEnrollmentOpen &&
                  !state.data.myGroup &&
                  g.spotsLeft > 0

                return (
                  <li
                    key={g.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-1 px-3.5 py-3 shadow-panel"
                  >
                    <div className="min-w-0">
                      <p className="m-0 truncate text-[14px] font-semibold text-fg">
                        {title}
                        {g.isMine ? ' · tu grupo' : ''}
                      </p>
                      <p className="mt-0.5 m-0 text-[12px] tabular-nums text-fg-muted">
                        {g.memberCount}/{g.capacity}
                        {g.spotsLeft === 0 ? ' · sin cupo' : ` · ${g.spotsLeft} libres`}
                      </p>
                    </div>
                    {canJoin ? (
                      <Button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => void handleJoin(g.id)}
                      >
                        Unirme
                      </Button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </>
        ) : null}

        <div className="flex justify-center pb-8">
          <Button type="button" variant="ghost" onClick={handleLogout}>
            Salir
          </Button>
        </div>
      </section>
    </AppShell>
  )
}
