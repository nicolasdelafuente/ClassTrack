import { useState } from 'react'
import { Button } from '../atoms/Button'
import { Input } from '../atoms/Input'
import { Label } from '../atoms/Label'
import { cn } from '../../lib/cn'

type TaskTrelloLinksProps = {
  links: string[]
  disabled?: boolean
  editable?: boolean
  className?: string
  onChange?: (links: string[]) => void
}

function shortLabel(url: string): string {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    // trello.com/c/SHORTID/optional-slug → show short id + slug
    if (parts[0] === 'c' && parts[1]) {
      return parts.slice(1, 3).join('/') || parts[1]
    }
    return u.host + u.pathname
  } catch {
    return url
  }
}

/**
 * Optional Trello card links per sprint-sheet task (CT-058).
 */
export function TaskTrelloLinks({
  links,
  disabled,
  editable,
  className,
  onChange,
}: TaskTrelloLinksProps) {
  const [draftUrl, setDraftUrl] = useState('')

  function addLink() {
    if (!onChange || disabled) return
    const url = draftUrl.trim()
    if (!url) return
    if (links.includes(url)) {
      setDraftUrl('')
      return
    }
    onChange([...links, url])
    setDraftUrl('')
  }

  if (!editable) {
    if (!links.length) return null
    return (
      <div className={cn('mt-2', className)}>
        <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
          Cards Trello
        </p>
        <ul className="mt-1 m-0 flex list-none flex-col gap-1 p-0">
          {links.map((url) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-[13px] text-accent no-underline hover:underline"
              >
                {shortLabel(url)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className={cn('mt-2', className)}>
      <Label>Cards de Trello (opcional)</Label>
      <p className="mt-0.5 m-0 text-[12px] text-fg-faint">
        Pegá el link de la card que trabajaron para esta tarea.
      </p>
      {links.length ? (
        <ul className="mt-2 m-0 flex list-none flex-col gap-1.5 p-0">
          {links.map((url) => (
            <li
              key={url}
              className="flex items-start gap-2 rounded-md border border-border bg-surface-1 px-2 py-1.5"
            >
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 break-all text-[12px] text-accent no-underline hover:underline"
              >
                {shortLabel(url)}
              </a>
              <Button
                type="button"
                variant="ghost"
                className="min-h-8 shrink-0 px-2 text-[12px] text-critical"
                disabled={disabled}
                onClick={() => onChange?.(links.filter((l) => l !== url))}
              >
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <Input
          type="url"
          placeholder="https://trello.com/c/…"
          value={draftUrl}
          disabled={disabled}
          className="min-w-[12rem] flex-1"
          onChange={(e) => setDraftUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addLink()
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          disabled={disabled || !draftUrl.trim()}
          onClick={addLink}
        >
          Agregar link
        </Button>
      </div>
    </div>
  )
}
