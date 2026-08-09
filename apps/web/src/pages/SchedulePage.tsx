import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchCourseSchedule,
  patchSchedulePolicy,
  patchScheduleSession,
} from '../api/client'
import { Button } from '../components/atoms/Button'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import { MandatoryChip } from '../components/atoms/MandatoryChip'
import { Panel } from '../components/atoms/Panel'
import { Text } from '../components/atoms/Text'
import { ScheduleHeroMeta } from '../components/molecules/ScheduleHeroMeta'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { SchedulePageSkeleton } from '../components/organisms/PageSkeletons'
import { AppShell } from '../components/templates/AppShell'
import {
  CLASS_ACTIVITY_TYPE_LABELS,
  type ActivityTypeDefault,
  type CourseSchedule,
  type ScheduleSession,
} from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; schedule: CourseSchedule }

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function SchedulePage() {
  const { courseId = '' } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showPolicy, setShowPolicy] = useState(false)
  const [maxAbsences, setMaxAbsences] = useState(4)
  const [defaultsDraft, setDefaultsDraft] = useState<ActivityTypeDefault[]>([])
  const [policyMessage, setPolicyMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) {
      setState({ status: 'error', message: 'Falta el id de la cursada' })
      return
    }
    let cancelled = false
    async function load() {
      try {
        const schedule = await fetchCourseSchedule(courseId)
        if (!cancelled) {
          setState({ status: 'ready', schedule })
          setMaxAbsences(schedule.course.maxAbsencesAllowed)
          setDefaultsDraft(schedule.activityTypeDefaults)
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'No se pudo cargar el cronograma',
          })
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseId])

  const counts = useMemo(() => {
    if (state.status !== 'ready') {
      return { total: 0, mandatory: 0, optional: 0, noAttendance: 0 }
    }
    const sessions = state.schedule.sessions
    return {
      total: sessions.length,
      mandatory: sessions.filter((s) => s.isMandatory && s.allowsAttendance)
        .length,
      optional: sessions.filter((s) => !s.isMandatory && s.allowsAttendance)
        .length,
      noAttendance: sessions.filter((s) => !s.allowsAttendance).length,
    }
  }, [state])

  function replaceSession(updated: ScheduleSession) {
    setState((prev) => {
      if (prev.status !== 'ready') return prev
      const sessions = prev.schedule.sessions.map((s) =>
        s.id === updated.id ? updated : s,
      )
      sessions.sort((a, b) => a.date.localeCompare(b.date))
      return {
        status: 'ready',
        schedule: {
          ...prev.schedule,
          sessions,
        },
      }
    })
  }

  async function toggleMandatory(session: ScheduleSession) {
    setBusyId(session.id)
    try {
      const updated = await patchScheduleSession(courseId, session.id, {
        isMandatory: !session.isMandatory,
      })
      replaceSession(updated)
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudo actualizar la clase',
      )
    } finally {
      setBusyId(null)
    }
  }

  async function savePolicy() {
    setPolicyMessage(null)
    try {
      // Attendance is not edited here: feriado = sin lista; resto = con lista.
      const activityTypeDefaults = defaultsDraft.map((d) => ({
        ...d,
        allowsAttendance: d.activityType !== 'feriado',
      }))
      const saved = await patchSchedulePolicy(courseId, {
        maxAbsencesAllowed: maxAbsences,
        activityTypeDefaults,
      })
      setState((prev) => {
        if (prev.status !== 'ready') return prev
        return {
          status: 'ready',
          schedule: {
            ...prev.schedule,
            course: {
              ...prev.schedule.course,
              maxAbsencesAllowed: saved.maxAbsencesAllowed,
            },
            activityTypeDefaults: saved.activityTypeDefaults,
          },
        }
      })
      setDefaultsDraft(saved.activityTypeDefaults)
      setPolicyMessage('Parametría guardada')
    } catch (err) {
      setPolicyMessage(
        err instanceof Error ? err.message : 'No se pudo guardar',
      )
    }
  }

  if (state.status === 'loading') {
    return (
      <AppShell>
        <SchedulePageSkeleton />
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell>
        <StateBox title="No se pudo abrir el cronograma" message={state.message} />
      </AppShell>
    )
  }

  const { schedule } = state

  return (
    <AppShell
      courseName={schedule.course.name}
      courseCode={schedule.course.code}
    >
      <section className="flex w-full max-w-full min-w-0 flex-col gap-3 sm:gap-4">
        <PageHero
          compact
          eyebrow="Agenda"
          title="Cronograma"
          description="Planificá la cursada y visualizá rápidamente qué clases son obligatorias, optativas y feriados."
          meta={
            <ScheduleHeroMeta
              classes={counts.total}
              mandatory={counts.mandatory}
              optional={counts.optional}
              noAttendance={counts.noAttendance}
              maxAbsences={schedule.course.maxAbsencesAllowed}
            />
          }
          actions={
            <>
              <ButtonLink
                variant="primary"
                className="min-h-10"
                to={`/courses/${courseId}/attendance`}
              >
                Tomar asistencia
              </ButtonLink>
              <Button
                type="button"
                variant="ghost"
                className="min-h-10"
                onClick={() => setShowPolicy((v) => !v)}
              >
                {showPolicy ? 'Ocultar parametría' : 'Parametría'}
              </Button>
            </>
          }
        />

        {showPolicy ? (
          <Panel tone="soft" stagger={2} className="p-4 sm:p-5">
            <SectionTitle hint="¿Cada tipo de actividad nace contando para faltas? + cupo de libre.">
              Parametría
            </SectionTitle>
            <div className="mb-4 max-w-xs">
              <Label htmlFor="max-absences">Faltas permitidas (obligatorias)</Label>
              <Input
                id="max-absences"
                type="number"
                min={0}
                max={40}
                value={maxAbsences}
                onChange={(e) => setMaxAbsences(Number(e.target.value))}
              />
              <Text faint className="mt-1">
                Con {maxAbsences + 1} faltas en clases obligatorias → libre
              </Text>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {defaultsDraft.map((row) => (
                <li
                  key={row.activityType}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-1 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <span className="block text-[14px] font-medium text-fg">
                      {CLASS_ACTIVITY_TYPE_LABELS[row.activityType]}
                    </span>
                    {row.activityType === 'feriado' ? (
                      <span className="mt-0.5 block text-[12px] text-fg-faint">
                        Sin lista · no cuenta para faltas
                      </span>
                    ) : null}
                  </div>
                  {row.activityType === 'feriado' ? (
                    <span className="inline-flex h-9 min-w-[7.5rem] shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 px-2.5 text-[12px] font-medium text-fg-faint">
                      Feriado
                    </span>
                  ) : (
                    <Button
                      variant={
                        row.isMandatoryByDefault ? 'toggleOn' : 'toggle'
                      }
                      className={
                        row.isMandatoryByDefault
                          ? 'min-h-9 w-[7.5rem] shrink-0 text-[12px]'
                          : 'min-h-9 w-[7.5rem] shrink-0 border-border-strong text-[12px]'
                      }
                      onClick={() =>
                        setDefaultsDraft((prev) =>
                          prev.map((d) =>
                            d.activityType === row.activityType
                              ? {
                                  ...d,
                                  isMandatoryByDefault: !d.isMandatoryByDefault,
                                }
                              : d,
                          ),
                        )
                      }
                    >
                      {row.isMandatoryByDefault ? 'Obligatorio' : 'Optativo'}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={() => void savePolicy()}>
                Guardar parametría
              </Button>
              {policyMessage ? (
                <span className="text-[12px] font-semibold text-ok">
                  {policyMessage}
                </span>
              ) : null}
            </div>
          </Panel>
        ) : null}

        <Panel tone="default" stagger={3} className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border bg-surface-2/80 px-4 py-3">
            <SectionTitle
              className="mb-0"
              hint="Tocá una clase para editarla. El botón cambia el día."
            >
              Clases
            </SectionTitle>
            <ButtonLink
              variant="ghost"
              className="min-h-9 text-[12px]"
              to={`/courses/${courseId}/schedule/sessions/new`}
            >
              Nueva clase
            </ButtonLink>
          </div>
          <ul className="m-0 list-none p-0">
            {schedule.sessions.map((session) => {
              const busy = busyId === session.id
              return (
                <li
                  key={session.id}
                  className="border-b border-border last:border-b-0 hover:bg-surface-interactive"
                >
                  <div className="flex items-center justify-between gap-3 px-3 pt-3 sm:px-4">
                    <Link
                      to={`/courses/${courseId}/schedule/sessions/${session.id}`}
                      className="min-w-0 flex-1 text-[14px] font-semibold tabular-nums text-fg no-underline"
                    >
                      {formatDate(session.date)}
                    </Link>
                    {!session.allowsAttendance ? (
                      <span className="inline-flex h-9 w-[7.5rem] shrink-0 items-center justify-center text-[13px] font-medium text-fg-faint">
                        Feriado
                      </span>
                    ) : (
                      <Button
                        variant={
                          session.isMandatory ? 'toggleOn' : 'toggle'
                        }
                        disabled={busy}
                        className={
                          session.isMandatory
                            ? 'h-9 min-h-9 w-[7.5rem] shrink-0 text-[12px]'
                            : 'h-9 min-h-9 w-[7.5rem] shrink-0 border-border-strong text-[12px]'
                        }
                        onClick={() => void toggleMandatory(session)}
                      >
                        {session.isMandatory ? 'Obligatoria' : 'Optativa'}
                      </Button>
                    )}
                  </div>

                  <Link
                    to={`/courses/${courseId}/schedule/sessions/${session.id}`}
                    className="block px-3 pb-3 pt-2.5 text-fg no-underline sm:px-4"
                  >
                    <ul className="m-0 flex min-w-0 list-none flex-col gap-2 p-0">
                      {session.items.map((item) => (
                        <li key={item.id} className="min-w-0">
                          <span className="block break-words text-[14px] text-fg text-pretty">
                            {item.title}
                          </span>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-[12px] text-fg-faint">
                              {CLASS_ACTIVITY_TYPE_LABELS[item.activityType]}
                            </span>
                            {session.allowsAttendance ? (
                              <MandatoryChip mandatory={item.isMandatory} />
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Panel>
      </section>
    </AppShell>
  )
}
