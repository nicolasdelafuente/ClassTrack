import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  fetchCurrentCourse,
  fetchMeProfile,
  fetchMyAttendance,
  fetchMyGroup,
  fetchSprintCalendar,
  fetchStudentSprintOverview,
} from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { roleLabel } from '../auth/roles'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { MandatoryChip } from '../components/atoms/MandatoryChip'
import { Panel } from '../components/atoms/Panel'
import { SheetStatusBadge } from '../components/atoms/SheetStatusBadge'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { Text } from '../components/atoms/Text'
import { formatDateDisplay } from '../components/molecules/DatePicker'
import { ListRow } from '../components/molecules/ListRow'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { StudentHomeSkeleton } from '../components/organisms/PageSkeletons'
import { AppShell } from '../components/templates/AppShell'
import type {
  CourseStudentAttendanceSession,
  CourseStudentProfile,
  SprintCalendar,
  SprintSheetOverview,
  SprintStatus,
  StudentMeProfile,
  StudentMyGroup,
} from '../types'

type Ready = {
  profile: StudentMeProfile
  group: NonNullable<StudentMyGroup['group']>
  calendar: SprintCalendar
  overview: SprintSheetOverview
  attendance: CourseStudentProfile['attendance']
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Ready }
  | { status: 'no_group'; profile: StudentMeProfile }

function currentWindow(calendar: SprintCalendar) {
  if (calendar.currentSprintNumber == null) return null
  return (
    calendar.sprints.find(
      (s) => s.sprintNumber === calendar.currentSprintNumber,
    ) ?? null
  )
}

function sprintRangeLabel(startsOn: string, endsOn: string | null) {
  const start = formatDateDisplay(startsOn)
  if (!endsOn) return `Desde ${start}`
  return `${start} → ${formatDateDisplay(endsOn)}`
}

function presentRateTone(rate: number, total: number): SprintStatus {
  if (total === 0) return 'unknown'
  if (rate >= 85) return 'ok'
  if (rate >= 60) return 'attention'
  return 'critical'
}

/** Present / absent / % only over mandatory roster days (libre rules). */
function mandatoryAttendanceSummary(
  sessions: CourseStudentAttendanceSession[],
) {
  const mandatory = sessions.filter(
    (s) => s.isMandatory && s.allowsAttendance,
  )
  const present = mandatory.filter((s) => s.present).length
  const absent = mandatory.filter((s) => !s.present).length
  const total = mandatory.length
  const presentRate =
    total === 0 ? 0 : Math.round((present / total) * 100)
  return { mandatory, present, absent, total, presentRate }
}

function contactLine(student: StudentMeProfile['student']) {
  return [student.legajo ? `Legajo ${student.legajo}` : null, student.email]
    .filter(Boolean)
    .join(' · ')
}

/**
 * Student home: identity hero + sprint actual + asistencia.
 * Sheet history lives on the group detail page.
 */
export function StudentHomePage() {
  const { user } = useAuth()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    try {
      const [course, profile] = await Promise.all([
        fetchCurrentCourse(),
        fetchMeProfile(),
      ])
      const { group } = await fetchMyGroup(course.id)
      if (!group) {
        setState({ status: 'no_group', profile })
        return
      }
      const [calendar, overview, attendanceProfile] = await Promise.all([
        fetchSprintCalendar(course.id),
        fetchStudentSprintOverview(group.id),
        fetchMyAttendance(course.id),
      ])
      setState({
        status: 'ready',
        data: {
          profile,
          group,
          calendar,
          overview,
          attendance: attendanceProfile.attendance,
        },
      })
    } catch (err) {
      setState({
        status: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'No se pudo cargar tu espacio. ¿Corriste el seed?',
      })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const student =
    state.status === 'ready'
      ? state.data.profile.student
      : state.status === 'no_group'
        ? state.profile.student
        : null

  const fullName =
    student?.fullName?.trim() ||
    user?.displayName?.trim() ||
    ''
  const title = fullName ? (
    <span className="break-words text-balance">Hola, {fullName}</span>
  ) : (
    'Hola'
  )

  const heroDescription = (
    <>
      {student && contactLine(student) ? (
        <p className="m-0 text-[12px] font-medium text-fg-faint sm:text-[13px]">
          {contactLine(student)}
        </p>
      ) : null}
      <p className="mt-1.5 m-0 text-[14px] text-fg-muted sm:text-[15px]">
        Tu sprint según el cronograma, el tema de tu grupo y un resumen de
        asistencia.
      </p>
    </>
  )

  const heroStats =
    state.status === 'ready'
      ? [
          {
            label: 'Cursada',
            value: state.data.group.course.name,
          },
          {
            label: 'Grupo',
            value: state.data.group.name
              ? `${state.data.group.number} · ${state.data.group.name}`
              : String(state.data.group.number),
          },
          {
            label: 'Tema',
            value: state.data.group.projectTopic?.trim() || 'Sin tema cargado',
          },
        ]
      : undefined

  const mandatorySummary =
    state.status === 'ready'
      ? mandatoryAttendanceSummary(state.data.attendance.sessions)
      : null

  return (
    <AppShell>
      <section className="flex flex-col gap-4 pb-10">
        <PageHero
          eyebrow={`Espacio ${roleLabel('student').toLowerCase()}`}
          title={title}
          description={heroDescription}
          stats={heroStats}
          badge={
            state.status === 'ready' && mandatorySummary ? (
              state.data.attendance.isLibre ? (
                <StatusBadge status="critical" label="Libre" pulseCritical />
              ) : mandatorySummary.total > 0 ? (
                <StatusBadge
                  status={presentRateTone(
                    mandatorySummary.presentRate,
                    mandatorySummary.total,
                  )}
                  label={`${mandatorySummary.presentRate}% presente`}
                />
              ) : null
            ) : null
          }
        />

        {state.status === 'loading' ? <StudentHomeSkeleton /> : null}

        {state.status === 'error' ? (
          <StateBox title="No pudimos cargar" message={state.message} />
        ) : null}

        {state.status === 'no_group' ? (
          <StateBox
            title="Todavía no tenés grupo"
            message="Cuando el docente te asigne a un grupo, acá vas a ver el sprint actual, el tema y tu asistencia."
          />
        ) : null}

        {state.status === 'ready' ? <ReadyHome data={state.data} /> : null}
      </section>
    </AppShell>
  )
}

function ReadyHome({ data }: { data: Ready }) {
  const { group, calendar, overview, attendance } = data
  const window = currentWindow(calendar)
  const currentN = calendar.currentSprintNumber
  const currentOverview =
    currentN != null
      ? overview.sprints.find((s) => s.sprintNumber === currentN)
      : null

  let sprintMessage: string
  if (currentN != null && window) {
    sprintMessage = `Estás en el Sprint ${currentN}`
  } else if (calendar.sprints.length === 0) {
    sprintMessage = 'Esta cursada aún no tiene sprints en el cronograma'
  } else if (
    calendar.sprints.every((s) => s.endsOn && s.endsOn < calendar.today)
  ) {
    sprintMessage = 'Ya terminaron los sprints del calendario'
  } else {
    sprintMessage = 'Hoy no hay un sprint en curso según el cronograma'
  }

  // Full cronograma order: obligatorias, optativas y feriados.
  const listSessions = attendance.sessions
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .map((session, index) => ({
      session,
      classNumber: index + 1,
    }))
  const summary = mandatoryAttendanceSummary(attendance.sessions)

  return (
    <>
      <Panel as="section" tone="elevated" className="p-4" stagger={2}>
        <SectionTitle hint="Según el cronograma (no el semáforo)">
          Sprint actual
        </SectionTitle>
        <p className="mt-2 m-0 text-[17px] font-semibold text-fg">
          {sprintMessage}
        </p>
        {window ? (
          <p className="mt-1 m-0 text-[13px] text-fg-muted">
            {sprintRangeLabel(window.startsOn, window.endsOn)}
          </p>
        ) : null}

        {currentN != null ? (
          <ListRow
            to={`/alumno/grupos/${group.id}/sprints/${currentN}`}
            className="mt-4 block border-accent/25 bg-accent-soft/40 px-3.5 py-3 text-fg"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="m-0 text-[15px] font-semibold text-fg">
                Ficha del Sprint {currentN}
              </p>
              <span className="text-[13px] font-medium text-accent">
                Abrir →
              </span>
            </div>
            <p className="mt-1.5 m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-fg-muted">
              <span className="inline-flex items-center gap-1.5">
                Inicio:{' '}
                {currentOverview?.start?.status ? (
                  <SheetStatusBadge status={currentOverview.start.status} />
                ) : (
                  'Sin crear'
                )}
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                Fin:{' '}
                {currentOverview?.end?.status ? (
                  <SheetStatusBadge status={currentOverview.end.status} />
                ) : (
                  'Sin crear'
                )}
              </span>
            </p>
          </ListRow>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink to={`/alumno/grupos/${group.id}`} variant="primary">
            Ir a mi grupo
          </ButtonLink>
        </div>
      </Panel>

      <Panel as="section" tone="default" className="p-4" stagger={3}>
        <SectionTitle hint="Cronograma completo · el % cuenta solo obligatorias">
          Asistencia
        </SectionTitle>
        <dl className="m-0 mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
          <SummaryStat label="Presentes" value={summary.present} />
          <SummaryStat label="Ausentes" value={summary.absent} />
          <SummaryStat
            label="Faltas (oblig.)"
            value={`${attendance.absenceCount}/${attendance.maxAbsencesAllowed}`}
          />
          <SummaryStat label="% presente" value={`${summary.presentRate}%`} />
        </dl>
        {attendance.isLibre ? (
          <Text className="mt-2.5 text-[12px] text-critical">
            Superaste el cupo de faltas obligatorias (
            {attendance.absenceCount}/{attendance.maxAbsencesAllowed}).
          </Text>
        ) : null}

        {listSessions.length === 0 ? (
          <Text className="mt-3 text-[12px] text-fg-muted">
            Todavía no hay clases en el cronograma de esta cursada.
          </Text>
        ) : (
          <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 border-t border-border/80 pt-3 p-0">
            {listSessions.map(({ session, classNumber }) => {
              const isFuture = session.date > calendar.today
              const isHoliday = !session.allowsAttendance
              return (
                <li
                  key={session.sessionId}
                  className="flex items-start justify-between gap-2 rounded-lg px-1 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 text-[13px] font-medium text-fg">
                      <span className="tabular-nums text-fg-faint">
                        #{classNumber}
                      </span>
                      <span className="text-fg-faint" aria-hidden>
                        ·
                      </span>
                      <span>{formatDateDisplay(session.date)}</span>
                    </p>
                    <p className="mt-0.5 m-0 text-[13px] text-pretty text-fg-muted">
                      {session.title}
                    </p>
                    <div className="mt-1">
                      {isHoliday ? (
                        <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-surface-2 px-2.5 text-[11px] font-semibold leading-none text-fg-muted">
                          Feriado
                        </span>
                      ) : (
                        <MandatoryChip mandatory={session.isMandatory} />
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    {isHoliday ? (
                      <span className="text-[12px] font-medium text-fg-faint">
                        Sin lista
                      </span>
                    ) : isFuture && !session.recorded ? (
                      <span className="text-[12px] font-medium text-fg-faint">
                        Por venir
                      </span>
                    ) : !session.recorded ? (
                      <span className="text-[12px] font-medium text-fg-faint">
                        Sin lista
                      </span>
                    ) : (
                      <StatusBadge
                        status={session.present ? 'ok' : 'critical'}
                        label={session.present ? 'Presente' : 'Ausente'}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </>
  )
}

function SummaryStat({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div>
      <dt className="m-0 text-[11px] font-medium text-fg-faint">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-fg">
        {value}
      </dd>
    </div>
  )
}
