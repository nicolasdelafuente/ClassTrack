import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../lib/cn'

type ButtonLinkVariant = 'primary' | 'ghost' | 'text'

type ButtonLinkProps = LinkProps & {
  variant?: ButtonLinkVariant
}

const variants: Record<ButtonLinkVariant, string> = {
  primary:
    'inline-flex items-center justify-center rounded-md border border-transparent bg-accent px-3 py-2 text-[13px] font-medium text-white transition hover:brightness-110 active:scale-[0.97]',
  ghost:
    'inline-flex items-center justify-center rounded-md border border-border bg-transparent px-3 py-2 text-[13px] font-medium text-fg-muted transition hover:bg-surface-2 hover:text-fg active:scale-[0.97]',
  text: 'font-semibold text-accent no-underline hover:underline',
}

export function ButtonLink({
  variant = 'primary',
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={cn(variants[variant], className)} {...props} />
}
