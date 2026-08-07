import type { SprintStatus } from '../../types'
import { cn } from '../../lib/cn'
import { SPRINT_STATUS_LABELS } from '../../types'

type StatusBadgeProps = {
  status: SprintStatus
  label?: string
  pulseCritical?: boolean
  className?: string
}

const tones: Record<SprintStatus, string> = {
  ok: 'bg-ok-soft text-ok',
  attention: 'bg-attention-soft text-attention',
  critical: 'bg-critical-soft text-critical',
  unknown: 'bg-surface-2 text-fg-muted',
}

export function StatusBadge({
  status,
  label,
  pulseCritical = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold',
        tones[status],
        pulseCritical &&
          status === 'critical' &&
          'motion-safe:animate-[pulse-soft_2.4s_ease-in-out_infinite]',
        className,
      )}
    >
      {label ?? SPRINT_STATUS_LABELS[status]}
    </span>
  )
}
