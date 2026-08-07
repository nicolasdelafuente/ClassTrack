import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  fetchAttendanceRoster,
  fetchCourseSchedule,
  patchAttendanceMark,
} from '../api/client'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Label } from '../components/atoms/Label'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { Text } from '../components/atoms/Text'
import { StateBox, StateMessage } from '../components/molecules/StateBox'
import { AttendanceGroupBlock } from '../components/organisms/AttendanceGroupBlock'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'
import type {
  AttendanceRoster,
  AttendanceStudent,
  ScheduleSession,
  SprintStatus,
} from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; roster: AttendanceRoster }

function attendanceTone(present: number, total: number): SprintStatus {
  if (total === 0) return 'unknown'
  const ratio = present / total
  if (ratio >= 0.85) return 'ok'
  if (ratio >= 0.6) return 'attention'
  return 'critical'
}

function pickDefaultDate(
  sessions: ScheduleSession[],
  preferred?: string | null,
) {
  const open = sessions.filter((s) => s.allowsAttendance)
  if (open.length === 0) return null
  if (preferred && open.some((s) => s.date === preferred)) return preferred
  const today = new Date()
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const pastOrToday = [...open].reverse().find((s) => s.date <= todayIso)
  return pastOrToday?.date ?? open[0].date
}

export function AttendancePage() {
  const { courseId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')
  const dateParam = searchParams.get('date')

  const [attendanceDates, setAttendanceDates] = useState<ScheduleSession[]>([])
  const [date, setDate] = useState<string | null>(null)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [bootError, setBootError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) {
      setBootError('Falta el id de la cursada')
      return
    }
    let cancelled = false
    async function boot() {
      try {
        const schedule = await fetchCourseSchedule(courseId)
        if (cancelled) return
        const open = schedule.sessions.filter((s) => s.allowsAttendance)
        setAttendanceDates(open)
        const chosen = pickDefaultDate(open, dateParam)
        if (!chosen) {
          setBootError('No hay clases con asistencia en el cronograma')
          return
        }
        setDate(chosen)
        if (dateParam !== chosen) {
          const next = new URLSearchParams(searchParams)
          next.set('date', chosen)
          setSearchParams(next, { replace: true })
        }
      } catch (err) {
        if (!cancelled) {
          setBootError(
            err instanceof Error
              ? err.message
              : 'No se pudo cargar el cronograma',
          )
        }
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once per course; dateParam applied inside
  }, [courseId])

  useEffect(() => {
    if (!savedId) return
    const t = window.setTimeout(() => setSavedId(null), 1500)
    return () => window.clearTimeout(t)
  }, [savedId])

  useEffect(() => {
    const courseIdStr = courseId
    const dateStr = date
    if (!courseIdStr || !dateStr) return

    let cancelled = false
    async function load() {
      setState({ status: 'loading' })
      try {
        const roster = await fetchAttendanceRoster(
          courseIdStr,
          dateStr,
          groupId,
        )
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
    if (state.status !== 'ready') return { students: 0, present: 0, participated: 0 }
    const students = state.roster.groups.flatMap((g) => g.students)
    return {
      students: students.length,
      present: students.filter((s) => s.present).length,
      participated: students.filter((s) => s.participated).length,
    }
  }, [state])

  const updateStudent = useCallback(
    (
      studentId: string,
      patch: Partial<Pick<AttendanceStudent, 'present' | 'participated'>>,
    ) => {
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
    if (!courseId || !date) return
    const nextValue = !student[field]
    updateStudent(student.id, { [field]: nextValue })
    setSavingId(student.id)
    setSavedId(null)
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
      setSavedId(student.id)
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
    setDate(nextDate)
    const next = new URLSearchParams(searchParams)
    next.set('date', nextDate)
    setSearchParams(next)
  }

  if (bootError) {
    return (
      <AppShell showBack>
        <StateBox title="Asistencia no disponible" message={bootError} />
      </AppShell>
    )
  }

  if (!date || state.status === 'loading') {
    return (
      <AppShell showBack>
        <StateMessage>Cargando asistencia…</StateMessage>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack>
        <StateBox
          title="No se pudo cargar la asistencia"
          message={state.message}
        />
      </AppShell>
    )
  }

  const { roster } = state
  const scopedGroup =
    groupId && roster.groups.length === 1 ? roster.groups[0] : null
  const tone = attendanceTone(totals.present, totals.students)
  const presentRatio =
    totals.students === 0 ? 0 : totals.present / totals.students
  const session = roster.session

  return (
    <AppShell
      showBack
      courseName={roster.course.name}
      courseCode={roster.course.code}
    >
      <section className="flex flex-col gap-4">
        <PageHero
          eyebrow="Presentismo"
          title={
            scopedGroup
              ? `Grupo ${scopedGroup.number}${scopedGroup.name ? ` · ${scopedGroup.name}` : ''}`
              : 'Asistencia de la cursada'
          }
          description={
            session.isMandatory
              ? 'Clase obligatoria: las ausencias cuentan para el cupo de faltas.'
              : 'Clase optativa: podés tomar lista, pero las ausencias no cuentan para el cupo de faltas.'
          }
          badge={
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                status={session.isMandatory ? 'attention' : 'ok'}
                label={session.isMandatory ? 'Obligatoria' : 'Optativa'}
              />
              <StatusBadge
                status={tone}
                pulseCritical
                label={`${Math.round(presentRatio * 100)}% presentes`}
              />
            </div>
          }
          stats={[
            {
              label: 'Presentes',
              value: `${totals.present}/${totals.students}`,
            },
            {
              label: 'Participaron',
              value: `${totals.participated}/${totals.students}`,
            },
            { label: 'Grupos', value: roster.groups.length },
            { label: 'Fecha', value: date },
          ]}
          actions={
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label htmlFor="attendance-date">Fecha del cronograma</Label>
                <select
                  id="attendance-date"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="mt-1 min-h-10 min-w-[14rem] rounded-md border border-border bg-surface-1 px-2.5 text-[13px] text-fg shadow-panel"
                >
                  {attendanceDates.map((s) => (
                    <option key={s.id} value={s.date}>
                      {s.date}
                      {s.isMandatory ? ' · obligatoria' : ' · optativa'}
                    </option>
                  ))}
                </select>
              </div>
              <ButtonLink
                variant="ghost"
                className="min-h-10"
                to={`/courses/${courseId}/schedule`}
              >
                Ver cronograma
              </ButtonLink>
              {scopedGroup ? (
                <ButtonLink
                  variant="ghost"
                  className="min-h-10"
                  to={`/courses/${courseId}/groups/${scopedGroup.id}`}
                >
                  Abrir workspace
                </ButtonLink>
              ) : null}
            </div>
          }
          footer={
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px] font-medium text-fg-faint">
                <span>Presentismo del día</span>
                <span className="tabular-nums text-fg">
                  {Math.round(presentRatio * 100)}%
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-surface-2"
                role="progressbar"
                aria-valuenow={Math.round(presentRatio * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Porcentaje de presentes"
              >
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
                  style={{ width: `${presentRatio * 100}%` }}
                />
              </div>
            </div>
          }
        />

        {scopedGroup ? (
          <Text className="text-[13px]">
            Vista de un grupo.{' '}
            <ButtonLink
              variant="text"
              to={`/courses/${courseId}/attendance?date=${date}`}
            >
              Ver toda la cursada
            </ButtonLink>
          </Text>
        ) : null}

        <div className="flex flex-col gap-3">
          {roster.groups.map((group, index) => (
            <AttendanceGroupBlock
              key={group.id}
              group={group}
              courseId={courseId}
              date={date}
              scoped={Boolean(scopedGroup)}
              savingId={savingId}
              savedId={savedId}
              stagger={((index % 4) + 1) as 1 | 2 | 3 | 4}
              onToggle={(student, field) => void toggleField(student, field)}
            />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
