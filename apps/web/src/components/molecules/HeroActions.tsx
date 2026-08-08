import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../atoms/Button'
import { ButtonLink } from '../atoms/ButtonLink'
import { cn } from '../../lib/cn'

/**
 * One hero action: internal link, external link, or button callback.
 * Keep 1–2 in `primary`; put the rest in `more` (CT-052).
 */
export type HeroActionItem = {
  label: string
  to?: string
  href?: string
  onClick?: () => void
  /** Visual weight when rendered in the primary row. Default: first = primary, rest = ghost. */
  variant?: 'primary' | 'ghost'
}

type HeroActionsProps = {
  /** Optional free-form control(s) before the primary links (e.g. toggle). */
  leading?: ReactNode
  primary?: HeroActionItem[]
  more?: HeroActionItem[]
  /** Accessible name for the overflow control. */
  moreLabel?: string
  className?: string
}

function PrimaryControl({
  item,
  index,
}: {
  item: HeroActionItem
  index: number
}) {
  const variant = item.variant ?? (index === 0 ? 'primary' : 'ghost')
  const className = 'min-h-11 px-4 text-[14px]'

  if (item.href) {
    return (
      <ButtonLink
        external
        variant={variant}
        className={className}
        href={item.href}
        target="_blank"
        rel="noreferrer"
      >
        {item.label}
      </ButtonLink>
    )
  }
  if (item.to) {
    return (
      <ButtonLink variant={variant} className={className} to={item.to}>
        {item.label}
      </ButtonLink>
    )
  }
  return (
    <Button
      type="button"
      variant={variant === 'primary' ? 'primary' : 'ghost'}
      className={className}
      onClick={item.onClick}
    >
      {item.label}
    </Button>
  )
}

function MoreMenuItem({
  item,
  onNavigate,
}: {
  item: HeroActionItem
  onNavigate: () => void
}) {
  const itemClass =
    'block w-full cursor-pointer rounded-md px-3 py-2.5 text-left text-[13px] font-medium text-fg no-underline transition-colors hover:bg-surface-2'

  if (item.href) {
    return (
      <a
        className={itemClass}
        href={item.href}
        target="_blank"
        rel="noreferrer"
        onClick={onNavigate}
      >
        {item.label}
      </a>
    )
  }
  if (item.to) {
    return (
      <Link className={itemClass} to={item.to} onClick={onNavigate}>
        {item.label}
      </Link>
    )
  }
  return (
    <button
      type="button"
      className={cn(itemClass, 'border-0 bg-transparent')}
      onClick={() => {
        item.onClick?.()
        onNavigate()
      }}
    >
      {item.label}
    </button>
  )
}

/**
 * Hero action row: 1–2 primary controls + optional “Más acciones” menu.
 * Use this instead of dumping many ButtonLinks into PageHero.
 */
export function HeroActions({
  leading,
  primary = [],
  more = [],
  moreLabel = 'Más acciones',
  className,
}: HeroActionsProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!leading && primary.length === 0 && more.length === 0) return null

  return (
    <div
      ref={rootRef}
      className={cn('relative flex flex-wrap items-center gap-2', className)}
    >
      {leading}
      {primary.map((item, index) => (
        <PrimaryControl key={`${item.label}-${index}`} item={item} index={index} />
      ))}

      {more.length > 0 ? (
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 gap-1.5"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            {moreLabel}
            <span className="text-[10px] text-fg-faint" aria-hidden>
              {open ? '▴' : '▾'}
            </span>
          </Button>

          {open ? (
            <div
              id={menuId}
              role="menu"
              className="absolute right-0 z-20 mt-1.5 min-w-[12.5rem] rounded-lg border border-border bg-surface-1 p-1 shadow-lift motion-safe:animate-fade-up"
            >
              {more.map((item, index) => (
                <div key={`${item.label}-${index}`} role="none">
                  <MoreMenuItem item={item} onNavigate={() => setOpen(false)} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
