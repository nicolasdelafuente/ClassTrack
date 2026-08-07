import { cn } from '../../lib/cn'
import type { SprintStatus } from '../../types'

type StatusDotProps = {
  status: SprintStatus
  className?: string
  title?: string
  'aria-label'?: string
}

const statusClass: Record<SprintStatus, string> = {
  ok: 'border-transparent bg-ok',
  attention: 'border-transparent bg-attention',
  critical: 'border-transparent bg-critical',
  unknown: 'border-unknown bg-transparent',
}

export function StatusDot({ status, className, ...props }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block size-2 rounded-full border-[1.5px]',
        statusClass[status],
        className,
      )}
      {...props}
    />
  )
}
