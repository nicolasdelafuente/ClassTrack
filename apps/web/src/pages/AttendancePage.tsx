import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  fetchAttendanceRoster,
  patchAttendanceMark,
} from '../api/client'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { Text } from '../components/atoms/Text'
import { StateBox, StateMessage } from '../components/molecules/StateBox'
import { AttendanceGroupBlock } from '../components/organisms/AttendanceGroupBlock'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'
import {
  todayDateInputValue,
  type AttendanceRoster,
  type AttendanceStudent,
  type SprintStatus,
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

export function AttendancePage() {
  const { courseId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')
  const dateParam = searchParams.get('date')
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : todayDateInputValue()

  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  useEffect(() => {
    if (!dateParam) {
      const next = new URLSearchParams(searchParams)
      next.set('date', date)
      setSearchParams(next, { replace: true })
    }
  }, [date, dateParam, searchParams, setSearchParams])

  useEffect(() => {
    if (!savedId) return
    const t = window.setTimeout(() => setSavedId(null), 1500)
    return () => window.clearTimeout(t)
  }, [savedId])

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
    if (!courseId) return
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
    const next = new URLSearchParams(searchParams)
    next.set('date', nextDate)
    setSearchParams(next)
  }

  if (state.status === 'loading') {
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
          description="Marcá presente y participación. Se guarda al tocar — con feedback visual."
          badge={
            <StatusBadge
              status={tone}
              pulseCritical
              label={`${Math.round(presentRatio * 100)}% presentes`}
            />
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
                <Label htmlFor="attendance-date">Fecha</Label>
                <Input
                  id="attendance-date"
                  type="date"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-auto min-w-[11rem]"
                />
              </div>
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
