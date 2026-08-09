import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchCurrentCourse,
  fetchMyGroup,
  fetchStudentSprintOverview,
} from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { roleLabel } from '../auth/roles'
import { Button } from '../components/atoms/Button'
import { Panel } from '../components/atoms/Panel'
import { ListRow } from '../components/molecules/ListRow'
import { StateBox } from '../components/molecules/StateBox'
import { StudentHomeSkeleton } from '../components/organisms/PageSkeletons'
import { AppShell } from '../components/templates/AppShell'
import {
  SHEET_STATUS_LABELS,
  type SheetStatus,
  type SprintSheetOverview,
  type StudentMyGroup,
} from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      group: NonNullable<StudentMyGroup['group']>
      overview: SprintSheetOverview
    }
  | { status: 'no_group' }

function statusLabel(s: SheetStatus | undefined) {
  return s ? SHEET_STATUS_LABELS[s] : 'Sin crear'
}

/**
 * Student home: group + sprint sheets S1…S5 (CT-046).
 */
export function StudentHomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const name = user?.displayName?.trim() || 'hola'
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    try {
      const course = await fetchCurrentCourse()
      const { group } = await fetchMyGroup(course.id)
      if (!group) {
        setState({ status: 'no_group' })
        return
      }
      const overview = await fetchStudentSprintOverview(group.id)
      setState({ status: 'ready', group, overview })
    } catch (err) {
      setState({
        status: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'No se pudo cargar tu grupo. ¿Corriste el seed?',
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
            Armá la ficha de inicio de cada sprint, enviála a revisión y, cuando
            esté aprobada, completá la ficha de fin.
          </p>
        </header>

        {state.status === 'loading' ? <StudentHomeSkeleton /> : null}

        {state.status === 'error' ? (
          <StateBox title="No pudimos cargar" message={state.message} />
        ) : null}

        {state.status === 'no_group' ? (
          <StateBox
            title="Todavía no tenés grupo"
            message="Cuando el docente te asigne a un grupo, acá vas a ver las fichas de sprint."
          />
        ) : null}

        {state.status === 'ready' ? (
          <>
            <Panel className="px-4 py-3 text-left">
              <p className="m-0 text-[13px] font-medium text-fg">
                {state.group.course.name}
              </p>
              <p className="mt-1 m-0 text-[12px] text-fg-muted">
                Grupo {state.group.number}
                {state.group.name ? ` · ${state.group.name}` : ''}
              </p>
            </Panel>

            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {state.overview.sprints.map((s) => (
                <ListRow
                  key={s.sprintNumber}
                  as="li"
                  className="px-3.5 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="m-0 text-[15px] font-semibold text-fg">
                      Sprint {s.sprintNumber}
                    </p>
                    <Link
                      className="text-[13px] font-medium text-accent no-underline hover:underline"
                      to={`/alumno/grupos/${state.group.id}/sprints/${s.sprintNumber}`}
                    >
                      Abrir →
                    </Link>
                  </div>
                  <p className="mt-1.5 m-0 text-[12px] text-fg-muted">
                    Inicio: {statusLabel(s.start?.status)} · Fin:{' '}
                    {statusLabel(s.end?.status)}
                  </p>
                </ListRow>
              ))}
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
