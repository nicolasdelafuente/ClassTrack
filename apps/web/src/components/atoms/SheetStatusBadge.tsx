import type { SheetStatus } from '../../types'
import { SHEET_STATUS_LABELS } from '../../types'
import { cn } from '../../lib/cn'

type SheetStatusBadgeProps = {
  status: SheetStatus
  className?: string
}

const tones: Record<SheetStatus, string> = {
  draft: 'bg-surface-2 text-fg-muted',
  in_review: 'bg-attention-soft text-attention',
  needs_changes: 'bg-critical-soft text-critical',
  approved: 'bg-ok-soft text-ok',
}

/** Shared chip for sprint-sheet workflow status (CT-063). */
export function SheetStatusBadge({ status, className }: SheetStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold',
        tones[status],
        status === 'needs_changes' &&
          'motion-safe:animate-[pulse-soft_2.4s_ease-in-out_infinite]',
        className,
      )}
    >
      {SHEET_STATUS_LABELS[status]}
    </span>
  )
}
