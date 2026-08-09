import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  createEndSheet,
  createStartSheet,
  fetchStudentSprintSheets,
  saveSheetTasks,
  submitSheet,
} from '../api/client'
import { Button } from '../components/atoms/Button'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { InlineStatus } from '../components/atoms/InlineStatus'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import { Panel } from '../components/atoms/Panel'
import { SheetStatusBadge } from '../components/atoms/SheetStatusBadge'
import { Text } from '../components/atoms/Text'
import { StateBox } from '../components/molecules/StateBox'
import { ListRow } from '../components/molecules/ListRow'
import { PageHero } from '../components/organisms/PageHero'
import {
  RichTextEditor,
  RichTextView,
  sanitizeRichHtml,
} from '../components/molecules/RichTextEditor'
import { TaskCategoryChips } from '../components/molecules/TaskCategoryChips'
import { TaskTrelloLinks } from '../components/molecules/TaskTrelloLinks'
import { SprintSheetPageSkeleton } from '../components/organisms/PageSkeletons'
import { AppShell } from '../components/templates/AppShell'
import {
  SHEET_STATUS_LABELS,
  type SheetStatus,
  type SprintSheet,
  type SprintSheetTask,
  type TaskCategory,
} from '../types'

type DraftTask = {
  key: string
  categories: TaskCategory[]
  title: string
  description: string
  completed: boolean | null
  incompleteReason: string
  isExtra: boolean
  extraReason: string
  sourceTaskId: string | null
  trelloLinks: string[]
}

function toDraft(tasks: SprintSheetTask[]): DraftTask[] {
  return tasks.map((t, i) => ({
    key: t.id || `new-${i}`,
    categories: t.categories ?? [],
    title: t.title,
    description: t.description ?? '',
    completed: t.completed,
    incompleteReason: t.incompleteReason ?? '',
    isExtra: t.isExtra,
    extraReason: t.extraReason ?? '',
    sourceTaskId: t.sourceTaskId,
    trelloLinks: t.trelloLinks ?? [],
  }))
}

function editable(status: SheetStatus) {
  return status === 'draft' || status === 'needs_changes'
}

function emptyTask(partial?: Partial<DraftTask>): DraftTask {
  return {
    key: `new-${Date.now()}`,
    categories: [],
    title: '',
    description: '',
    completed: null,
    incompleteReason: '',
    isExtra: false,
    extraReason: '',
    sourceTaskId: null,
    trelloLinks: [],
    ...partial,
  }
}

/**
 * Student editor for start/end sprint sheet of one sprint.
 * CT-070: single task list + composer (tags are optional chips).
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
  const [composerTitle, setComposerTitle] = useState('')
  const [composerCategories, setComposerCategories] = useState<TaskCategory[]>(
    [],
  )
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savePhase, setSavePhase] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedLabel, setSavedLabel] = useState('Guardado')

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
    setComposerTitle('')
    setComposerCategories([])
  }

  function patchTask(key: string, patch: Partial<DraftTask>) {
    setDraft((prev) =>
      prev.map((d) => (d.key === key ? { ...d, ...patch } : d)),
    )
  }

  function tasksPayload() {
    return draft.map((t, i) => ({
      categories: t.categories,
      title: t.title,
      description: sanitizeRichHtml(t.description) || null,
      completed: activeKind === 'end' ? t.completed : null,
      incompleteReason:
        activeKind === 'end'
          ? sanitizeRichHtml(t.incompleteReason) || null
          : null,
      isExtra: activeKind === 'end' ? t.isExtra : false,
      extraReason:
        activeKind === 'end' ? sanitizeRichHtml(t.extraReason) || null : null,
      sourceTaskId: activeKind === 'end' ? t.sourceTaskId : null,
      trelloLinks: t.trelloLinks,
      sortOrder: i,
    }))
  }

  async function handleCreateStart() {
    setBusy(true)
    setSaveError(null)
    try {
      const res = await createStartSheet(groupId, sprintNumber)
      setStart(res.sheet)
      setActiveKind('start')
      setDraft([])
    } catch (err) {
      setSavePhase('error')
      setSaveError(err instanceof Error ? err.message : 'No se pudo crear')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateEnd() {
    setBusy(true)
    setSaveError(null)
    try {
      const res = await createEndSheet(groupId, sprintNumber)
      setEnd(res.sheet)
      setActiveKind('end')
      setDraft(toDraft(res.sheet.tasks))
    } catch (err) {
      setSavePhase('error')
      setSaveError(err instanceof Error ? err.message : 'No se pudo crear')
    } finally {
      setBusy(false)
    }
  }

  function addComposerTask(asExtra = false) {
    const title = composerTitle.trim()
    if (!title) return
    setDraft((prev) => [
      ...prev,
      emptyTask({
        key: `${asExtra ? 'extra' : 'new'}-${Date.now()}`,
        title,
        categories: composerCategories,
        isExtra: asExtra,
        completed: asExtra ? true : null,
      }),
    ])
    setComposerTitle('')
    setComposerCategories([])
  }

  async function handleSave() {
    if (!activeSheet) return
    setBusy(true)
    setSaveError(null)
    try {
      const res = await saveSheetTasks(activeSheet.id, tasksPayload())
      if (activeKind === 'start') setStart(res.sheet)
      else setEnd(res.sheet)
      setDraft(toDraft(res.sheet.tasks))
      setSavedLabel('Guardado')
      setSavePhase('saved')
    } catch (err) {
      setSavePhase('error')
      setSaveError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit() {
    if (!activeSheet) return
    setBusy(true)
    setSaveError(null)
    try {
      await saveSheetTasks(activeSheet.id, tasksPayload())
      const sheet = await submitSheet(activeSheet.id)
      if (sheet.kind === 'start') setStart(sheet)
      else setEnd(sheet)
      setSavedLabel('Enviada a revisión')
      setSavePhase('saved')
    } catch (err) {
      setSavePhase('error')
      setSaveError(err instanceof Error ? err.message : 'No se pudo enviar')
    } finally {
      setBusy(false)
    }
  }

  const inlinePhase = busy ? 'saving' : savePhase

  if (loading) {
    return (
      <AppShell showBack>
        <SprintSheetPageSkeleton />
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
    <AppShell showBack backTo="/alumno" backLabel="← Mi grupo">
      <section className="mx-auto flex max-w-2xl flex-col gap-4 pb-10">
        <PageHero
          eyebrow={groupLabel}
          title={`Sprint ${sprintNumber} — fichas`}
          description="Completá inicio y fin del sprint. Guardá borrador y enviá a revisión cuando esté lista."
          actions={
            <>
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
            </>
          }
        />

        {activeKind === 'start' && !start ? (
          <Panel className="p-4">
            <Text>Todavía no hay ficha de inicio.</Text>
            <Button
              className="mt-3"
              type="button"
              disabled={busy}
              onClick={() => void handleCreateStart()}
            >
              Crear ficha de inicio
            </Button>
          </Panel>
        ) : null}

        {activeKind === 'end' && start?.status === 'approved' && !end ? (
          <Panel className="p-4">
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
          </Panel>
        ) : null}

        {activeSheet ? (
          <>
            {activeSheet.comments.length > 0 ? (
              <Panel className="p-4">
                <p className="m-0 text-[13px] font-semibold text-fg">
                  Comentarios del docente
                </p>
                <ul className="mt-2 m-0 flex list-none flex-col gap-2 p-0">
                  {activeSheet.comments.map((c) => (
                    <ListRow
                      key={c.id}
                      as="li"
                      tone="soft"
                      className="px-3 py-2 text-[13px]"
                    >
                      <p className="m-0 text-fg">{c.body}</p>
                      <p className="mt-1 m-0 text-[11px] text-fg-faint">
                        {c.author.displayName || c.author.email} ·{' '}
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </ListRow>
                  ))}
                </ul>
              </Panel>
            ) : null}

            <Panel as="section" className="p-4">
              <h2 className="m-0 text-[17px] font-semibold text-fg">
                {activeKind === 'start'
                  ? '¿Qué vamos a hacer en este sprint?'
                  : 'Tareas del sprint'}
              </h2>
              <p className="mt-1 m-0 text-[13px] text-fg-muted">
                {activeKind === 'start'
                  ? 'Agregá tareas en un solo listado. Los tags son opcionales.'
                  : 'Marcá el avance y, si hace falta, sumá tareas extra.'}
              </p>

              {canEdit &&
              (activeKind === 'start' || activeKind === 'end') ? (
                <Panel tone="soft" className="mt-4 flex flex-col gap-2 p-3">
                  <Label htmlFor="sheet-task-composer">
                    {activeKind === 'end' ? 'Nueva tarea extra' : 'Nueva tarea'}
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    <Input
                      id="sheet-task-composer"
                      className="min-w-0 flex-1"
                      placeholder="Escribí una tarea..."
                      value={composerTitle}
                      disabled={busy}
                      onChange={(e) => setComposerTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addComposerTask(activeKind === 'end')
                        }
                      }}
                    />
                    <Button
                      type="button"
                      disabled={busy || !composerTitle.trim()}
                      className="shrink-0 sm:self-stretch"
                      onClick={() => addComposerTask(activeKind === 'end')}
                    >
                      {activeKind === 'end' ? '+ Extra' : '+'}
                    </Button>
                  </div>
                  <TaskCategoryChips
                    editable
                    disabled={busy}
                    value={composerCategories}
                    onChange={setComposerCategories}
                  />
                </Panel>
              ) : null}

              {draft.length === 0 ? (
                <p className="mt-4 m-0 text-[13px] text-fg-muted">
                  Todavía no hay tareas en esta ficha.
                </p>
              ) : (
                <ul className="mt-4 m-0 flex list-none flex-col gap-2.5 p-0">
                  {draft.map((task) => (
                    <ListRow
                      key={task.key}
                      as="li"
                      tone="soft"
                      interactive
                      className="p-3"
                    >
                      {canEdit ? (
                        <div className="flex flex-col gap-2">
                          <TaskCategoryChips
                            editable
                            disabled={busy}
                            value={task.categories}
                            onChange={(categories) =>
                              patchTask(task.key, { categories })
                            }
                          />
                          <Label>Título</Label>
                          <Input
                            value={task.title}
                            disabled={busy}
                            onChange={(e) =>
                              patchTask(task.key, { title: e.target.value })
                            }
                          />
                          <RichTextEditor
                            label="Descripción (opcional)"
                            value={task.description}
                            disabled={busy}
                            onChange={(html) =>
                              patchTask(task.key, { description: html })
                            }
                          />
                          <TaskTrelloLinks
                            editable
                            disabled={busy}
                            links={task.trelloLinks}
                            onChange={(trelloLinks) =>
                              patchTask(task.key, { trelloLinks })
                            }
                          />
                          {activeKind === 'end' && !task.isExtra ? (
                            <div className="mt-1 flex flex-col gap-2">
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
                                    patchTask(task.key, {
                                      completed: true,
                                      incompleteReason: '',
                                    })
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
                                    patchTask(task.key, { completed: false })
                                  }
                                >
                                  No hecha
                                </Button>
                              </div>
                              {task.completed === false ? (
                                <RichTextEditor
                                  label="¿Por qué no la terminaron?"
                                  value={task.incompleteReason}
                                  disabled={busy}
                                  onChange={(html) =>
                                    patchTask(task.key, {
                                      incompleteReason: html,
                                    })
                                  }
                                />
                              ) : null}
                            </div>
                          ) : null}
                          {activeKind === 'end' && task.isExtra ? (
                            <RichTextEditor
                              label="¿Por qué la agregaron?"
                              value={task.extraReason}
                              disabled={busy}
                              onChange={(html) =>
                                patchTask(task.key, { extraReason: html })
                              }
                            />
                          ) : null}
                          {activeKind === 'start' || task.isExtra ? (
                            <div className="mt-1 flex justify-end border-t border-border/80 pt-2">
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
                                  setDraft((prev) =>
                                    prev.filter((d) => d.key !== task.key),
                                  )
                                }}
                              >
                                Eliminar tarea
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <TaskCategoryChips value={task.categories} />
                          <p className="m-0 font-medium text-fg">{task.title}</p>
                          {task.description ? (
                            <RichTextView
                              className="mt-0.5"
                              html={task.description}
                            />
                          ) : null}
                          <TaskTrelloLinks links={task.trelloLinks} />
                          {activeKind === 'end' ? (
                            <div className="mt-1 text-[12px] text-fg-faint">
                              {task.isExtra ? (
                                <>
                                  <span>Extra</span>
                                  {task.extraReason ? (
                                    <RichTextView
                                      className="mt-0.5"
                                      html={task.extraReason}
                                    />
                                  ) : null}
                                </>
                              ) : task.completed ? (
                                'Hecha'
                              ) : (
                                <>
                                  <span>No hecha</span>
                                  {task.incompleteReason ? (
                                    <RichTextView
                                      className="mt-0.5"
                                      html={task.incompleteReason}
                                    />
                                  ) : null}
                                </>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </ListRow>
                  ))}
                </ul>
              )}
            </Panel>

            {canEdit ? (
              <div className="flex flex-col gap-2">
                <Text faint className="text-[12px]">
                  Si eliminás una tarea, tocá <strong>Guardar</strong> para
                  confirmar el cambio.
                </Text>
                <div className="flex flex-wrap items-center gap-2">
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
                  <InlineStatus
                    phase={inlinePhase}
                    savedLabel={savedLabel}
                    errorMessage={saveError}
                  />
                </div>
              </div>
            ) : (
              <Text className="flex flex-wrap items-center gap-1.5 text-[13px] text-fg-muted">
                Estado: <SheetStatusBadge status={activeSheet.status} />. No se
                puede editar hasta que el docente pida cambios (o si ya está
                aprobada).
              </Text>
            )}
          </>
        ) : null}
      </section>
    </AppShell>
  )
}
