import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCurrentBoard } from '../api/client'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { StateBox } from '../components/molecules/StateBox'
import { GroupCard } from '../components/organisms/GroupCard'
import { BoardPageSkeleton } from '../components/organisms/PageSkeletons'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'
import { overallSprintStatus } from '../lib/sprintMeta'
import type { Course, GroupSummary } from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; course: Course; groups: GroupSummary[] }

/**
 * Board: contextual actions only (nav lives in the course sidebar).
 */
export function BoardPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { course, groups } = await fetchCurrentBoard()
        if (!cancelled) {
          setState({ status: 'ready', course, groups })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'No se pudo cargar la cursada. ¿Corriste el seed y la API?',
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <AppShell>
        <BoardPageSkeleton />
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell>
        <StateBox
          title="No hay cursada demo"
          message={state.message}
          hint={
            <>
              En la raíz del repo: <code>npm run seed</code> y{' '}
              <code>npm run dev:api</code>
            </>
          }
        />
      </AppShell>
    )
  }

  const { course, groups } = state
  const attention = groups.filter((g) => {
    const s = overallSprintStatus(g.sprints)
    return s === 'attention' || s === 'critical'
  }).length

  return (
    <AppShell
      courseId={course.id}
      courseName={course.name}
      courseCode={course.code}
    >
      <section className="flex flex-col gap-4">
        <PageHero
          eyebrow="Cursada actual"
          title="Tablero de grupos"
          description="Semáforo de sprints de un vistazo — las acciones de esta pantalla viven acá; el resto de módulos, en la barra lateral."
          stats={[
            {
              label: 'Grupos',
              value: (
                <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span>{groups.length}</span>
                  <Link
                    to={`/courses/${course.id}/groups/setup`}
                    className="text-[12px] font-medium text-accent no-underline hover:underline"
                  >
                    Armar grupos
                  </Link>
                </span>
              ),
            },
            {
              label: 'Requieren atención',
              value: attention,
            },
          ]}
          actions={
            <>
              <ButtonLink
                className="min-h-11 px-5 text-[14px]"
                to={`/courses/${course.id}/attendance`}
              >
                Tomar asistencia
              </ButtonLink>
              <ButtonLink
                variant="ghost"
                className="min-h-11 border-border-strong px-4 text-[14px]"
                to={`/courses/${course.id}/compose-email`}
              >
                Escribir mail
              </ButtonLink>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, index) => (
            <GroupCard
              key={group.id}
              group={group}
              courseId={course.id}
              className={
                index % 4 === 0
                  ? 'stagger-1'
                  : index % 4 === 1
                    ? 'stagger-2'
                    : index % 4 === 2
                      ? 'stagger-3'
                      : 'stagger-4'
              }
            />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
