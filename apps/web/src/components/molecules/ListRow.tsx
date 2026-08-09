import type { HTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../lib/cn'

type ListRowTone = 'default' | 'soft'

type SharedProps = {
  tone?: ListRowTone
  /** Hover lift / border — default true when `to` is set. */
  interactive?: boolean
  className?: string
  children: ReactNode
}

type DivProps = SharedProps &
  Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> & {
    as?: 'div' | 'li' | 'article'
    to?: undefined
  }

type LinkRowProps = SharedProps &
  Omit<LinkProps, 'className' | 'children'> & {
    as?: never
    to: string
  }

type ListRowProps = DivProps | LinkRowProps

const tones: Record<ListRowTone, string> = {
  default: 'border-border bg-surface-1 shadow-panel',
  soft: 'border-border bg-surface-2 shadow-none',
}

/**
 * Shared list / card row — same radius and surfaces as `Panel` (CT-059).
 * Use for stacked items; use `Panel` for section containers.
 */
export function ListRow(props: ListRowProps) {
  const {
    tone = 'default',
    interactive: interactiveProp,
    className,
    children,
  } = props

  const isLink = 'to' in props && typeof props.to === 'string'
  const interactive = interactiveProp ?? isLink

  const classes = cn(
    'rounded-xl border',
    tones[tone],
    interactive &&
      'no-underline transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:border-border-strong hover:bg-surface-hover hover:shadow-lift motion-safe:hover:-translate-y-0.5',
    className,
  )

  if (isLink) {
    const {
      tone: _t,
      interactive: _i,
      className: _c,
      children: _ch,
      as: _a,
      ...linkProps
    } = props as LinkRowProps
    return (
      <Link className={classes} {...linkProps}>
        {children}
      </Link>
    )
  }

  const {
    tone: _t,
    interactive: _i,
    className: _c,
    children: _ch,
    as: Tag = 'div',
    to: _to,
    ...rest
  } = props as DivProps

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  )
}
