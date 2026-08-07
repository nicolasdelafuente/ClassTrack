import { Skeleton, SkeletonText } from '../atoms/Skeleton'
import { cn } from '../../lib/cn'

type GroupCardSkeletonProps = {
  className?: string
}

/** Same footprint as GroupCard (header, topic, meta, sprint lights). */
export function GroupCardSkeleton({ className }: GroupCardSkeletonProps) {
  return (
    <div
      className={cn(
        'flex min-h-[160px] flex-col gap-2.5 rounded-xl border border-border bg-surface-1 px-3.5 py-3.5 shadow-panel',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="h-6 w-10" rounded="full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-6 w-16 shrink-0" rounded="full" />
      </div>

      <SkeletonText lines={2} className="min-h-[2.5em]" />

      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>

      <div className="mt-auto flex gap-1.5 pt-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-2.5 flex-1" rounded="full" />
        ))}
      </div>
    </div>
  )
}
