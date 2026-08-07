import { useEffect, useState } from 'react'
import { fetchCourseGroups, fetchCurrentCourse } from '../api/client'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Heading, Text } from '../components/atoms/Text'
import { StateBox, StateMessage } from '../components/molecules/StateBox'
import { GroupCard } from '../components/organisms/GroupCard'
import { AppShell } from '../components/templates/AppShell'
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
        const course = await fetchCurrentCourse()
        const groups = await fetchCourseGroups(course.id)
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
        <StateMessage>Cargando tablero…</StateMessage>
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

  return (
    <AppShell courseName={course.name} courseCode={course.code}>
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Heading>Tablero de grupos</Heading>
            <Text className="mt-1">
              {groups.length} grupos · semáforo de sprints de un vistazo
            </Text>
          </div>
          <ButtonLink to={`/courses/${course.id}/attendance`}>
            Tomar asistencia
          </ButtonLink>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} courseId={course.id} />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
