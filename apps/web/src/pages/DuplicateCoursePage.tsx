import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  duplicateCourse,
  fetchCourseGroups,
  fetchCourseSchedule,
} from '../api/client'
import { Button } from '../components/atoms/Button'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import { Panel } from '../components/atoms/Panel'
import { Text } from '../components/atoms/Text'
import {
  DatePicker,
  formatDateDisplay,
} from '../components/molecules/DatePicker'
import { PageHeroSkeleton } from '../components/molecules/PageHeroSkeleton'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'
import type { CourseSchedule } from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      schedule: CourseSchedule
      groupCount: number
    }

function suggestCode(code: string): string {
  const base = code.trim()
  if (!base) return 'NUEVA'
  if (/\d{4}$/.test(base)) {
    return base.replace(/\d{4}$/, String(new Date().getFullYear()))
  }
  return `${base}-copia`
}

function suggestName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'Nueva cursada'
  if (/nuevo cuatri|copia/i.test(trimmed)) return trimmed
  return `${trimmed} — nuevo cuatri`
}

/**
 * Full-page flow: clone a quarter into a fresh one (no students).
 * Teacher picks name, code, and when the first class should land.
 */
export function DuplicateCoursePage() {
  const { courseId = '' } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [firstSessionDate, setFirstSessionDate] = useState('')
  const [copyEmptyGroups, setCopyEmptyGroups] = useState(true)
  const [setAsCurrent, setSetAsCurrent] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) {
      setState({ status: 'error', message: 'Falta el id de la cursada' })
      return
    }
    let cancelled = false
    async function load() {
      try {
        const [schedule, groups] = await Promise.all([
          fetchCourseSchedule(courseId),
          fetchCourseGroups(courseId),
        ])
        if (cancelled) return
        const first = schedule.sessions[0]?.date ?? ''
        setName(suggestName(schedule.course.name))
        setCode(suggestCode(schedule.course.code))
        setFirstSessionDate(first)
        setState({
          status: 'ready',
          schedule,
          groupCount: groups.length,
        })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'No se pudo cargar la cursada a copiar',
          })
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseId])

  const preview = useMemo(() => {
    if (state.status !== 'ready') return null
    const sessions = state.schedule.sessions
    if (sessions.length === 0 || !firstSessionDate) {
      return { dayOffset: 0, lastDate: null as string | null }
    }
    const dayOffset = diffIsoDays(firstSessionDate, sessions[0].date)
    return {
      dayOffset,
      lastDate: shiftIso(sessions[sessions.length - 1].date, dayOffset),
    }
  }, [state, firstSessionDate])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (state.status !== 'ready') return
    setError(null)
    setSubmitting(true)
    try {
      await duplicateCourse(state.schedule.course.id, {
        name,
        code,
        firstSessionDate:
          firstSessionDate ||
          state.schedule.sessions[0]?.date ||
          new Date().toISOString().slice(0, 10),
        setAsCurrent,
        copyEmptyGroups,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo duplicar la cursada',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (state.status === 'loading') {
    return (
      <AppShell>
        <div className="flex flex-col gap-4" aria-busy aria-label="Cargando">
          <PageHeroSkeleton compact stats={0} showActions={false} />
          <Panel tone="default" className="space-y-3 p-4 sm:p-5">
            <div className="h-10 rounded-md bg-surface-2 motion-safe:animate-skeleton" />
            <div className="h-10 rounded-md bg-surface-2 motion-safe:animate-skeleton" />
            <div className="h-40 rounded-md bg-surface-2 motion-safe:animate-skeleton" />
          </Panel>
        </div>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell>
        <StateBox title="No se puede duplicar" message={state.message} />
      </AppShell>
    )
  }

  const { schedule, groupCount } = state
  const sourceFirst = schedule.sessions[0]?.date

  return (
    <AppShell
      courseName={schedule.course.name}
      courseCode={schedule.course.code}
    >
      <section className="flex flex-col gap-4">
        <PageHero
          compact
          eyebrow="Nuevo cuatrimestre"
          title="Duplicar cursada"
          description="Copiamos parametría, cronograma y grupos vacíos. Sin alumnos ni asistencias. Después podés ajustar fechas y textos en el cronograma."
        />

        <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-2">
          <Panel tone="default" className="flex flex-col gap-4 p-4 sm:p-5">
            <div>
              <Label htmlFor="dup-name">Nombre de la nueva cursada</Label>
              <Input
                id="dup-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Desarrollo de Aplicaciones — 2C 2026"
              />
            </div>
            <div>
              <Label htmlFor="dup-code">Código (único)</Label>
              <Input
                id="dup-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="DESAPP-2026-2C"
                translate="no"
              />
              <Text faint className="mt-1">
                Origen: {schedule.course.code}
              </Text>
            </div>

            <div>
              <Label>Primera clase del nuevo cuatri</Label>
              <Text className="mb-2 mt-1 text-[13px]">
                Todas las fechas del cronograma se corren juntas. Origen:{' '}
                {sourceFirst ? formatDateDisplay(sourceFirst) : 'sin clases'}
              </Text>
              {firstSessionDate ? (
                <DatePicker
                  id="dup-first-date"
                  value={firstSessionDate}
                  onChange={setFirstSessionDate}
                  embedded
                />
              ) : (
                <Text faint>
                  Esta cursada no tiene clases; se creará vacía de cronograma.
                </Text>
              )}
            </div>

            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
                Qué copiar
              </legend>
              <label className="flex cursor-pointer items-start gap-2 text-[13px] text-fg">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={copyEmptyGroups}
                  onChange={(e) => setCopyEmptyGroups(e.target.checked)}
                />
                <span>
                  Grupos vacíos ({groupCount} en origen: mismo número/nombre/
                  docente, sin alumnos ni links; sprints en desconocido)
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-[13px] text-fg">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={setAsCurrent}
                  onChange={(e) => setSetAsCurrent(e.target.checked)}
                />
                <span>Marcar como cursada actual (el tablero pasa a esta)</span>
              </label>
            </fieldset>

            {error ? (
              <p className="m-0 text-[13px] text-critical" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Duplicando…' : 'Crear cursada nueva'}
              </Button>
              <ButtonLink variant="ghost" to="/">
                Cancelar
              </ButtonLink>
            </div>
          </Panel>

          <Panel tone="soft" className="p-4 sm:p-5">
            <p className="m-0 text-[13px] font-semibold text-fg">Resumen</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[13px] text-fg-muted">
              <li>
                Se copian{' '}
                <strong className="font-semibold text-fg">
                  {schedule.sessions.length}
                </strong>{' '}
                días del cronograma (textos y tipos de actividad)
              </li>
              <li>Parametría de faltas y tipos de actividad: sí</li>
              <li>Alumnos y asistencias: no</li>
              {copyEmptyGroups ? (
                <li>
                  Grupos: sí, {groupCount} vacíos (listos para el cuatri nuevo)
                </li>
              ) : (
                <li>Grupos: no se copian</li>
              )}
              {preview && sourceFirst && firstSessionDate ? (
                <li>
                  Offset:{' '}
                  <strong className="font-semibold text-fg">
                    {preview.dayOffset >= 0 ? '+' : ''}
                    {preview.dayOffset} días
                  </strong>
                  {preview.lastDate ? (
                    <>
                      {' '}
                      · última clase ≈ {formatDateDisplay(preview.lastDate)}
                    </>
                  ) : null}
                </li>
              ) : null}
            </ul>
            <Text faint className="mt-4">
              Después de crear, abrí el cronograma y retocá fechas o títulos si
              hace falta.
            </Text>
          </Panel>
        </form>
      </section>
    </AppShell>
  )
}

function diffIsoDays(a: string, b: string): number {
  const pa = parseIsoParts(a)
  const pb = parseIsoParts(b)
  if (!pa || !pb) return 0
  const aDay = Date.UTC(pa.y, pa.m - 1, pa.d)
  const bDay = Date.UTC(pb.y, pb.m - 1, pb.d)
  return Math.round((aDay - bDay) / 86_400_000)
}

function shiftIso(iso: string, days: number): string {
  const p = parseIsoParts(iso)
  if (!p) return iso
  const date = new Date(Date.UTC(p.y, p.m - 1, p.d, 12, 0, 0))
  date.setUTCDate(date.getUTCDate() + days)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseIsoParts(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!match) return null
  return {
    y: Number(match[1]),
    m: Number(match[2]),
    d: Number(match[3]),
  }
}
