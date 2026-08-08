import { useEffect, useState, type FormEvent } from 'react'
import {
  createGroupNote,
  deleteGroupNote,
  fetchGroupNotes,
  updateGroupNote,
} from '../../api/client'
import { Button } from '../atoms/Button'
import { IconNote } from '../atoms/icons'
import { Input, fieldControlClassName } from '../atoms/Input'
import { Label } from '../atoms/Label'
import { Select } from '../atoms/Select'
import { Text } from '../atoms/Text'
import { cn } from '../../lib/cn'
import {
  GROUP_NOTE_TITLE_PRESETS,
  type GroupNote,
} from '../../types'
import { SectionTitle } from '../molecules/SectionTitle'

type GroupNotesPanelProps = {
  groupId: string
  disabled?: boolean
}

function formatNoteWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/**
 * Teacher follow-up notes for a group (CT-049).
 * Shows author + datetime on every note; title from preset or free text.
 */
export function GroupNotesPanel({ groupId, disabled }: GroupNotesPanelProps) {
  const [notes, setNotes] = useState<GroupNote[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [preset, setPreset] = useState(GROUP_NOTE_TITLE_PRESETS[0]?.value ?? '')
  const [customTitle, setCustomTitle] = useState('')
  const [body, setBody] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const list = await fetchGroupNotes(groupId)
        if (!cancelled) setNotes(list)
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'No se pudieron cargar las notas',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [groupId])

  function resolvedCreateTitle() {
    if (preset) return preset.trim()
    return customTitle.trim()
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    const title = resolvedCreateTitle()
    const text = body.trim()
    if (!title) {
      setFormError('Elegí un título o escribí uno libre')
      return
    }
    if (!text) {
      setFormError('Escribí el contenido de la nota')
      return
    }
    setBusy(true)
    setFormError(null)
    try {
      const created = await createGroupNote(groupId, { title, body: text })
      setNotes((prev) => [created, ...prev])
      setBody('')
      if (!preset) setCustomTitle('')
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo guardar la nota',
      )
    } finally {
      setBusy(false)
    }
  }

  function startEdit(note: GroupNote) {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditBody(note.body)
    setFormError(null)
  }

  async function handleSaveEdit(noteId: string) {
    const title = editTitle.trim()
    const text = editBody.trim()
    if (!title || !text) {
      setFormError('Título y texto son obligatorios')
      return
    }
    setBusy(true)
    setFormError(null)
    try {
      const updated = await updateGroupNote(noteId, { title, body: text })
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)))
      setEditingId(null)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo actualizar la nota',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(noteId: string) {
    if (!window.confirm('¿Borrar esta nota?')) return
    setBusy(true)
    try {
      await deleteGroupNote(noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
      if (editingId === noteId) setEditingId(null)
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudo borrar la nota',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <SectionTitle
        icon={<IconNote className="text-fg-muted" />}
        hint="Cualquier docente puede escribir. Se guarda quién y cuándo."
      >
        Notas de seguimiento
      </SectionTitle>

      <form
        className="mt-3 grid gap-3 border-b border-border pb-4"
        onSubmit={(e) => void handleCreate(e)}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="note-preset">Título</Label>
            <Select
              id="note-preset"
              value={preset}
              disabled={disabled || busy}
              onChange={(e) => setPreset(e.target.value)}
            >
              {GROUP_NOTE_TITLE_PRESETS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          {!preset ? (
            <div>
              <Label htmlFor="note-custom-title">Título libre</Label>
              <Input
                id="note-custom-title"
                value={customTitle}
                disabled={disabled || busy}
                maxLength={120}
                placeholder="Ej. Charla con el equipo"
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>
          ) : null}
        </div>
        <div>
          <Label htmlFor="note-body">Nota</Label>
          <textarea
            id="note-body"
            rows={3}
            value={body}
            disabled={disabled || busy}
            maxLength={5000}
            placeholder="Qué pasó en el seguimiento, acuerdos, pendientes…"
            className={cn(fieldControlClassName, 'min-h-[5.5rem] resize-y')}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        {formError && !editingId ? (
          <Text className="text-[13px] text-critical">{formError}</Text>
        ) : null}
        <div>
          <Button type="submit" disabled={disabled || busy} className="min-h-11">
            Guardar nota
          </Button>
        </div>
      </form>

      {loading ? (
        <Text className="mt-4 text-[13px] text-fg-faint">Cargando notas…</Text>
      ) : loadError ? (
        <Text className="mt-4 text-[13px] text-critical">{loadError}</Text>
      ) : notes.length === 0 ? (
        <Text className="mt-4 text-[13px] text-fg-faint">
          Todavía no hay notas en este grupo.
        </Text>
      ) : (
        <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-md border border-border bg-surface-1 px-3 py-3"
            >
              {editingId === note.id ? (
                <div className="grid gap-2">
                  <Input
                    value={editTitle}
                    disabled={busy}
                    maxLength={120}
                    aria-label="Editar título"
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <textarea
                    rows={3}
                    value={editBody}
                    disabled={busy}
                    maxLength={5000}
                    aria-label="Editar nota"
                    className={cn(fieldControlClassName, 'min-h-[5rem] resize-y')}
                    onChange={(e) => setEditBody(e.target.value)}
                  />
                  {formError ? (
                    <Text className="text-[13px] text-critical">{formError}</Text>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={busy}
                      className="min-h-10"
                      onClick={() => void handleSaveEdit(note.id)}
                    >
                      Guardar cambios
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      className="min-h-10"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="m-0 text-[14px] font-semibold text-fg">
                      {note.title}
                    </h3>
                    <time
                      className="text-[11px] tabular-nums text-fg-faint"
                      dateTime={note.createdAt}
                    >
                      {formatNoteWhen(note.createdAt)}
                    </time>
                  </div>
                  <p className="m-0 mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-fg-muted">
                    {note.body}
                  </p>
                  <p className="m-0 mt-2 text-[12px] text-fg-faint">
                    Por <span className="font-medium text-fg-muted">{note.author.label}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      className="min-h-9 px-2 text-[12px]"
                      disabled={disabled || busy}
                      onClick={() => startEdit(note)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-9 px-2 text-[12px] text-critical"
                      disabled={disabled || busy}
                      onClick={() => void handleDelete(note.id)}
                    >
                      Borrar
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
