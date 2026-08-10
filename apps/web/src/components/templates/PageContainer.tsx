import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type PageContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  children: ReactNode
  /**
   * Extra vertical rhythm for page stacks (hero + panels).
   * Width always comes from `max-w-content` (1120px token).
   */
  stack?: boolean
}

/**
 * Global product content width — single source of truth for page layout.
 * Token: `--max-width-content` → utility `max-w-content` (see index.css).
 * Prefer this over page-level `max-w-lg` / `max-w-2xl` / `max-w-[…]`.
 */
export function PageContainer({
  as: Tag = 'div',
  className,
  children,
  stack = false,
  ...props
}: PageContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full max-w-content min-w-0',
        stack && 'flex flex-col gap-4',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

/** Horizontal gutters shared by AppShell (mobile + desktop). */
export const pageGutterClassName = 'px-4 md:px-6'
