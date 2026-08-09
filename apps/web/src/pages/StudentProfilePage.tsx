import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchCourseStudentProfile } from '../api/client'
import { MandatoryChip } from '../components/atoms/MandatoryChip'
import { Panel } from '../components/atoms/Panel'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { Text } from '../components/atoms/Text'
import { formatDateDisplay } from '../components/molecules/DatePicker'
import { ListRow } from '../components/molecules/ListRow'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { StudentProfilePageSkeleton } from '../components/organisms/PageSkeletons'
import { AppShell } from '../components/templates/AppShell'
import type { CourseStudentProfile, SprintStatus } from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: CourseStudentProfile }

function presentRateTone(rate: number, total: number): SprintStatus {
  if (total === 0) return 'unknown'
  if (rate >= 85) return 'ok'
  if (rate >= 60) return 'attention'
  return 'critical'
}

export function StudentProfilePage() {
  const { courseId = '', groupId = '', studentId = '' } = useParams()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    if (!courseId || !studentId) {
      setState({
        status: 'error',
        message: 'Faltan datos del alumno o de la cursada',
      })
      return
    }

    let cancelled = false
    async function load() {
      try {
        const profile = await fetchCourseStudentProfile(courseId, studentId)
        if (!cancelled) setState({ status: 'ready', profile })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'No se pudo cargar el perfil del alumno',
          })
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseId, studentId])

  const backTo =
    courseId && groupId
      ? `/courses/${courseId}/groups/${groupId}`
      : courseId
        ? `/courses/${courseId}`
        : '/'

  if (state.status === 'loading') {
    return (
      <AppShell showBack backTo={backTo} backLabel="← Grupo">
        <StudentProfilePageSkeleton />
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack backTo={backTo} backLabel="← Grupo">
        <StateBox title="No se pudo abrir el alumno" message={state.message} />
      </AppShell>
    )
  }

  const { profile } = state
  const { student, course, group, account, attendance } = profile
  const groupLabel = group.name?.trim() || `Grupo ${group.number}`
  const tone = presentRateTone(
    attendance.presentRate,
    attendance.totalClasses,
  )

  const metaBits = [
    student.legajo ? `Legajo ${student.legajo}` : null,
    student.email,
    groupLabel,
    `${course.code} · ${course.name}`,
  ].filter(Boolean)

  return (
    <AppShell
      showBack
      backTo={backTo}
      backLabel="← Grupo"
      courseId={course.id}
      courseName={course.name}
      courseCode={course.code}
    >
      <article className="flex flex-col gap-4">
        <PageHero
          compact
          eyebrow="Perfil del alumno"
          title={student.fullName}
          description={metaBits.join(' · ')}
          badge={
            attendance.isLibre ? (
              <StatusBadge status="critical" label="Libre" pulseCritical />
            ) : (
              <StatusBadge
                status={tone}
                label={`${attendance.presentRate}% presente`}
              />
            )
          }
          stats={[
            { label: 'Grupo', value: groupLabel },
            {
              label: 'Cuenta',
              value:
                account?.displayName?.trim() ||
                account?.email ||
                'Sin cuenta vinculada',
            },
            {
              label: 'Faltas (oblig.)',
              value: `${attendance.absenceCount}/${attendance.maxAbsencesAllowed}`,
            },
            {
              label: 'Clases',
              value: String(attendance.totalClasses),
            },
          ]}
        />

        <Panel as="section" tone="default" stagger={2} className="p-4 sm:p-5">
          <SectionTitle hint="Resumen sobre clases con lista">
            Asistencia
          </SectionTitle>
          <dl className="m-0 mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Presentes" value={attendance.present} />
            <SummaryStat label="Ausentes" value={attendance.absent} />
            <SummaryStat
              label="Participó"
              value={attendance.participationCount}
            />
            <SummaryStat
              label="% presente"
              value={`${attendance.presentRate}%`}
            />
          </dl>
          {attendance.isLibre ? (
            <Text className="mt-3 text-[13px] text-critical">
              Superó el cupo de faltas obligatorias (
              {attendance.absenceCount}/{attendance.maxAbsencesAllowed}).
            </Text>
          ) : null}
        </Panel>

        <Panel as="section" tone="soft" stagger={3} className="p-4 sm:p-5">
          <SectionTitle hint="Historial por fecha del cronograma">
            Clases
          </SectionTitle>
          {attendance.sessions.length === 0 ? (
            <Text className="mt-2">
              Todavía no hay clases con asistencia en esta cursada.
            </Text>
          ) : (
            <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
              {attendance.sessions.map((session) => (
                <li key={session.sessionId}>
                  <ListRow
                    as="div"
                    tone="default"
                    interactive={false}
                    className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="m-0 text-[14px] font-medium text-fg">
                        {formatDateDisplay(session.date)}
                        <span className="font-normal text-fg-muted">
                          {' · '}
                          {session.title}
                        </span>
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <MandatoryChip mandatory={session.isMandatory} />
                        {!session.recorded ? (
                          <span className="text-[12px] text-fg-faint">
                            Lista no tomada
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={session.present ? 'ok' : 'critical'}
                        label={session.present ? 'Presente' : 'Ausente'}
                      />
                      {session.participated ? (
                        <StatusBadge status="attention" label="Participó" />
                      ) : null}
                    </div>
                  </ListRow>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </article>
    </AppShell>
  )
}

function SummaryStat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div>
      <dt className="m-0 text-[12px] font-medium text-fg-faint">{label}</dt>
      <dd className="mt-0.5 text-[20px] font-semibold tabular-nums text-fg">
        {value}
      </dd>
    </div>
  )
}
