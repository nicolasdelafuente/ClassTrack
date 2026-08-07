import { useMemo, useState } from 'react'
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
import { Panel } from '../atoms/Panel'
import { DatePicker, formatDateDisplay } from '../molecules/DatePicker'
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
  onCancel: () => void
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

/** Inline form to create/edit a class (full page, not a modal). */
export function ScheduleSessionEditor({
  courseId,
  session,
  activityTypeDefaults,
  onCancel,
  onSaved,
  onDeleted,
  onCreated,
}: ScheduleSessionEditorProps) {
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
    setItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((i) => i.key !== key),
    )
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Panel tone="default" className="overflow-hidden p-0">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
          <div className="border-b border-border p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <Label htmlFor="session-date">Fecha</Label>
            <div className="mt-2">
              <DatePicker
                id="session-date"
                value={date}
                disabled={saving}
                alwaysOpen
                showTrigger={false}
                embedded
                onChange={setDate}
              />
            </div>
          </div>

          <aside className="flex flex-col gap-4 bg-surface-2/50 p-4 sm:p-5">
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
                Seleccionada
              </p>
              <p className="m-0 mt-1 text-[22px] font-semibold tabular-nums tracking-tight text-fg sm:text-[24px]">
                {formatDateDisplay(date)}
              </p>
            </div>

            <div>
              <p className="m-0 mb-1.5 text-[12px] font-medium text-fg-muted">
                Estado del día
              </p>
              {looksLikeHoliday ? (
                <p className="m-0 rounded-md border border-border bg-surface-1 px-3 py-2.5 text-[13px] text-fg-faint">
                  Feriado / sin lista
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant={isMandatory ? 'toggleOn' : 'toggle'}
                    disabled={saving}
                    className={cn(
                      'h-9 min-h-9 w-full text-[12px]',
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
                      'h-9 min-h-9 w-full border-border-strong text-[12px]',
                      !isMandatory &&
                        'ring-2 ring-[color-mix(in_srgb,var(--color-fg-muted)_25%,transparent)]',
                    )}
                    onClick={() => setIsMandatory(false)}
                  >
                    Optativa
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </Panel>

      <Panel tone="default" className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-2/80 px-4 py-3">
          <p className="m-0 text-[15px] font-semibold text-fg">Actividades</p>
          <button
            type="button"
            disabled={saving}
            className="cursor-pointer text-[12px] font-semibold text-accent hover:underline"
            onClick={() =>
              setItems((prev) => [...prev, newDraftItem(activityTypeDefaults)])
            }
          >
            + Agregar
          </button>
        </div>

        <ul className="m-0 flex list-none flex-col gap-0 p-0">
          {items.map((item, index) => (
            <li
              key={item.key}
              className="border-b border-border px-4 py-3 last:border-b-0"
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
      </Panel>

      {error ? (
        <p className="m-0 rounded-md bg-critical-soft px-3 py-2 text-[13px] font-medium text-critical">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
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
          <Button variant="ghost" disabled={saving} onClick={onCancel}>
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
      </div>
    </div>
  )
}
