import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../lib/cn'

type ButtonLinkVariant = 'primary' | 'ghost' | 'text'

type ButtonLinkProps = LinkProps & {
  variant?: ButtonLinkVariant
}

const variants: Record<ButtonLinkVariant, string> = {
  primary:
    'inline-flex touch-manipulation items-center justify-center rounded-md border border-transparent bg-accent px-3 py-2 text-[13px] font-medium text-white transition-[filter,transform] duration-150 hover:brightness-110 motion-safe:active:scale-[0.97]',
  ghost:
    'inline-flex touch-manipulation items-center justify-center rounded-md border border-border bg-transparent px-3 py-2 text-[13px] font-medium text-fg-muted transition-[background-color,color,transform] duration-150 hover:bg-surface-2 hover:text-fg motion-safe:active:scale-[0.97]',
  text: 'font-semibold text-accent no-underline hover:underline',
}

export function ButtonLink({
  variant = 'primary',
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={cn(variants[variant], className)} {...props} />
}
