import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  fetchAttendanceRoster,
  fetchCourseSchedule,
  patchAttendanceMark,
} from '../api/client'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Label } from '../components/atoms/Label'
import { MandatoryChip } from '../components/atoms/MandatoryChip'
import { Select } from '../components/atoms/Select'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { Text } from '../components/atoms/Text'
import { HeroActions } from '../components/molecules/HeroActions'
import { StateBox } from '../components/molecules/StateBox'
import { AttendanceGroupBlock } from '../components/organisms/AttendanceGroupBlock'
import { AttendancePageSkeleton } from '../components/organisms/PageSkeletons'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'
import type {
  AttendanceRoster,
  AttendanceStudent,
  ScheduleSession,
  SprintStatus,
} from '../types'
import { CLASS_ACTIVITY_TYPE_LABELS } from '../types'

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
    if (!courseId || !date) return
    const courseIdStr: string = courseId
    const dateStr: string = date

    let cancelled = false
    async function load() {
      setState({ status: 'loading' })
      try {
        const roster = await fetchAttendanceRoster(
          courseIdStr,
          dateStr!,
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
    if (state.status !== 'ready') {
      return { students: 0, present: 0, participated: 0, libre: 0 }
    }
    const students = state.roster.groups.flatMap((g) => g.students)
    return {
      students: students.length,
      present: students.filter((s) => s.present).length,
      participated: students.filter((s) => s.participated).length,
      libre: students.filter((s) => s.isLibre).length,
    }
  }, [state])

  const updateStudent = useCallback(
    (
      studentId: string,
      patch: Partial<
        Pick<
          AttendanceStudent,
          | 'present'
          | 'participated'
          | 'absenceCount'
          | 'maxAbsencesAllowed'
          | 'isLibre'
        >
      >,
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
        absenceCount: saved.absenceCount,
        maxAbsencesAllowed: saved.maxAbsencesAllowed,
        isLibre: saved.isLibre,
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
        <AttendancePageSkeleton />
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
  const scheduleDay =
    attendanceDates.find((s) => s.date === date) ?? null
  const dayActivities = scheduleDay?.items ?? []

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
              ? `Clase obligatoria: las ausencias cuentan. Cupo: ${roster.course.maxAbsencesAllowed} faltas (más → libre).`
              : 'Clase optativa: podés tomar lista, pero las ausencias no cuentan para el cupo de faltas.'
          }
          badge={
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                status={session.isMandatory ? 'ok' : 'unknown'}
                label={session.isMandatory ? 'Obligatoria' : 'Optativa'}
              />
              <StatusBadge
                status={tone}
                pulseCritical
                label={`${Math.round(presentRatio * 100)}% presentes`}
              />
              {totals.libre > 0 ? (
                <StatusBadge
                  status="critical"
                  pulseCritical
                  label={`${totals.libre} en libre`}
                />
              ) : null}
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
            {
              label: 'En libre',
              value: `${totals.libre}`,
            },
            {
              label: 'Cupo faltas',
              value: String(roster.course.maxAbsencesAllowed),
            },
          ]}
          actions={
            <div className="flex w-full flex-col gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <Label htmlFor="attendance-date">Fecha del cronograma</Label>
                  <Select
                    id="attendance-date"
                    value={date}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="mt-1 min-w-[14rem]"
                  >
                    {attendanceDates.map((s) => (
                      <option key={s.id} value={s.date}>
                        {s.date}
                        {s.isMandatory ? ' · obligatoria' : ' · optativa'}
                        {s.items[0] ? ` · ${s.items[0].title}` : ''}
                      </option>
                    ))}
                  </Select>
                </div>
                <HeroActions
                  primary={[
                    {
                      label: 'Ver cronograma',
                      to: `/courses/${courseId}/schedule`,
                      variant: 'ghost',
                    },
                    ...(scopedGroup
                      ? [
                          {
                            label: 'Abrir workspace',
                            to: `/courses/${courseId}/groups/${scopedGroup.id}`,
                            variant: 'ghost' as const,
                          },
                        ]
                      : []),
                  ]}
                />
              </div>

              {dayActivities.length > 0 ? (
                <div className="rounded-md border border-border bg-surface-2/70 px-3 py-2.5">
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
                    Actividades del día
                  </p>
                  <ul className="mt-1.5 m-0 flex list-none flex-col gap-1 p-0">
                    {dayActivities.map((item) => (
                      <li key={item.id} className="min-w-0">
                        <span className="block text-[14px] font-medium text-fg">
                          {item.title}
                        </span>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[12px] text-fg-faint">
                            {CLASS_ACTIVITY_TYPE_LABELS[item.activityType]}
                          </span>
                          <MandatoryChip mandatory={item.isMandatory} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
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
