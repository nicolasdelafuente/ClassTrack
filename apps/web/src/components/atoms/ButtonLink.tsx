import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../lib/cn'

type ButtonLinkVariant = 'primary' | 'ghost' | 'text'

type ButtonLinkProps = LinkProps & {
  variant?: ButtonLinkVariant
}

const variants: Record<ButtonLinkVariant, string> = {
  primary:
    'inline-flex touch-manipulation items-center justify-center rounded-md border border-transparent bg-accent px-3 py-2 text-[13px] font-medium text-white shadow-panel transition-[filter,transform,box-shadow] duration-200 ease-out hover:brightness-105 hover:shadow-lift motion-safe:active:scale-[0.98]',
  ghost:
    'inline-flex touch-manipulation items-center justify-center rounded-md border border-border bg-surface-1 px-3 py-2 text-[13px] font-medium text-fg-muted shadow-panel transition-[background-color,color,transform,box-shadow] duration-200 ease-out hover:bg-surface-hover hover:text-fg hover:shadow-lift motion-safe:active:scale-[0.98]',
  text: 'font-semibold text-accent no-underline transition-colors duration-200 hover:underline',
}

export function ButtonLink({
  variant = 'primary',
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={cn(variants[variant], className)} {...props} />
}
