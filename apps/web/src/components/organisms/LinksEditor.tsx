import { useEffect, useState, type ReactNode } from 'react'
import type { GroupLinks } from '../../types'
import { Button } from '../atoms/Button'
import { IconDrive, IconGithub, IconTrello } from '../atoms/icons'
import { Input } from '../atoms/Input'
import { cn } from '../../lib/cn'

type LinksEditorProps = {
  links: GroupLinks
  disabled?: boolean
  onSave: (links: GroupLinks) => Promise<void>
}

const FIELDS: {
  key: keyof GroupLinks
  label: string
  icon: ReactNode
  placeholder: string
}[] = [
  {
    key: 'githubUrl',
    label: 'GitHub',
    icon: <IconGithub className="text-fg" />,
    placeholder: 'https://github.com/…',
  },
  {
    key: 'trelloUrl',
    label: 'Trello',
    icon: <IconTrello className="text-fg" />,
    placeholder: 'https://trello.com/…',
  },
  {
    key: 'driveUrl',
    label: 'Drive',
    icon: <IconDrive className="text-fg" />,
    placeholder: 'https://drive.google.com/…',
  },
]

function hostLabel(url: string | null | undefined) {
  if (!url?.trim()) return null
  try {
    return new URL(url.trim()).host.replace(/^www\./, '')
  } catch {
    return url.trim()
  }
}

export function LinksEditor({ links, disabled = false, onSave }: LinksEditorProps) {
  const [draft, setDraft] = useState<GroupLinks>(links)
  const [editing, setEditing] = useState(false)
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
      setMessage('Guardado')
      setEditing(false)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {FIELDS.map(({ key, label, icon, placeholder }, index) => {
        const value = draft[key]
        const host = hostLabel(value)
        const connected = Boolean(host)

        return (
          <div
            key={key}
            style={{ animationDelay: `${index * 45}ms` }}
            className={cn(
              'rounded-xl border border-border bg-surface-1 px-3 py-3 shadow-panel transition-[transform,box-shadow,border-color] duration-200 ease-out motion-safe:animate-fade-up',
              !editing &&
                'hover:border-border-strong hover:shadow-lift motion-safe:hover:-translate-y-0.5',
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-base text-fg"
                aria-hidden
              >
                {icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-fg">{label}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      connected
                        ? 'bg-ok-soft text-ok'
                        : 'bg-surface-2 text-fg-faint',
                    )}
                  >
                    {connected ? 'Conectado' : 'Sin configurar'}
                  </span>
                </div>

                {editing ? (
                  <Input
                    id={key}
                    type="url"
                    inputMode="url"
                    placeholder={placeholder}
                    value={value ?? ''}
                    disabled={disabled || saving}
                    className="mt-2"
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                ) : connected && value ? (
                  <a
                    className="group/link mt-1 inline-flex max-w-full items-center gap-1 truncate text-[13px] text-fg-muted no-underline transition-colors hover:text-accent"
                    href={value.trim()}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="truncate">{host}</span>
                    <span className="transition-transform duration-200 motion-safe:group-hover/link:translate-x-0.5">
                      Abrir →
                    </span>
                  </a>
                ) : (
                  <p className="mt-1 text-[13px] text-fg-faint">Sin link</p>
                )}
              </div>
            </div>
          </div>
        )
      })}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {editing ? (
          <>
            <Button
              variant="primary"
              disabled={!dirty || saving || disabled}
              onClick={() => void handleSave()}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setDraft(links)
                setEditing(false)
                setMessage(null)
              }}
            >
              Cancelar
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            disabled={disabled}
            onClick={() => setEditing(true)}
          >
            Editar links
          </Button>
        )}
        {message ? (
          <span className="text-xs font-medium text-ok" aria-live="polite" role="status">
            {message === 'Guardado' ? '✓ Guardado' : message}
          </span>
        ) : null}
      </div>
    </div>
  )
}
