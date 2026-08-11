import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type TeamResourceCardProps = {
  icon: ReactNode
  name: string
  connected: boolean
  /** Short line under the title (what this resource is for). */
  secondary?: ReactNode
  /** Configured URL / repo summary in view mode (links are the open action). */
  detail?: ReactNode
  editing?: boolean
  /** Hover lift when not editing. Default: !editing */
  interactive?: boolean
  staggerIndex?: number
  /** Edit-mode fields and actions. */
  children?: ReactNode
  className?: string
}

/**
 * Homogeneous shell for team external resources (GitHub / Trello / Drive).
 *
 * View:
 *   [icon] Name                         [status]
 *          Secondary meta
 *          Detail (clickable links — no separate “Abrir”)
 */
export function TeamResourceCard({
  icon,
  name,
  connected,
  secondary,
  detail,
  editing = false,
  interactive,
  staggerIndex = 0,
  children,
  className,
}: TeamResourceCardProps) {
  const canHover = interactive ?? !editing

  return (
    <div
      style={
        staggerIndex > 0 ? { animationDelay: `${staggerIndex * 40}ms` } : undefined
      }
      className={cn(
        'rounded-xl border border-border bg-surface-1 px-3 py-3 shadow-panel transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-safe:animate-fade-up',
        canHover &&
          'hover:border-border-strong hover:bg-surface-hover hover:shadow-lift motion-safe:hover:-translate-y-0.5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg"
          aria-hidden
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <span className="text-[14px] font-semibold text-fg">{name}</span>
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
            <div className="mt-2">{children}</div>
          ) : (
            <div className="mt-1.5 space-y-1">
              {secondary ? (
                <p className="m-0 text-[12px] text-pretty text-fg-faint">
                  {secondary}
                </p>
              ) : null}
              {detail ? (
                <div className="min-w-0 text-[13px] text-fg-muted">{detail}</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Short label from a GitHub (or similar) URL: last path segment(s). */
export function shortResourceLabel(href: string): string {
  const trimmed = href.trim()
  try {
    const u = new URL(trimmed)
    const parts = u.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`
    if (parts.length === 1) return parts[0]
    return u.host
  } catch {
    return trimmed
  }
}

/** Truncated external URL — the link itself is the open action. */
export function TeamResourceUrl({
  href,
  label,
}: {
  href: string
  /** Optional display text (defaults to a short path label). */
  label?: string
}) {
  const trimmed = href.trim()
  const text = label?.trim() || shortResourceLabel(trimmed)
  return (
    <a
      className="block truncate font-medium text-accent no-underline hover:underline"
      href={trimmed}
      target="_blank"
      rel="noreferrer"
      title={trimmed}
    >
      {text}
    </a>
  )
}
