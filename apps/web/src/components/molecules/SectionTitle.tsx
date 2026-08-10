import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type SectionTitleProps = {
  icon?: ReactNode
  children: ReactNode
  hint?: string
  className?: string
}

export function SectionTitle({
  icon,
  children,
  hint,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn('mb-3', className)}>
      <h2 className="m-0 flex min-w-0 items-center gap-2 text-[17px] font-semibold tracking-tight text-fg">
        {icon ? (
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-sm" aria-hidden>
            {icon}
          </span>
        ) : null}
        <span className="min-w-0 break-words">{children}</span>
      </h2>
      {hint ? (
        <p className="mt-1 text-[13px] text-pretty text-fg-faint">{hint}</p>
      ) : null}
    </div>
  )
}
