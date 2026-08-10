import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type MetaStatItem = {
  label: string
  value: ReactNode
}

type MetaStatsProps = {
  items: MetaStatItem[]
  className?: string
}

export function MetaStats({ items, className }: MetaStatsProps) {
  if (items.length === 0) return null

  return (
    <dl
      className={cn(
        'm-0 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-fg-muted',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="sr-only">{item.label}</dt>
          <dd className="m-0">
            <span className="font-medium text-fg-faint">{item.label} · </span>
            <span className="font-semibold break-words text-fg">{item.value}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
