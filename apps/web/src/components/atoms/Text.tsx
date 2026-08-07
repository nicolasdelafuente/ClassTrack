import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: 'h1' | 'h2' | 'h3'
  children: ReactNode
}

const sizes = {
  h1: 'text-[22px] font-semibold tracking-tight text-fg text-balance',
  h2: 'text-[13px] font-semibold text-fg',
  h3: 'text-sm font-semibold text-fg',
}

export function Heading({
  as = 'h1',
  className,
  children,
  ...props
}: HeadingProps) {
  const Tag = as
  return (
    <Tag className={cn('m-0', sizes[as], className)} {...props}>
      {children}
    </Tag>
  )
}

type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  muted?: boolean
  faint?: boolean
  children: ReactNode
}

export function Text({
  muted = true,
  faint = false,
  className,
  children,
  ...props
}: TextProps) {
  return (
    <p
      className={cn(
        'm-0 text-[13px] text-pretty',
        faint ? 'text-fg-faint' : muted ? 'text-fg-muted' : 'text-fg',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  )
}
