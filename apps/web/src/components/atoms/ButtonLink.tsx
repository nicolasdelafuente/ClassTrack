import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../lib/cn'

type ButtonLinkVariant = 'primary' | 'ghost' | 'text'

type SharedProps = {
  variant?: ButtonLinkVariant
  className?: string
  children: ReactNode
}

type InternalProps = SharedProps &
  Omit<LinkProps, 'className' | 'children'> & {
    external?: false
  }

type ExternalProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
    href: string
    external: true
  }

type ButtonLinkProps = InternalProps | ExternalProps

const variants: Record<ButtonLinkVariant, string> = {
  primary:
    'inline-flex touch-manipulation items-center justify-center rounded-md border border-transparent bg-accent px-3 py-2 text-[13px] font-medium text-white no-underline shadow-panel transition-[filter,transform,box-shadow] duration-200 ease-out hover:brightness-105 hover:shadow-lift motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.97]',
  ghost:
    'inline-flex touch-manipulation items-center justify-center rounded-md border border-border bg-surface-1 px-3 py-2 text-[13px] font-medium text-fg-muted no-underline shadow-panel transition-[background-color,color,transform,box-shadow] duration-200 ease-out hover:bg-surface-hover hover:text-fg hover:shadow-lift motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.97]',
  text: 'font-semibold text-accent no-underline transition-colors duration-200 hover:underline',
}

function isExternal(props: ButtonLinkProps): props is ExternalProps {
  return 'external' in props && props.external === true
}

export function ButtonLink(props: ButtonLinkProps) {
  const { variant = 'primary', className, children } = props
  const classes = cn(variants[variant], className)

  if (isExternal(props)) {
    const { external: _e, variant: _v, className: _c, children: _ch, ...anchorProps } =
      props
    return (
      <a className={classes} {...anchorProps}>
        {children}
      </a>
    )
  }

  const { external: _e, variant: _v, className: _c, children: _ch, ...linkProps } =
    props
  return (
    <Link className={classes} {...linkProps}>
      {children}
    </Link>
  )
}
