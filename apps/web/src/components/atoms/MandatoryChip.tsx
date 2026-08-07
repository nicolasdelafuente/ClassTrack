import { cn } from '../../lib/cn'

type MandatoryChipProps = {
  mandatory: boolean
  className?: string
}

/**
 * Chip for activity/class mandatory vs optional.
 * Same height for both; width follows the label (natural).
 * Obligatoria = green, Optativa = gray.
 */
export function MandatoryChip({ mandatory, className }: MandatoryChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold leading-none',
        mandatory
          ? 'bg-ok-soft text-ok'
          : 'bg-surface-2 text-fg-muted',
        className,
      )}
    >
      {mandatory ? 'Obligatoria' : 'Optativa'}
    </span>
  )
}
