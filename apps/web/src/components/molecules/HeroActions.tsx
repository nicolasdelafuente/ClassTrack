import { useState, type ReactNode } from 'react'
import { Button } from '../atoms/Button'
import { cn } from '../../lib/cn'

type HeroActionsProps = {
  /** 1–2 primary actions always visible. */
  primary: ReactNode
  /** Extra actions under “Más acciones” (inline, no modal). */
  more?: ReactNode
  className?: string
}

/**
 * PageHero action hierarchy (CT-067 / CT-052): primaries + expandable more.
 */
export function HeroActions({ primary, more, className }: HeroActionsProps) {
  const [open, setOpen] = useState(false)

  if (!more) {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {primary}
      </div>
    )
  }

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {primary}
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Menos acciones' : 'Más acciones'}
        </Button>
      </div>
      {open ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
          {more}
        </div>
      ) : null}
    </div>
  )
}
