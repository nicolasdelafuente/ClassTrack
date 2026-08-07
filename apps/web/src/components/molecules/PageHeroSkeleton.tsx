import { Panel } from '../atoms/Panel'
import { Skeleton, SkeletonText } from '../atoms/Skeleton'
import { cn } from '../../lib/cn'

type PageHeroSkeletonProps = {
  compact?: boolean
  /** How many meta/stat placeholders under the title. */
  stats?: number
  /** Show action button bones. */
  showActions?: boolean
  className?: string
}

/** Mirrors PageHero layout so the first paint keeps the same footprint. */
export function PageHeroSkeleton({
  compact = false,
  stats = 2,
  showActions = true,
  className,
}: PageHeroSkeletonProps) {
  return (
    <Panel
      as="header"
      tone="elevated"
      className={cn(compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5', className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton
            className={cn(compact ? 'h-7 w-48 sm:h-8' : 'h-8 w-56 sm:h-9')}
          />
          <SkeletonText lines={2} className="max-w-xl pt-1" />
        </div>
        <Skeleton className="h-7 w-24 shrink-0" rounded="full" />
      </div>

      {stats > 0 ? (
        <div
          className={cn(
            'flex flex-wrap gap-x-4 gap-y-2',
            compact ? 'mt-2.5' : 'mt-3',
          )}
        >
          {Array.from({ length: stats }, (_, i) => (
            <Skeleton key={i} className="h-4 w-28" />
          ))}
        </div>
      ) : null}

      {showActions ? (
        <div
          className={cn(
            'flex flex-wrap gap-2',
            compact ? 'mt-2.5' : 'mt-4',
          )}
        >
          <Skeleton className="h-11 w-40" rounded="md" />
          <Skeleton className="h-11 w-28" rounded="md" />
        </div>
      ) : null}
    </Panel>
  )
}
