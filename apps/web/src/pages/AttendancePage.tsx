import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  fetchAttendanceRoster,
  patchAttendanceMark,
} from '../api/client'
import { AppShell } from '../components/AppShell'
import {
  todayDateInputValue,
  type AttendanceRoster,
  type AttendanceStudent,
} from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; roster: AttendanceRoster }

export function AttendancePage() {
  const { courseId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')
  const dateParam = searchParams.get('date')
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : todayDateInputValue()

  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (!dateParam) {
      const next = new URLSearchParams(searchParams)
      next.set('date', date)
      setSearchParams(next, { replace: true })
    }
  }, [date, dateParam, searchParams, setSearchParams])

  useEffect(() => {
    if (!courseId) {
      setState({ status: 'error', message: 'Falta el id de la cursada' })
      return
    }

    let cancelled = false

    async function load() {
      setState({ status: 'loading' })
      try {
        const roster = await fetchAttendanceRoster(courseId, date, groupId)
        if (!cancelled) setState({ status: 'ready', roster })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'No se pudo cargar la asistencia',
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [courseId, date, groupId])

  const totals = useMemo(() => {
    if (state.status !== 'ready') return { students: 0, present: 0 }
    const students = state.roster.groups.flatMap((g) => g.students)
    return {
      students: students.length,
      present: students.filter((s) => s.present).length,
    }
  }, [state])

  const updateStudent = useCallback(
    (studentId: string, patch: Partial<Pick<AttendanceStudent, 'present' | 'participated'>>) => {
      setState((prev) => {
        if (prev.status !== 'ready') return prev
        return {
          status: 'ready',
          roster: {
            ...prev.roster,
            groups: prev.roster.groups.map((g) => ({
              ...g,
              students: g.students.map((s) =>
                s.id === studentId ? { ...s, ...patch } : s,
              ),
            })),
          },
        }
      })
    },
    [],
  )

  async function toggleField(
    student: AttendanceStudent,
    field: 'present' | 'participated',
  ) {
    if (!courseId) return
    const nextValue = !student[field]
    updateStudent(student.id, { [field]: nextValue })
    setSavingId(student.id)
    try {
      const saved = await patchAttendanceMark(courseId, {
        date,
        studentId: student.id,
        [field]: nextValue,
      })
      updateStudent(student.id, {
        present: saved.present,
        participated: saved.participated,
      })
    } catch (err) {
      updateStudent(student.id, { [field]: student[field] })
      window.alert(
        err instanceof Error ? err.message : 'No se pudo guardar la marca',
      )
    } finally {
      setSavingId(null)
    }
  }

  function onDateChange(nextDate: string) {
    const next = new URLSearchParams(searchParams)
    next.set('date', nextDate)
    setSearchParams(next)
  }

  if (state.status === 'loading') {
    return (
      <AppShell showBack>
        <p className="state-msg">Cargando asistencia…</p>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack>
        <div className="state-box" role="alert">
          <h1>No se pudo cargar la asistencia</h1>
          <p>{state.message}</p>
        </div>
      </AppShell>
    )
  }

  const { roster } = state
  const scopedGroup =
    groupId && roster.groups.length === 1 ? roster.groups[0] : null

  return (
    <AppShell
      showBack
      courseName={roster.course.name}
      courseCode={roster.course.code}
    >
      <section className="attendance">
        <header className="attendance__header">
          <div>
            <h1 className="attendance__title">
              {scopedGroup
                ? `Asistencia · Grupo ${scopedGroup.number}`
                : 'Asistencia de la cursada'}
            </h1>
            <p className="attendance__subtitle">
              {totals.present}/{totals.students} presentes · guardado al tocar
            </p>
          </div>

          <label className="attendance__date">
            <span>Fecha</span>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </label>
        </header>

        {scopedGroup ? (
          <p className="attendance__scope">
            Vista de un grupo.{' '}
            <Link to={`/courses/${courseId}/attendance?date=${date}`}>
              Ver toda la cursada
            </Link>
          </p>
        ) : null}

        <div className="attendance__groups">
          {roster.groups.map((group) => (
            <section key={group.id} className="attendance-group">
              <header className="attendance-group__head">
                <h2>
                  Grupo {group.number}
                  {group.name ? ` · ${group.name}` : ''}
                </h2>
                {!scopedGroup ? (
                  <Link
                    className="attendance-group__link"
                    to={`/courses/${courseId}/attendance?date=${date}&groupId=${group.id}`}
                  >
                    Solo este grupo
                  </Link>
                ) : null}
              </header>

              <ul className="attendance-list">
                {group.students.map((student) => {
                  const busy = savingId === student.id
                  return (
                    <li key={student.id} className="attendance-row">
                      <div className="attendance-row__info">
                        <span className="attendance-row__name">
                          {student.fullName}
                        </span>
                        {student.legajo ? (
                          <span className="attendance-row__meta">
                            Legajo {student.legajo}
                          </span>
                        ) : null}
                      </div>
                      <div className="attendance-row__toggles">
                        <button
                          type="button"
                          className={`toggle ${student.present ? 'toggle--on' : ''}`}
                          disabled={busy}
                          aria-pressed={student.present}
                          onClick={() => void toggleField(student, 'present')}
                        >
                          Presente
                        </button>
                        <button
                          type="button"
                          className={`toggle ${student.participated ? 'toggle--on' : ''}`}
                          disabled={busy}
                          aria-pressed={student.participated}
                          onClick={() =>
                            void toggleField(student, 'participated')
                          }
                        >
                          Participó
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </AppShell>
  )
}
