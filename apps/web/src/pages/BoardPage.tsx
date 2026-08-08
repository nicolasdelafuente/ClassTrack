import { useEffect, useState } from 'react'
import { fetchCurrentBoard } from '../api/client'
import { StateBox } from '../components/molecules/StateBox'
import { HeroActions } from '../components/molecules/HeroActions'
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
    <AppShell courseName={course.name} courseCode={course.code}>
      <section className="flex flex-col gap-4">
        <PageHero
          eyebrow="Cursada actual"
          title="Tablero de grupos"
          description={`${groups.length} grupos · semáforo de sprints de un vistazo`}
          stats={[
            { label: 'Grupos', value: groups.length },
            {
              label: 'Requieren atención',
              value: attention,
            },
          ]}
          actions={
            <HeroActions
              primary={[
                {
                  label: 'Tomar asistencia',
                  to: `/courses/${course.id}/attendance`,
                },
                {
                  label: 'Cronograma',
                  to: `/courses/${course.id}/schedule`,
                  variant: 'ghost',
                },
              ]}
              more={[
                {
                  label: 'Armar grupos',
                  to: `/courses/${course.id}/groups/setup`,
                },
                {
                  label: 'Fichas de sprint',
                  to: `/courses/${course.id}/sprint-sheets?status=in_review`,
                },
                {
                  label: 'Precalificación',
                  to: `/courses/${course.id}/grades/preliminary`,
                },
                {
                  label: 'Notas finales',
                  to: `/courses/${course.id}/grades/final`,
                },
                {
                  label: 'Invitar',
                  to: `/courses/${course.id}/invites`,
                },
                {
                  label: 'Escribir mail',
                  to: `/courses/${course.id}/compose-email`,
                },
                {
                  label: 'Duplicar cursada',
                  to: `/courses/${course.id}/duplicate`,
                },
              ]}
            />
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
