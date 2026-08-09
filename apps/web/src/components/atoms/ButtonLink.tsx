import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { buttonBaseClassName, buttonVariantClassName } from './buttonStyles'

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

const linkVariants: Record<ButtonLinkVariant, string> = {
  primary: cn(
    buttonBaseClassName,
    buttonVariantClassName.primary,
    'no-underline',
  ),
  ghost: cn(buttonBaseClassName, buttonVariantClassName.ghost, 'no-underline'),
  text: 'font-semibold text-accent no-underline transition-colors duration-200 hover:underline',
}

function isExternal(props: ButtonLinkProps): props is ExternalProps {
  return 'external' in props && props.external === true
}

export function ButtonLink(props: ButtonLinkProps) {
  const { variant = 'primary', className, children } = props
  const classes = cn(linkVariants[variant], className)

  if (isExternal(props)) {
    const {
      external: _e,
      variant: _v,
      className: _c,
      children: _ch,
      ...anchorProps
    } = props
    return (
      <a className={classes} {...anchorProps}>
        {children}
      </a>
    )
  }

  const {
    external: _e,
    variant: _v,
    className: _c,
    children: _ch,
    ...linkProps
  } = props
  return (
    <Link className={classes} {...linkProps}>
      {children}
    </Link>
  )
}
