import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchCourseSchedule } from '../api/client'
import { ScheduleSessionEditor } from '../components/organisms/ScheduleSessionEditor'
import { PageHero } from '../components/organisms/PageHero'
import { StateBox, StateMessage } from '../components/molecules/StateBox'
import { AppShell } from '../components/templates/AppShell'
import type { CourseSchedule, ScheduleSession } from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      schedule: CourseSchedule
      session: ScheduleSession | null
    }

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Full-page create/edit for a cronograma class (same pattern as group detail). */
export function ScheduleSessionPage() {
  const { courseId = '', sessionId } = useParams()
  const navigate = useNavigate()
  const isCreate = !sessionId || sessionId === 'new'
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const schedulePath = `/courses/${courseId}/schedule`

  useEffect(() => {
    if (!courseId) {
      setState({ status: 'error', message: 'Falta el id de la cursada' })
      return
    }
    let cancelled = false
    async function load() {
      try {
        const schedule = await fetchCourseSchedule(courseId)
        if (cancelled) return
        if (isCreate) {
          setState({ status: 'ready', schedule, session: null })
          return
        }
        const session = schedule.sessions.find((s) => s.id === sessionId)
        if (!session) {
          setState({
            status: 'error',
            message: 'No se encontró esa clase en el cronograma',
          })
          return
        }
        setState({ status: 'ready', schedule, session })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'No se pudo cargar la clase',
          })
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseId, sessionId, isCreate])

  function goBack() {
    navigate(schedulePath)
  }

  if (state.status === 'loading') {
    return (
      <AppShell showBack backTo={schedulePath} backLabel="← Cronograma">
        <StateMessage>Cargando clase…</StateMessage>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack backTo={schedulePath} backLabel="← Cronograma">
        <StateBox title="No se pudo abrir la clase" message={state.message} />
      </AppShell>
    )
  }

  const { schedule, session } = state

  return (
    <AppShell
      showBack
      backTo={schedulePath}
      backLabel="← Cronograma"
      courseName={schedule.course.name}
      courseCode={schedule.course.code}
    >
      <section className="flex w-full max-w-full min-w-0 flex-col gap-3 sm:gap-4">
        <PageHero
          compact
          eyebrow="Cronograma"
          title={isCreate ? 'Nueva clase' : 'Editar clase'}
          description={
            isCreate
              ? 'Definí fecha, actividades y si el día es obligatorio u optativo.'
              : `Clase del ${formatDate(session!.date)}. Cambiá fecha, tipo de actividad y obligatoriedad.`
          }
        />

        <ScheduleSessionEditor
          courseId={courseId}
          session={session}
          activityTypeDefaults={schedule.activityTypeDefaults}
          onCancel={goBack}
          onSaved={goBack}
          onCreated={goBack}
          onDeleted={goBack}
        />
      </section>
    </AppShell>
  )
}
