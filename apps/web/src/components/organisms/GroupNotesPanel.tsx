import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  apiOrigin,
  createGroupNote,
  deleteGroupNote,
  deleteGroupNoteAttachment,
  fetchGroupNotes,
  updateGroupNote,
  uploadGroupNoteAttachments,
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
  type GroupNoteAttachment,
} from '../../types'
import { SectionTitle } from '../molecules/SectionTitle'
import { GroupNotesListSkeleton } from './PageSkeletons'

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

function attachmentSrc(att: GroupNoteAttachment) {
  if (att.url.startsWith('http')) return att.url
  return `${apiOrigin()}${att.url}`
}

/**
 * Teacher follow-up notes (CT-049) with image attachments (CT-050).
 */
export function GroupNotesPanel({ groupId, disabled }: GroupNotesPanelProps) {
  const [notes, setNotes] = useState<GroupNote[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [preset, setPreset] = useState(GROUP_NOTE_TITLE_PRESETS[0]?.value ?? '')
  const [customTitle, setCustomTitle] = useState('')
  const [body, setBody] = useState('')
  const [createFiles, setCreateFiles] = useState<File[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const createFileInputRef = useRef<HTMLInputElement>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const attachInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
      let created = await createGroupNote(groupId, { title, body: text })
      if (createFiles.length > 0) {
        const uploaded = await uploadGroupNoteAttachments(
          created.id,
          createFiles,
        )
        created = { ...created, attachments: uploaded }
      }
      setNotes((prev) => [created, ...prev])
      setBody('')
      setCreateFiles([])
      if (createFileInputRef.current) createFileInputRef.current.value = ''
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
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...updated, attachments: n.attachments }
            : n,
        ),
      )
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
    if (!window.confirm('¿Borrar esta nota y sus fotos?')) return
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

  async function handleUploadToNote(noteId: string, fileList: FileList | null) {
    if (!fileList?.length) return
    const files = Array.from(fileList)
    setBusy(true)
    try {
      const uploaded = await uploadGroupNoteAttachments(noteId, files)
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, attachments: [...n.attachments, ...uploaded] }
            : n,
        ),
      )
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudieron subir las fotos',
      )
    } finally {
      setBusy(false)
      const input = attachInputRefs.current[noteId]
      if (input) input.value = ''
    }
  }

  async function handleDeleteAttachment(noteId: string, attachmentId: string) {
    if (!window.confirm('¿Borrar esta foto?')) return
    setBusy(true)
    try {
      await deleteGroupNoteAttachment(attachmentId)
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {
                ...n,
                attachments: n.attachments.filter((a) => a.id !== attachmentId),
              }
            : n,
        ),
      )
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudo borrar la foto',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <SectionTitle
        icon={<IconNote className="text-fg-muted" />}
        hint="Texto + fotos. Se guarda quién escribió y quién subió cada imagen."
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
        <div>
          <Label htmlFor="note-photos">Fotos (opcional)</Label>
          <input
            ref={createFileInputRef}
            id="note-photos"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={disabled || busy}
            className="block w-full text-[13px] text-fg-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface-1 file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-fg"
            onChange={(e) =>
              setCreateFiles(e.target.files ? Array.from(e.target.files) : [])
            }
          />
          {createFiles.length > 0 ? (
            <Text faint className="mt-1.5">
              {createFiles.length} archivo
              {createFiles.length === 1 ? '' : 's'} listo
              {createFiles.length === 1 ? '' : 's'} para subir
            </Text>
          ) : null}
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
        <GroupNotesListSkeleton />
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
                    Por{' '}
                    <span className="font-medium text-fg-muted">
                      {note.author.label}
                    </span>
                  </p>

                  {note.attachments.length > 0 ? (
                    <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
                      {note.attachments.map((att) => (
                        <li
                          key={att.id}
                          className="relative w-[7.5rem] overflow-hidden rounded-md border border-border bg-surface-2"
                        >
                          <a
                            href={attachmentSrc(att)}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                            title={`${att.originalName} · subida por ${att.uploadedBy.label}`}
                          >
                            <img
                              src={attachmentSrc(att)}
                              alt={att.originalName}
                              className="h-24 w-full object-cover"
                              loading="lazy"
                            />
                          </a>
                          <p className="m-0 truncate px-1.5 py-1 text-[10px] text-fg-faint">
                            {att.uploadedBy.label}
                          </p>
                          <button
                            type="button"
                            className="absolute right-1 top-1 rounded bg-surface-1/90 px-1.5 py-0.5 text-[10px] font-medium text-critical"
                            disabled={disabled || busy}
                            onClick={() =>
                              void handleDeleteAttachment(note.id, att.id)
                            }
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
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
                      className="min-h-9 px-2 text-[12px]"
                      disabled={disabled || busy}
                      onClick={() =>
                        attachInputRefs.current[note.id]?.click()
                      }
                    >
                      Agregar fotos
                    </Button>
                    <input
                      ref={(el) => {
                        attachInputRefs.current[note.id] = el
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden
                      onChange={(e) =>
                        void handleUploadToNote(note.id, e.target.files)
                      }
                    />
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
