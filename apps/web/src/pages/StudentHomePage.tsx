import { useCallback, useEffect, useState } from 'react'
import {
  fetchCurrentCourse,
  fetchMyGroup,
  fetchStudentSprintOverview,
} from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { roleLabel } from '../auth/roles'
import { Panel } from '../components/atoms/Panel'
import { ListRow } from '../components/molecules/ListRow'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
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
  const { user } = useAuth()
  const name = user?.displayName?.trim() || ''
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

  const title = name ? `Hola, ${name}` : 'Hola'

  return (
    <AppShell>
      <section className="mx-auto flex max-w-lg flex-col gap-4 pb-10">
        <PageHero
          eyebrow={`Espacio ${roleLabel('student').toLowerCase()}`}
          title={title}
          description="Armá la ficha de inicio de cada sprint, enviála a revisión y, cuando esté aprobada, completá la ficha de fin."
          stats={
            state.status === 'ready'
              ? [
                  {
                    label: 'Cursada',
                    value: state.group.course.name,
                  },
                  {
                    label: 'Grupo',
                    value: state.group.name
                      ? `${state.group.number} · ${state.group.name}`
                      : String(state.group.number),
                  },
                ]
              : undefined
          }
        />

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
          <Panel as="section" tone="soft" className="p-4">
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {state.overview.sprints.map((s) => (
                <ListRow
                  key={s.sprintNumber}
                  to={`/alumno/grupos/${state.group.id}/sprints/${s.sprintNumber}`}
                  className="block px-3.5 py-3 text-fg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="m-0 text-[15px] font-semibold text-fg">
                      Sprint {s.sprintNumber}
                    </p>
                    <span className="text-[13px] font-medium text-accent">
                      Abrir →
                    </span>
                  </div>
                  <p className="mt-1.5 m-0 text-[12px] text-fg-muted">
                    Inicio: {statusLabel(s.start?.status)} · Fin:{' '}
                    {statusLabel(s.end?.status)}
                  </p>
                </ListRow>
              ))}
            </ul>
          </Panel>
        ) : null}
      </section>
    </AppShell>
  )
}
