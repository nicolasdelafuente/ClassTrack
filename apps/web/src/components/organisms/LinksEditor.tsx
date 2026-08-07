import { useEffect, useState, type ReactNode } from 'react'
import type { GroupLinks } from '../../types'
import { Button } from '../atoms/Button'
import { IconDrive, IconGithub, IconTrello } from '../atoms/icons'
import { InlineStatus } from '../atoms/InlineStatus'
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

type SavePhase = 'idle' | 'saving' | 'saved' | 'error'

export function LinksEditor({ links, disabled = false, onSave }: LinksEditorProps) {
  const [draft, setDraft] = useState<GroupLinks>(links)
  const [editing, setEditing] = useState(false)
  const [phase, setPhase] = useState<SavePhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setDraft(links)
  }, [links])

  const dirty =
    draft.githubUrl !== links.githubUrl ||
    draft.trelloUrl !== links.trelloUrl ||
    draft.driveUrl !== links.driveUrl

  async function handleSave() {
    setPhase('saving')
    setErrorMessage(null)
    try {
      await onSave(draft)
      setPhase('saved')
      setEditing(false)
    } catch (err) {
      setPhase('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudo guardar',
      )
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {FIELDS.map(({ key, label, icon, placeholder }, index) => {
        const value = draft[key]
        const connected = Boolean(value?.trim())

        return (
          <div
            key={key}
            style={{ animationDelay: `${index * 40}ms` }}
            className={cn(
              'group rounded-xl border border-border bg-surface-1 px-3 py-3 shadow-panel transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-safe:animate-fade-up',
              !editing &&
                'hover:border-border-strong hover:bg-surface-hover hover:shadow-lift motion-safe:hover:-translate-y-0.5',
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg transition-transform duration-200 motion-safe:group-hover:rotate-3"
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
                    disabled={disabled || phase === 'saving'}
                    className="mt-2"
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                ) : null}
              </div>

              {!editing && connected && value ? (
                <a
                  className="group/open shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-accent no-underline transition-colors hover:bg-accent-soft"
                  href={value.trim()}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir
                  <span className="transition-transform duration-200 motion-safe:group-hover/open:translate-x-1">
                    →
                  </span>
                </a>
              ) : null}
            </div>
          </div>
        )
      })}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {editing ? (
          <>
            <Button
              variant="primary"
              disabled={!dirty || phase === 'saving' || disabled}
              onClick={() => void handleSave()}
            >
              {phase === 'saving' ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button
              variant="ghost"
              disabled={phase === 'saving'}
              onClick={() => {
                setDraft(links)
                setEditing(false)
                setPhase('idle')
                setErrorMessage(null)
              }}
            >
              Cancelar
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            disabled={disabled}
            onClick={() => {
              setEditing(true)
              setPhase('idle')
            }}
          >
            Editar links
          </Button>
        )}
        <InlineStatus
          phase={phase === 'idle' ? 'idle' : phase}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  )
}
