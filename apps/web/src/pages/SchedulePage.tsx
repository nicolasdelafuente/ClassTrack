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
import { Panel } from '../components/atoms/Panel'
import { Text } from '../components/atoms/Text'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { StateBox, StateMessage } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'
import {
  CLASS_ACTIVITY_TYPE_LABELS,
  type ActivityTypeDefault,
  type CourseSchedule,
  type ScheduleSession,
} from '../types'
import { cn } from '../lib/cn'

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
      return {
        status: 'ready',
        schedule: {
          ...prev.schedule,
          sessions: prev.schedule.sessions.map((s) =>
            s.id === updated.id ? updated : s,
          ),
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

  async function resetDerived(session: ScheduleSession) {
    setBusyId(session.id)
    try {
      const updated = await patchScheduleSession(courseId, session.id, {
        useDerivedMandatory: true,
      })
      replaceSession(updated)
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudo restablecer',
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

  return (
    <AppShell
      showBack
      courseName={schedule.course.name}
      courseCode={schedule.course.code}
    >
      <section className="flex flex-col gap-4">
        <PageHero
          eyebrow="Cursada"
          title="Cronograma"
          description="Clases por fecha, obligatoriedad y feriados. Las optativas se pueden tomar lista, pero no cuentan para el cupo de faltas."
          stats={[
            { label: 'Clases', value: counts.total },
            { label: 'Obligatorias', value: counts.mandatory },
            { label: 'Optativas', value: counts.optional },
            { label: 'Sin asistencia', value: counts.noAttendance },
            {
              label: 'Faltas máx.',
              value: schedule.course.maxAbsencesAllowed,
            },
          ]}
          actions={
            <>
              <Button
                variant="ghost"
                className="min-h-11"
                onClick={() => setShowPolicy((v) => !v)}
              >
                {showPolicy ? 'Ocultar parametría' : 'Parametría del cuatrimestre'}
              </Button>
              <ButtonLink
                variant="ghost"
                className="min-h-11"
                to={`/courses/${courseId}/attendance`}
              >
                Ir a asistencia
              </ButtonLink>
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
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={row.isMandatoryByDefault ? 'toggleOn' : 'toggle'}
                      className="min-h-9 text-[12px]"
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
                      {row.isMandatoryByDefault ? 'Default obligatorio' : 'Default optativo'}
                    </Button>
                    <Button
                      variant={row.allowsAttendance ? 'toggleOn' : 'toggle'}
                      className="min-h-9 text-[12px]"
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
          <div className="border-b border-border bg-surface-2/80 px-4 py-3">
            <SectionTitle
              className="mb-0"
              hint="Tocá Obligatoria/Optativa para override manual."
            >
              Clases
            </SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b border-border text-[12px] font-semibold uppercase tracking-wide text-fg-faint">
                  <th className="px-4 py-2.5 font-semibold">Fecha</th>
                  <th className="px-4 py-2.5 font-semibold">Actividades</th>
                  <th className="px-4 py-2.5 font-semibold">Clase</th>
                  <th className="px-4 py-2.5 font-semibold">Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {schedule.sessions.map((session) => {
                  const busy = busyId === session.id
                  return (
                    <tr
                      key={session.id}
                      className="border-b border-border last:border-b-0 hover:bg-surface-interactive"
                    >
                      <td className="px-4 py-3 align-top tabular-nums font-semibold text-fg">
                        {formatDate(session.date)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                          {session.items.map((item) => (
                            <li key={item.id} className="min-w-0">
                              <span className="block text-fg">{item.title}</span>
                              <span className="text-[12px] text-fg-faint">
                                {CLASS_ACTIVITY_TYPE_LABELS[item.activityType]}
                                {item.isMandatory ? ' · ítem obl.' : ' · ítem opt.'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1.5">
                          <Button
                            variant={session.isMandatory ? 'toggleOn' : 'toggle'}
                            disabled={busy || !session.allowsAttendance}
                            className="min-h-9 text-[12px]"
                            onClick={() => void toggleMandatory(session)}
                          >
                            {session.isMandatory ? 'Obligatoria' : 'Optativa'}
                          </Button>
                          {session.mandatorySource === 'manual' ? (
                            <button
                              type="button"
                              disabled={busy}
                              className="text-left text-[11px] font-medium text-accent"
                              onClick={() => void resetDerived(session)}
                            >
                              Volver a default derivado
                            </button>
                          ) : (
                            <span className="text-[11px] text-fg-faint">
                              Derivada de ítems
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold',
                            session.allowsAttendance
                              ? 'bg-ok-soft text-ok'
                              : 'bg-surface-2 text-fg-faint',
                          )}
                        >
                          {session.allowsAttendance
                            ? 'Se puede tomar lista'
                            : 'Feriado / sin lista'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </AppShell>
  )
}
