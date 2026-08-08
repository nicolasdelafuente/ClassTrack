import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  createEndSheet,
  createStartSheet,
  fetchStudentSprintSheets,
  saveSheetTasks,
  submitSheet,
} from '../api/client'
import { Button } from '../components/atoms/Button'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import { Select } from '../components/atoms/Select'
import { Text } from '../components/atoms/Text'
import { fieldControlClassName } from '../components/atoms/Input'
import { StateBox } from '../components/molecules/StateBox'
import { AppShell } from '../components/templates/AppShell'
import { cn } from '../lib/cn'
import {
  SHEET_STATUS_LABELS,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  type SheetStatus,
  type SprintSheet,
  type SprintSheetTask,
  type TaskCategory,
} from '../types'

type DraftTask = {
  key: string
  category: TaskCategory
  title: string
  description: string
  completed: boolean | null
  incompleteReason: string
  isExtra: boolean
  extraReason: string
  sourceTaskId: string | null
}

function toDraft(tasks: SprintSheetTask[]): DraftTask[] {
  return tasks.map((t, i) => ({
    key: t.id || `new-${i}`,
    category: t.category,
    title: t.title,
    description: t.description ?? '',
    completed: t.completed,
    incompleteReason: t.incompleteReason ?? '',
    isExtra: t.isExtra,
    extraReason: t.extraReason ?? '',
    sourceTaskId: t.sourceTaskId,
  }))
}

function editable(status: SheetStatus) {
  return status === 'draft' || status === 'needs_changes'
}

/**
 * Student editor for start/end sprint sheet of one sprint.
 */
export function StudentSprintSheetPage() {
  const { groupId = '', sprintNumber: sprintParam = '1' } = useParams()
  const sprintNumber = Number(sprintParam)

  const [error, setError] = useState<string | null>(null)
  const [groupLabel, setGroupLabel] = useState('')
  const [start, setStart] = useState<SprintSheet | null>(null)
  const [end, setEnd] = useState<SprintSheet | null>(null)
  const [activeKind, setActiveKind] = useState<'start' | 'end'>('start')
  const [draft, setDraft] = useState<DraftTask[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const activeSheet = activeKind === 'start' ? start : end
  const canEdit = activeSheet ? editable(activeSheet.status) : false

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchStudentSprintSheets(groupId, sprintNumber)
      setGroupLabel(
        `Grupo ${data.group.number}${data.group.name ? ` · ${data.group.name}` : ''}`,
      )
      setStart(data.start)
      setEnd(data.end)
      const preferEnd =
        data.start?.status === 'approved' &&
        (data.end != null || activeKind === 'end')
      const kind = preferEnd && data.end ? 'end' : 'start'
      setActiveKind(kind)
      const sheet = kind === 'start' ? data.start : data.end
      setDraft(sheet ? toDraft(sheet.tasks) : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [groupId, sprintNumber, activeKind])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per route
  }, [groupId, sprintNumber])

  function selectKind(kind: 'start' | 'end') {
    setActiveKind(kind)
    const sheet = kind === 'start' ? start : end
    setDraft(sheet ? toDraft(sheet.tasks) : [])
  }

  async function handleCreateStart() {
    setBusy(true)
    try {
      const res = await createStartSheet(groupId, sprintNumber)
      setStart(res.sheet)
      setActiveKind('start')
      setDraft([])
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo crear')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateEnd() {
    setBusy(true)
    try {
      const res = await createEndSheet(groupId, sprintNumber)
      setEnd(res.sheet)
      setActiveKind('end')
      setDraft(toDraft(res.sheet.tasks))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo crear')
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    if (!activeSheet) return
    setBusy(true)
    try {
      const res = await saveSheetTasks(
        activeSheet.id,
        draft.map((t, i) => ({
          category: t.category,
          title: t.title,
          description: t.description || null,
          completed: activeKind === 'end' ? t.completed : null,
          incompleteReason:
            activeKind === 'end' ? t.incompleteReason || null : null,
          isExtra: activeKind === 'end' ? t.isExtra : false,
          extraReason: activeKind === 'end' ? t.extraReason || null : null,
          sourceTaskId: activeKind === 'end' ? t.sourceTaskId : null,
          sortOrder: i,
        })),
      )
      if (activeKind === 'start') setStart(res.sheet)
      else setEnd(res.sheet)
      setDraft(toDraft(res.sheet.tasks))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit() {
    if (!activeSheet) return
    setBusy(true)
    try {
      await saveSheetTasks(
        activeSheet.id,
        draft.map((t, i) => ({
          category: t.category,
          title: t.title,
          description: t.description || null,
          completed: activeKind === 'end' ? t.completed : null,
          incompleteReason:
            activeKind === 'end' ? t.incompleteReason || null : null,
          isExtra: activeKind === 'end' ? t.isExtra : false,
          extraReason: activeKind === 'end' ? t.extraReason || null : null,
          sourceTaskId: activeKind === 'end' ? t.sourceTaskId : null,
          sortOrder: i,
        })),
      )
      const sheet = await submitSheet(activeSheet.id)
      if (sheet.kind === 'start') setStart(sheet)
      else setEnd(sheet)
      window.alert('Enviada a revisión')
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo enviar')
    } finally {
      setBusy(false)
    }
  }

  const byCategory = useMemo(() => {
    const map = new Map<TaskCategory, DraftTask[]>()
    for (const c of TASK_CATEGORIES) map.set(c, [])
    for (const t of draft) {
      map.get(t.category)?.push(t)
    }
    return map
  }, [draft])

  if (loading) {
    return (
      <AppShell showBack>
        <Text>Cargando ficha…</Text>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell showBack>
        <StateBox title="Error" message={error} />
      </AppShell>
    )
  }

  return (
    <AppShell showBack>
      <section className="mx-auto flex max-w-2xl flex-col gap-4 pb-10">
        <header>
          <p className="m-0 text-[12px] font-semibold uppercase tracking-wide text-accent">
            {groupLabel}
          </p>
          <h1 className="mt-2 text-[24px] font-semibold text-fg">
            Sprint {sprintNumber} — fichas
          </h1>
          <p className="mt-1 text-[13px] text-fg-muted">
            <Link to="/alumno" className="text-accent no-underline hover:underline">
              ← Volver
            </Link>
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={activeKind === 'start' ? 'toggleOn' : 'toggle'}
            onClick={() => selectKind('start')}
          >
            Inicio
            {start ? ` · ${SHEET_STATUS_LABELS[start.status]}` : ''}
          </Button>
          <Button
            type="button"
            variant={activeKind === 'end' ? 'toggleOn' : 'toggle'}
            onClick={() => selectKind('end')}
            disabled={!start || start.status !== 'approved'}
          >
            Fin
            {end ? ` · ${SHEET_STATUS_LABELS[end.status]}` : ''}
          </Button>
        </div>

        {activeKind === 'start' && !start ? (
          <div className="rounded-lg border border-border bg-surface-1 p-4">
            <Text>Todavía no hay ficha de inicio.</Text>
            <Button
              className="mt-3"
              type="button"
              disabled={busy}
              onClick={() => void handleCreateStart()}
            >
              Crear ficha de inicio
            </Button>
          </div>
        ) : null}

        {activeKind === 'end' && start?.status === 'approved' && !end ? (
          <div className="rounded-lg border border-border bg-surface-1 p-4">
            <Text>
              La ficha de fin copia las tareas aprobadas del inicio. Después
              marcás hechas / no hechas y podés agregar extras.
            </Text>
            <Button
              className="mt-3"
              type="button"
              disabled={busy}
              onClick={() => void handleCreateEnd()}
            >
              Crear ficha de fin
            </Button>
          </div>
        ) : null}

        {activeSheet ? (
          <>
            {activeSheet.comments.length > 0 ? (
              <div className="rounded-lg border border-border bg-surface-1 p-4">
                <p className="m-0 text-[13px] font-semibold text-fg">
                  Comentarios del docente
                </p>
                <ul className="mt-2 m-0 flex list-none flex-col gap-2 p-0">
                  {activeSheet.comments.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px]"
                    >
                      <p className="m-0 text-fg">{c.body}</p>
                      <p className="mt-1 m-0 text-[11px] text-fg-faint">
                        {c.author.displayName || c.author.email} ·{' '}
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {TASK_CATEGORIES.map((cat) => {
              const items = byCategory.get(cat) ?? []
              if (items.length === 0 && !canEdit) return null
              return (
                <section
                  key={cat}
                  className="rounded-lg border border-border bg-surface-1 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="m-0 text-[15px] font-semibold text-fg">
                      {TASK_CATEGORY_LABELS[cat]}
                    </h2>
                    {canEdit && activeKind === 'start' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-[12px]"
                        disabled={busy}
                        onClick={() =>
                          setDraft([
                            ...draft,
                            {
                              key: `new-${Date.now()}-${cat}`,
                              category: cat,
                              title: '',
                              description: '',
                              completed: null,
                              incompleteReason: '',
                              isExtra: false,
                              extraReason: '',
                              sourceTaskId: null,
                            },
                          ])
                        }
                      >
                        + Tarea
                      </Button>
                    ) : null}
                  </div>

                  <ul className="mt-3 m-0 flex list-none flex-col gap-3 p-0">
                    {items.map((task) => (
                      <li
                        key={task.key}
                        className="rounded-md border border-border bg-surface-2 p-3"
                      >
                        {canEdit ? (
                          <>
                            <Label>Título</Label>
                            <Input
                              value={task.title}
                              disabled={busy}
                              onChange={(e) =>
                                setDraft(
                                  draft.map((d) =>
                                    d.key === task.key
                                      ? { ...d, title: e.target.value }
                                      : d,
                                  ),
                                )
                              }
                            />
                            <Label className="mt-2">Descripción (opcional)</Label>
                            <textarea
                              rows={2}
                              value={task.description}
                              disabled={busy}
                              className={cn(fieldControlClassName, 'min-h-[3rem]')}
                              onChange={(e) =>
                                setDraft(
                                  draft.map((d) =>
                                    d.key === task.key
                                      ? { ...d, description: e.target.value }
                                      : d,
                                  ),
                                )
                              }
                            />
                            {activeKind === 'end' && !task.isExtra ? (
                              <div className="mt-2 flex flex-col gap-2">
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant={
                                      task.completed === true
                                        ? 'toggleOn'
                                        : 'toggle'
                                    }
                                    disabled={busy}
                                    onClick={() =>
                                      setDraft(
                                        draft.map((d) =>
                                          d.key === task.key
                                            ? {
                                                ...d,
                                                completed: true,
                                                incompleteReason: '',
                                              }
                                            : d,
                                        ),
                                      )
                                    }
                                  >
                                    Hecha
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={
                                      task.completed === false
                                        ? 'toggleOn'
                                        : 'toggle'
                                    }
                                    disabled={busy}
                                    onClick={() =>
                                      setDraft(
                                        draft.map((d) =>
                                          d.key === task.key
                                            ? { ...d, completed: false }
                                            : d,
                                        ),
                                      )
                                    }
                                  >
                                    No hecha
                                  </Button>
                                </div>
                                {task.completed === false ? (
                                  <>
                                    <Label>¿Por qué no la terminaron?</Label>
                                    <textarea
                                      rows={2}
                                      value={task.incompleteReason}
                                      disabled={busy}
                                      className={cn(
                                        fieldControlClassName,
                                        'min-h-[3rem]',
                                      )}
                                      onChange={(e) =>
                                        setDraft(
                                          draft.map((d) =>
                                            d.key === task.key
                                              ? {
                                                  ...d,
                                                  incompleteReason:
                                                    e.target.value,
                                                }
                                              : d,
                                          ),
                                        )
                                      }
                                    />
                                  </>
                                ) : null}
                              </div>
                            ) : null}
                            {activeKind === 'end' && task.isExtra ? (
                              <>
                                <Label className="mt-2">
                                  ¿Por qué la agregaron?
                                </Label>
                                <textarea
                                  rows={2}
                                  value={task.extraReason}
                                  disabled={busy}
                                  className={cn(
                                    fieldControlClassName,
                                    'min-h-[3rem]',
                                  )}
                                  onChange={(e) =>
                                    setDraft(
                                      draft.map((d) =>
                                        d.key === task.key
                                          ? {
                                              ...d,
                                              extraReason: e.target.value,
                                            }
                                          : d,
                                      ),
                                    )
                                  }
                                />
                              </>
                            ) : null}
                            {canEdit &&
                            (activeKind === 'start' || task.isExtra) ? (
                              <div className="mt-3 flex justify-end border-t border-border/80 pt-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="min-h-9 text-[12px] text-critical"
                                  disabled={busy}
                                  onClick={() => {
                                    if (
                                      !window.confirm(
                                        '¿Eliminar esta tarea de la ficha?',
                                      )
                                    ) {
                                      return
                                    }
                                    setDraft(
                                      draft.filter((d) => d.key !== task.key),
                                    )
                                  }}
                                >
                                  Eliminar tarea
                                </Button>
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <div>
                            <p className="m-0 font-medium text-fg">{task.title}</p>
                            {task.description ? (
                              <p className="mt-1 m-0 text-[13px] text-fg-muted">
                                {task.description}
                              </p>
                            ) : null}
                            {activeKind === 'end' ? (
                              <p className="mt-1 m-0 text-[12px] text-fg-faint">
                                {task.isExtra
                                  ? `Extra · ${task.extraReason || '—'}`
                                  : task.completed
                                    ? 'Hecha'
                                    : `No hecha · ${task.incompleteReason || '—'}`}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}

            {canEdit && activeKind === 'end' ? (
              <div className="rounded-lg border border-dashed border-border bg-surface-1 p-4">
                <p className="m-0 text-[13px] font-medium text-fg">
                  Agregar tarea extra
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Select
                    id="extra-cat"
                    defaultValue="other"
                    className="max-w-[12rem]"
                  >
                    {TASK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {TASK_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      const sel = document.getElementById(
                        'extra-cat',
                      ) as HTMLSelectElement
                      const cat = (sel?.value || 'other') as TaskCategory
                      setDraft([
                        ...draft,
                        {
                          key: `extra-${Date.now()}`,
                          category: cat,
                          title: '',
                          description: '',
                          completed: true,
                          incompleteReason: '',
                          isExtra: true,
                          extraReason: '',
                          sourceTaskId: null,
                        },
                      ])
                    }}
                  >
                    + Extra
                  </Button>
                </div>
              </div>
            ) : null}

            {canEdit ? (
              <div className="flex flex-col gap-2">
                <Text faint className="text-[12px]">
                  Si eliminás una tarea, tocá <strong>Guardar</strong> para
                  confirmar el cambio.
                </Text>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void handleSave()}
                  >
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleSubmit()}
                  >
                    Enviar a revisión
                  </Button>
                </div>
              </div>
            ) : (
              <Text className="text-[13px] text-fg-muted">
                Estado: {SHEET_STATUS_LABELS[activeSheet.status]}. No se puede
                editar hasta que el docente pida cambios (o si ya está
                aprobada).
              </Text>
            )}
          </>
        ) : null}
      </section>
    </AppShell>
  )
}
