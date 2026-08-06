import { useEffect, useState } from 'react'
import type { GroupLinks } from '../types'

type LinksEditorProps = {
  links: GroupLinks
  disabled?: boolean
  onSave: (links: GroupLinks) => Promise<void>
}

const FIELDS: { key: keyof GroupLinks; label: string }[] = [
  { key: 'githubUrl', label: 'GitHub' },
  { key: 'trelloUrl', label: 'Trello' },
  { key: 'driveUrl', label: 'Drive' },
]

export function LinksEditor({ links, disabled = false, onSave }: LinksEditorProps) {
  const [draft, setDraft] = useState<GroupLinks>(links)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setDraft(links)
  }, [links])

  const dirty =
    draft.githubUrl !== links.githubUrl ||
    draft.trelloUrl !== links.trelloUrl ||
    draft.driveUrl !== links.driveUrl

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      await onSave(draft)
      setMessage('Links guardados')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="links-editor">
      {FIELDS.map(({ key, label }) => {
        const value = draft[key] ?? ''
        return (
          <div key={key} className="links-editor__row">
            <label className="links-editor__label" htmlFor={key}>
              {label}
            </label>
            <div className="links-editor__controls">
              <input
                id={key}
                className="links-editor__input"
                type="url"
                inputMode="url"
                placeholder="https://…"
                value={value}
                disabled={disabled || saving}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
              {value.trim() ? (
                <a
                  className="links-editor__open"
                  href={value.trim()}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir
                </a>
              ) : (
                <span className="links-editor__open links-editor__open--disabled">
                  Sin link
                </span>
              )}
            </div>
          </div>
        )
      })}

      <div className="links-editor__footer">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!dirty || saving || disabled}
          onClick={() => void handleSave()}
        >
          {saving ? 'Guardando…' : 'Guardar links'}
        </button>
        {message ? <span className="links-editor__msg">{message}</span> : null}
      </div>
    </div>
  )
}
