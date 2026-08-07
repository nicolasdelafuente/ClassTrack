import { useEffect, useId, useMemo, useState } from 'react'
import {
  createScheduleItem,
  createScheduleSession,
  deleteScheduleItem,
  deleteScheduleSession,
  patchScheduleItem,
  patchScheduleSession,
} from '../../api/client'
import { Button } from '../atoms/Button'
import { Input } from '../atoms/Input'
import { Label } from '../atoms/Label'
import {
  CLASS_ACTIVITY_TYPE_LABELS,
  type ActivityTypeDefault,
  type ClassActivityType,
  type ScheduleItem,
  type ScheduleSession,
} from '../../types'
import { cn } from '../../lib/cn'

const ACTIVITY_TYPES = Object.keys(
  CLASS_ACTIVITY_TYPE_LABELS,
) as ClassActivityType[]

type DraftItem = {
  /** Existing server id, or null for new rows. */
  id: string | null
  key: string
  title: string
  activityType: ClassActivityType
  isMandatory: boolean
}

type ScheduleSessionEditorProps = {
  courseId: string
  /** null = create new class */
  session: ScheduleSession | null
  activityTypeDefaults: ActivityTypeDefault[]
  onClose: () => void
  onSaved: (session: ScheduleSession) => void
  onDeleted: (sessionId: string) => void
  onCreated: (session: ScheduleSession) => void
}

function defaultMandatory(
  type: ClassActivityType,
  defaults: ActivityTypeDefault[],
) {
  return (
    defaults.find((d) => d.activityType === type)?.isMandatoryByDefault ??
    false
  )
}

function toDraftItems(items: ScheduleItem[]): DraftItem[] {
  return items.map((item) => ({
    id: item.id,
    key: item.id,
    title: item.title,
    activityType: item.activityType,
    isMandatory: item.isMandatory,
  }))
}

function newDraftItem(
  defaults: ActivityTypeDefault[],
  type: ClassActivityType = 'teorica',
): DraftItem {
  return {
    id: null,
    key: `new-${crypto.randomUUID()}`,
    title: '',
    activityType: type,
    isMandatory: defaultMandatory(type, defaults),
  }
}

const selectClassName =
  'mt-1 w-full min-h-10 rounded-md border border-border bg-surface-1 px-2.5 text-[13px] text-fg shadow-panel'

export function ScheduleSessionEditor({
  courseId,
  session,
  activityTypeDefaults,
  onClose,
  onSaved,
  onDeleted,
  onCreated,
}: ScheduleSessionEditorProps) {
  const titleId = useId()
  const isCreate = session === null

  const [date, setDate] = useState(
    session?.date ?? new Date().toISOString().slice(0, 10),
  )
  const [isMandatory, setIsMandatory] = useState(session?.isMandatory ?? true)
  const [items, setItems] = useState<DraftItem[]>(() =>
    session
      ? toDraftItems(session.items)
      : [newDraftItem(activityTypeDefaults)],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const looksLikeHoliday = useMemo(
    () => items.some((i) => i.activityType === 'feriado'),
    [items],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item
        const next = { ...item, ...patch }
        if (patch.activityType && patch.activityType !== item.activityType) {
          next.isMandatory = defaultMandatory(
            patch.activityType,
            activityTypeDefaults,
          )
          if (patch.activityType === 'feriado') {
            next.title = next.title.trim() || 'Feriado'
            next.isMandatory = false
          }
        }
        return next
      }),
    )
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.key !== key)))
  }

  async function handleSave() {
    setError(null)
    const cleaned = items
      .map((i) => ({ ...i, title: i.title.trim() }))
      .filter((i) => i.title.length > 0)

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('La fecha es inválida')
      return
    }
    if (cleaned.length === 0) {
      setError('Agregá al menos una actividad con título')
      return
    }

    setSaving(true)
    try {
      if (isCreate) {
        const created = await createScheduleSession(courseId, {
          date,
          isMandatory: looksLikeHoliday ? false : isMandatory,
          items: cleaned.map((i) => ({
            title: i.title,
            activityType: i.activityType,
            isMandatory: i.activityType === 'feriado' ? false : i.isMandatory,
          })),
        })
        onCreated(created)
        onClose()
        return
      }

      const sessionId = session.id
      let latest = await patchScheduleSession(courseId, sessionId, {
        date,
        isMandatory: looksLikeHoliday ? false : isMandatory,
      })

      const keptIds = new Set(
        cleaned.filter((i) => i.id).map((i) => i.id as string),
      )
      const toDelete = session.items
        .map((i) => i.id)
        .filter((id) => !keptIds.has(id))

      for (const item of cleaned.filter((i) => i.id)) {
        latest = await patchScheduleItem(courseId, sessionId, item.id!, {
          title: item.title,
          activityType: item.activityType,
          isMandatory:
            item.activityType === 'feriado' ? false : item.isMandatory,
        })
      }

      for (const item of cleaned.filter((i) => !i.id)) {
        latest = await createScheduleItem(courseId, sessionId, {
          title: item.title,
          activityType: item.activityType,
          isMandatory:
            item.activityType === 'feriado' ? false : item.isMandatory,
        })
      }

      for (const itemId of toDelete) {
        latest = await deleteScheduleItem(courseId, sessionId, itemId)
      }

      onSaved(latest)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!session || isCreate) return
    const ok = window.confirm(
      `¿Eliminar la clase del ${session.date}? Esta acción no se puede deshacer.`,
    )
    if (!ok) return
    setSaving(true)
    setError(null)
    try {
      await deleteScheduleSession(courseId, session.id)
      onDeleted(session.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar editor"
        className="absolute inset-0 cursor-pointer bg-fg/35"
        disabled={saving}
        onClick={() => {
          if (!saving) onClose()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-surface-1 shadow-lift sm:max-h-[88dvh] sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="m-0 text-[18px] font-semibold text-fg">
              {isCreate ? 'Nueva clase' : 'Editar clase'}
            </h2>
            <p className="m-0 mt-0.5 text-[12px] text-fg-faint">
              Fecha, actividades, tipo y obligatoriedad. Feriado = sin lista.
            </p>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-md px-2 py-1 text-[13px] font-medium text-fg-faint hover:text-fg"
            disabled={saving}
            onClick={onClose}
          >
            Cerrar
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="session-date">Fecha</Label>
              <Input
                id="session-date"
                type="date"
                value={date}
                disabled={saving}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <p className="m-0 mb-1.5 text-[12px] font-medium text-fg-muted">
                Estado del día
              </p>
              {looksLikeHoliday ? (
                <p className="m-0 text-[13px] text-fg-faint">
                  Feriado / sin lista (por el tipo de actividad)
                </p>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant={isMandatory ? 'toggleOn' : 'toggle'}
                    disabled={saving}
                    className={cn(
                      'h-9 min-h-9 flex-1 text-[12px]',
                      !isMandatory && 'border-border-strong',
                    )}
                    onClick={() => setIsMandatory(true)}
                  >
                    Obligatoria
                  </Button>
                  <Button
                    variant="toggle"
                    disabled={saving}
                    className={cn(
                      'h-9 min-h-9 flex-1 border-border-strong text-[12px]',
                      !isMandatory && 'ring-2 ring-[color-mix(in_srgb,var(--color-fg-muted)_25%,transparent)]',
                    )}
                    onClick={() => setIsMandatory(false)}
                  >
                    Optativa
                  </Button>
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="m-0 text-[12px] font-medium text-fg-muted">
                  Actividades
                </p>
                <button
                  type="button"
                  disabled={saving}
                  className="cursor-pointer text-[12px] font-semibold text-accent hover:underline"
                  onClick={() =>
                    setItems((prev) => [
                      ...prev,
                      newDraftItem(activityTypeDefaults),
                    ])
                  }
                >
                  + Agregar
                </button>
              </div>

              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {items.map((item, index) => (
                  <li
                    key={item.key}
                    className="rounded-xl border border-border bg-surface-2/60 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-fg-faint">
                        Actividad {index + 1}
                      </span>
                      {items.length > 1 ? (
                        <button
                          type="button"
                          disabled={saving}
                          className="cursor-pointer text-[12px] font-medium text-critical hover:underline"
                          onClick={() => removeItem(item.key)}
                        >
                          Quitar
                        </button>
                      ) : null}
                    </div>

                    <Label htmlFor={`item-title-${item.key}`}>Título</Label>
                    <Input
                      id={`item-title-${item.key}`}
                      value={item.title}
                      disabled={saving}
                      placeholder="Ej. Sprint review"
                      onChange={(e) =>
                        updateItem(item.key, { title: e.target.value })
                      }
                    />

                    <div className="mt-2">
                      <Label htmlFor={`item-type-${item.key}`}>Tipo</Label>
                      <select
                        id={`item-type-${item.key}`}
                        className={selectClassName}
                        value={item.activityType}
                        disabled={saving}
                        onChange={(e) =>
                          updateItem(item.key, {
                            activityType: e.target.value as ClassActivityType,
                          })
                        }
                      >
                        {ACTIVITY_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {CLASS_ACTIVITY_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {item.activityType !== 'feriado' ? (
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant={item.isMandatory ? 'toggleOn' : 'toggle'}
                          disabled={saving}
                          className={cn(
                            'h-9 min-h-9 flex-1 text-[12px]',
                            !item.isMandatory && 'border-border-strong',
                          )}
                          onClick={() =>
                            updateItem(item.key, { isMandatory: true })
                          }
                        >
                          Obligatoria
                        </Button>
                        <Button
                          variant="toggle"
                          disabled={saving}
                          className={cn(
                            'h-9 min-h-9 flex-1 border-border-strong text-[12px]',
                            !item.isMandatory &&
                              'ring-2 ring-[color-mix(in_srgb,var(--color-fg-muted)_25%,transparent)]',
                          )}
                          onClick={() =>
                            updateItem(item.key, { isMandatory: false })
                          }
                        >
                          Optativa
                        </Button>
                      </div>
                    ) : (
                      <p className="m-0 mt-2 text-[12px] text-fg-faint">
                        Este ítem marca el día como feriado (sin asistencia).
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {error ? (
              <p className="m-0 rounded-md bg-critical-soft px-3 py-2 text-[13px] font-medium text-critical">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          {!isCreate ? (
            <button
              type="button"
              disabled={saving}
              className="cursor-pointer text-[13px] font-medium text-critical hover:underline disabled:opacity-50"
              onClick={() => void handleDelete()}
            >
              Eliminar clase
            </button>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" disabled={saving} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
