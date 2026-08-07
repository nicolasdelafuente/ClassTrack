import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
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
import { StateBox, StateMessage } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { ScheduleSessionEditor } from '../components/organisms/ScheduleSessionEditor'
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

/** null = closed; 'new' = create; string = edit session id */
type EditorState = null | 'new' | string

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function SchedulePage() {
  const { courseId = '' } = useParams()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showPolicy, setShowPolicy] = useState(false)
  const [maxAbsences, setMaxAbsences] = useState(4)
  const [defaultsDraft, setDefaultsDraft] = useState<ActivityTypeDefault[]>([])
  const [policyMessage, setPolicyMessage] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState>(null)

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

  function addSession(created: ScheduleSession) {
    setState((prev) => {
      if (prev.status !== 'ready') return prev
      const sessions = [...prev.schedule.sessions, created].sort((a, b) =>
        a.date.localeCompare(b.date),
      )
      return {
        status: 'ready',
        schedule: { ...prev.schedule, sessions },
      }
    })
  }

  function removeSession(sessionId: string) {
    setState((prev) => {
      if (prev.status !== 'ready') return prev
      return {
        status: 'ready',
        schedule: {
          ...prev.schedule,
          sessions: prev.schedule.sessions.filter((s) => s.id !== sessionId),
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
      const saved = await patchSchedulePolicy(courseId, {
        maxAbsencesAllowed: maxAbsences,
        activityTypeDefaults: defaultsDraft,
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
      setPolicyMessage('Parametría guardada')
    } catch (err) {
      setPolicyMessage(
        err instanceof Error ? err.message : 'No se pudo guardar',
      )
    }
  }

  if (state.status === 'loading') {
    return (
      <AppShell showBack>
        <StateMessage>Cargando cronograma…</StateMessage>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack>
        <StateBox title="No se pudo abrir el cronograma" message={state.message} />
      </AppShell>
    )
  }

  const { schedule } = state
  const editingSession =
    editor && editor !== 'new'
      ? (schedule.sessions.find((s) => s.id === editor) ?? null)
      : null

  return (
    <AppShell
      showBack
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
              <button
                type="button"
                className="min-h-10 cursor-pointer px-1 text-[13px] font-medium text-fg-faint transition-colors hover:text-fg"
                onClick={() => setShowPolicy((v) => !v)}
              >
                {showPolicy ? 'Ocultar parametría' : 'Parametría'}
              </button>
            </>
          }
        />

        {showPolicy ? (
          <Panel tone="soft" stagger={2} className="p-4 sm:p-5">
            <SectionTitle hint="Defaults por tipo de ítem y umbral de faltas (libre).">
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
                  <span className="text-[14px] font-medium text-fg">
                    {CLASS_ACTIVITY_TYPE_LABELS[row.activityType]}
                  </span>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                    <Button
                      variant={row.isMandatoryByDefault ? 'toggleOn' : 'toggle'}
                      className="min-h-9 w-full text-[12px] sm:w-auto"
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
                      {row.isMandatoryByDefault
                        ? 'Default obligatorio'
                        : 'Default optativo'}
                    </Button>
                    <Button
                      variant={row.allowsAttendance ? 'toggleOn' : 'toggle'}
                      className="min-h-9 w-full text-[12px] sm:w-auto"
                      onClick={() =>
                        setDefaultsDraft((prev) =>
                          prev.map((d) =>
                            d.activityType === row.activityType
                              ? {
                                  ...d,
                                  allowsAttendance: !d.allowsAttendance,
                                }
                              : d,
                          ),
                        )
                      }
                    >
                      {row.allowsAttendance ? 'Con asistencia' : 'Sin asistencia'}
                    </Button>
                  </div>
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
            <Button
              variant="ghost"
              className="min-h-9 text-[12px]"
              onClick={() => setEditor('new')}
            >
              Nueva clase
            </Button>
          </div>
          <ul className="m-0 list-none p-0">
            {schedule.sessions.map((session) => {
              const busy = busyId === session.id
              return (
                <li
                  key={session.id}
                  className="cursor-pointer border-b border-border px-3 py-3 last:border-b-0 hover:bg-surface-interactive sm:px-4"
                  onClick={() => setEditor(session.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setEditor(session.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="m-0 min-w-0 tabular-nums text-[14px] font-semibold text-fg">
                      {formatDate(session.date)}
                    </p>
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
                        onClick={(e) => {
                          e.stopPropagation()
                          void toggleMandatory(session)
                        }}
                      >
                        {session.isMandatory ? 'Obligatoria' : 'Optativa'}
                      </Button>
                    )}
                  </div>

                  <ul className="mt-2.5 m-0 flex min-w-0 list-none flex-col gap-2 p-0">
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
                </li>
              )
            })}
          </ul>
        </Panel>
      </section>

      {editor !== null && (editor === 'new' || editingSession) ? (
        <ScheduleSessionEditor
          courseId={courseId}
          session={editor === 'new' ? null : editingSession}
          activityTypeDefaults={schedule.activityTypeDefaults}
          onClose={() => setEditor(null)}
          onSaved={replaceSession}
          onCreated={addSession}
          onDeleted={removeSession}
        />
      ) : null}
    </AppShell>
  )
}
