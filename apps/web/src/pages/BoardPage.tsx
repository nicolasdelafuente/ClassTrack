import { useEffect, useState } from 'react'
import { fetchCourseGroups, fetchCurrentCourse } from '../api/client'
import { AppShell } from '../components/AppShell'
import { GroupCard } from '../components/GroupCard'
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
        <p className="state-msg">Cargando tablero…</p>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell>
        <div className="state-box" role="alert">
          <h1>No hay cursada demo</h1>
          <p>{state.message}</p>
          <p className="state-box__hint">
            En la raíz del repo: <code>npm run seed</code> y{' '}
            <code>npm run dev:api</code>
          </p>
        </div>
      </AppShell>
    )
  }

  const { course, groups } = state

  return (
    <AppShell courseName={course.name} courseCode={course.code}>
      <section className="board">
        <div className="board__intro">
          <h1 className="board__title">Tablero de grupos</h1>
          <p className="board__subtitle">
            {groups.length} grupos · semáforo de sprints de un vistazo
          </p>
        </div>

        <div className="board__grid">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} courseId={course.id} />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
