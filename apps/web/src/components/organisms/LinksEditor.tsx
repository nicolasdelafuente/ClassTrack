import { useEffect, useState } from 'react'
import type { GroupLinks } from '../../types'
import { Button } from '../atoms/Button'
import { LinkField } from '../molecules/LinkField'

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
    <div className="flex flex-col gap-3">
      {FIELDS.map(({ key, label }) => (
        <LinkField
          key={key}
          id={key}
          label={label}
          value={draft[key] ?? ''}
          disabled={disabled || saving}
          onChange={(value) => setDraft((prev) => ({ ...prev, [key]: value }))}
        />
      ))}

      <div className="mt-1 flex flex-wrap items-center gap-2.5">
        <Button
          variant="primary"
          disabled={!dirty || saving || disabled}
          onClick={() => void handleSave()}
        >
          {saving ? 'Guardando…' : 'Guardar links'}
        </Button>
        {message ? (
          <span className="text-xs text-fg-muted">{message}</span>
        ) : null}
      </div>
    </div>
  )
}
