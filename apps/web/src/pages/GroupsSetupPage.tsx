import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  createGroupStructure,
  fetchCurrentBoard,
  patchGroupEnrollment,
  type GroupStructureBatch,
} from '../api/client'
import { Button } from '../components/atoms/Button'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import { Panel } from '../components/atoms/Panel'
import { Text } from '../components/atoms/Text'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { GroupsSetupPageSkeleton } from '../components/organisms/PageSkeletons'
import { AppShell } from '../components/templates/AppShell'
import type { Course, GroupSummary } from '../types'

type BatchRow = { count: string; capacity: string }

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      course: Course
      groups: GroupSummary[]
    }

const DEFAULT_BATCHES: BatchRow[] = [
  { count: '10', capacity: '3' },
  { count: '2', capacity: '4' },
]

export function GroupsSetupPage() {
  const { courseId = '' } = useParams()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [batches, setBatches] = useState<BatchRow[]>(DEFAULT_BATCHES)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const board = await fetchCurrentBoard()
        if (cancelled) return
        if (courseId && board.course.id !== courseId) {
          setState({
            status: 'error',
            message: 'Esta pantalla es para la cursada actual del tablero.',
          })
          return
        }
        setState({
          status: 'ready',
          course: board.course,
          groups: board.groups,
        })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error ? err.message : 'No se pudo cargar la cursada',
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
    let groupCount = 0
    let totalSpots = 0
    for (const row of batches) {
      const count = Number.parseInt(row.count, 10)
      const capacity = Number.parseInt(row.capacity, 10)
      if (!Number.isFinite(count) || !Number.isFinite(capacity)) continue
      if (count < 1 || capacity < 1) continue
      groupCount += count
      totalSpots += count * capacity
    }
    return { groupCount, totalSpots }
  }, [batches])

  const hasMembers =
    state.status === 'ready' &&
    state.groups.some((g) => g.memberCount > 0)

  async function handleToggleEnrollment() {
    if (state.status !== 'ready') return
    setBusy(true)
    setMessage(null)
    try {
      const next = !(state.course.groupEnrollmentOpen ?? false)
      const updated = await patchGroupEnrollment(state.course.id, next)
      setState({
        ...state,
        course: {
          ...state.course,
          groupEnrollmentOpen: updated.groupEnrollmentOpen,
        },
      })
      setMessage(
        updated.groupEnrollmentOpen
          ? 'Inscripción abierta: los alumnos pueden unirse o salir.'
          : 'Inscripción cerrada.',
      )
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudo cambiar la inscripción',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateStructure() {
    if (state.status !== 'ready') return
    const parsed: GroupStructureBatch[] = []
    for (const row of batches) {
      const count = Number.parseInt(row.count, 10)
      const capacity = Number.parseInt(row.capacity, 10)
      if (!Number.isInteger(count) || !Number.isInteger(capacity)) {
        window.alert('Usá números enteros en cantidad y cupo')
        return
      }
      if (count < 1 || capacity < 1) {
        window.alert('Cantidad y cupo deben ser al menos 1')
        return
      }
      parsed.push({ count, capacity })
    }
    if (parsed.length === 0) {
      window.alert('Agregá al menos un lote')
      return
    }

    const ok = window.confirm(
      hasMembers
        ? 'Hay grupos con integrantes. La API va a rechazar el cambio. ¿Intentar igual?'
        : state.groups.length > 0
          ? `Se van a reemplazar ${state.groups.length} grupos vacíos por ${preview.groupCount} nuevos. ¿Continuar?`
          : `Se van a crear ${preview.groupCount} grupos con ${preview.totalSpots} plazas. ¿Continuar?`,
    )
    if (!ok) return

    setBusy(true)
    setMessage(null)
    try {
      const result = await createGroupStructure(state.course.id, parsed)
      setMessage(
        `Listo: ${result.meta.groupCount} grupos · ${result.meta.totalSpots} plazas.`,
      )
      const board = await fetchCurrentBoard()
      setState({
        status: 'ready',
        course: board.course,
        groups: board.groups,
      })
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudo crear la estructura',
      )
    } finally {
      setBusy(false)
    }
  }

  if (state.status === 'loading') {
    return (
      <AppShell showBack>
        <GroupsSetupPageSkeleton />
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack>
        <StateBox title="No se pudo abrir" message={state.message} />
      </AppShell>
    )
  }

  const { course, groups } = state
  const enrollmentOpen = course.groupEnrollmentOpen ?? false

  return (
    <AppShell showBack courseName={course.name} courseCode={course.code}>
      <section className="mx-auto flex max-w-2xl flex-col gap-4">
        <PageHero
          eyebrow="Formación de equipos"
          title="Armar grupos"
          description="Definí lotes (cantidad × cupo). Los alumnos se unen solos mientras haya lugar."
          stats={[
            { label: 'Grupos hoy', value: groups.length },
            {
              label: 'Inscripción',
              value: enrollmentOpen ? 'Abierta' : 'Cerrada',
            },
          ]}
          actions={
            <>
              <Button
                type="button"
                variant={enrollmentOpen ? 'toggleOn' : 'toggle'}
                disabled={busy}
                onClick={() => void handleToggleEnrollment()}
              >
                {enrollmentOpen ? 'Cerrar inscripción' : 'Abrir inscripción'}
              </Button>
            </>
          }
        />

        {message ? (
          <Panel className="px-3 py-2 text-[13px] text-fg">{message}</Panel>
        ) : null}

        <Panel as="section" className="flex flex-col gap-4 p-4 sm:p-5">
          <SectionTitle hint="Ejemplo: 10 grupos de 3 y 2 de 4.">
            Estructura
          </SectionTitle>

          {hasMembers ? (
            <Text className="text-[13px] text-fg-muted">
              Esta cursada ya tiene integrantes en grupos. Para recrear la
              estructura necesitás una cursada sin miembros (o sacarlos primero).
              Podés abrir/cerrar la inscripción igual.
            </Text>
          ) : null}

          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {batches.map((row, index) => (
              <li
                key={index}
                className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
              >
                <div>
                  <Label htmlFor={`count-${index}`}>Cantidad de grupos</Label>
                  <Input
                    id={`count-${index}`}
                    inputMode="numeric"
                    value={row.count}
                    disabled={busy}
                    onChange={(e) => {
                      const next = [...batches]
                      next[index] = { ...row, count: e.target.value }
                      setBatches(next)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`cap-${index}`}>Cupo por grupo</Label>
                  <Input
                    id={`cap-${index}`}
                    inputMode="numeric"
                    value={row.capacity}
                    disabled={busy}
                    onChange={(e) => {
                      const next = [...batches]
                      next[index] = { ...row, capacity: e.target.value }
                      setBatches(next)
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-10"
                  disabled={busy || batches.length <= 1}
                  onClick={() =>
                    setBatches(batches.filter((_, i) => i !== index))
                  }
                >
                  Quitar
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() =>
                setBatches([...batches, { count: '1', capacity: '3' }])
              }
            >
              Agregar lote
            </Button>
            <Text className="text-[13px] text-fg-muted">
              Vista previa: {preview.groupCount} grupos · {preview.totalSpots}{' '}
              plazas
            </Text>
          </div>

          <Button
            type="button"
            disabled={busy || preview.groupCount < 1}
            onClick={() => void handleCreateStructure()}
          >
            Crear estructura
          </Button>
        </Panel>

        <Panel as="section" tone="soft" className="p-4 sm:p-5">
          <SectionTitle hint="Cupo actual en el tablero">
            Grupos actuales
          </SectionTitle>
          {groups.length === 0 ? (
            <Text>Todavía no hay grupos.</Text>
          ) : (
            <ul className="m-0 mt-2 grid list-none gap-1.5 p-0 sm:grid-cols-2">
              {groups.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-1 px-3 py-2 text-[13px]"
                >
                  <ButtonLink
                    variant="text"
                    to={`/courses/${course.id}/groups/${g.id}`}
                    className="text-left text-[13px]"
                  >
                    G{g.number}
                    {g.name ? ` · ${g.name}` : ''}
                  </ButtonLink>
                  <span className="tabular-nums text-fg-muted">
                    {g.memberCount}/{g.capacity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </AppShell>
  )
}
