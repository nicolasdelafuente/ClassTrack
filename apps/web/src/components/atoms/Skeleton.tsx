import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type SkeletonRounded = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /** Visual corner radius (matches product radii). */
  rounded?: SkeletonRounded
  /** CSS width — number = px. Prefer Tailwind via className when possible. */
  width?: number | string
  /** CSS height — number = px. */
  height?: number | string
}

const roundedClass: Record<SkeletonRounded, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
}

/**
 * Atomic placeholder bone.
 * Compose several to mirror real layout (cards, rows, heroes) and avoid CLS.
 */
export function Skeleton({
  className,
  rounded = 'md',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const sizeStyle: CSSProperties = { ...style }
  if (width !== undefined) {
    sizeStyle.width = typeof width === 'number' ? `${width}px` : width
  }
  if (height !== undefined) {
    sizeStyle.height = typeof height === 'number' ? `${height}px` : height
  }

  return (
    <div
      aria-hidden
      className={cn(
        'bg-surface-2 motion-safe:animate-skeleton',
        roundedClass[rounded],
        className,
      )}
      style={sizeStyle}
      {...props}
    />
  )
}

type SkeletonTextProps = {
  lines?: number
  className?: string
  /** Last line shorter for a more natural paragraph shape. */
  lastLineWidth?: string
}

/** Stack of text-line bones (default ~13–15px content height). */
export function SkeletonText({
  lines = 2,
  className,
  lastLineWidth = '66%',
}: SkeletonTextProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  )
}

type SkeletonCircleProps = {
  size?: number
  className?: string
}

export function SkeletonCircle({ size = 36, className }: SkeletonCircleProps) {
  return (
    <Skeleton
      rounded="full"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
    />
  )
}
