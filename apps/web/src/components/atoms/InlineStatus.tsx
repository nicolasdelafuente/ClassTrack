import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'

type InlineStatusProps = {
  phase: 'idle' | 'saving' | 'saved' | 'error'
  savedLabel?: string
  errorMessage?: string | null
  className?: string
}

/** Quiet save feedback: spinner → check → fade (classtrack-ui motion). */
export function InlineStatus({
  phase,
  savedLabel = 'Guardado',
  errorMessage,
  className,
}: InlineStatusProps) {
  const [visibleSaved, setVisibleSaved] = useState(false)

  useEffect(() => {
    if (phase !== 'saved') {
      setVisibleSaved(false)
      return
    }
    setVisibleSaved(true)
    const t = window.setTimeout(() => setVisibleSaved(false), 1400)
    return () => window.clearTimeout(t)
  }, [phase])

  if (phase === 'saving') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-[12px] font-medium text-fg-faint',
          className,
        )}
        aria-live="polite"
        role="status"
      >
        <span
          className="size-3.5 animate-spin rounded-full border-2 border-border-strong border-t-accent"
          aria-hidden
        />
        Guardando…
      </span>
    )
  }

  if (phase === 'error' && errorMessage) {
    return (
      <span className={cn('text-[12px] font-medium text-critical', className)} role="alert">
        {errorMessage}
      </span>
    )
  }

  if (visibleSaved) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[12px] font-semibold text-ok motion-safe:animate-fade-up',
          className,
        )}
        aria-live="polite"
        role="status"
      >
        ✓ {savedLabel}
      </span>
    )
  }

  return null
}
