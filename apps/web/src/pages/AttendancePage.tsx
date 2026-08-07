import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  fetchAttendanceRoster,
  patchAttendanceMark,
} from '../api/client'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import { Panel } from '../components/atoms/Panel'
import { Heading, Text } from '../components/atoms/Text'
import { StateBox, StateMessage } from '../components/molecules/StateBox'
import { AttendanceGroupBlock } from '../components/organisms/AttendanceGroupBlock'
import { AppShell } from '../components/templates/AppShell'
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
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
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

  return (
    <AppShell
      showBack
      courseName={roster.course.name}
      courseCode={roster.course.code}
    >
      <section className="flex flex-col gap-3">
        <Panel
          as="header"
          className="flex flex-wrap items-end justify-between gap-3 p-4"
        >
          <div>
            <Heading className="text-lg">
              {scopedGroup
                ? `Asistencia · Grupo ${scopedGroup.number}`
                : 'Asistencia de la cursada'}
            </Heading>
            <Text className="mt-1 text-xs tabular-nums">
              {totals.present}/{totals.students} presentes · guardado al tocar
            </Text>
          </div>

          <div>
            <Label htmlFor="attendance-date">Fecha</Label>
            <Input
              id="attendance-date"
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-auto"
            />
          </div>
        </Panel>

        {scopedGroup ? (
          <Text>
            Vista de un grupo.{' '}
            <ButtonLink
              variant="text"
              to={`/courses/${courseId}/attendance?date=${date}`}
            >
              Ver toda la cursada
            </ButtonLink>
          </Text>
        ) : null}

        <div className="flex flex-col gap-2">
          {roster.groups.map((group) => (
            <AttendanceGroupBlock
              key={group.id}
              group={group}
              courseId={courseId}
              date={date}
              scoped={Boolean(scopedGroup)}
              savingId={savingId}
              onToggle={(student, field) => void toggleField(student, field)}
            />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
