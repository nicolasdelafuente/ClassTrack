import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'ghost' | 'toggle' | 'toggleOn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  children: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-accent text-white hover:brightness-110 disabled:opacity-50',
  ghost:
    'border-border bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg disabled:opacity-50',
  toggle:
    'min-h-10 border-border bg-surface-2 text-fg-muted hover:border-border-strong hover:text-fg disabled:opacity-50',
  toggleOn:
    'min-h-10 border-[color-mix(in_srgb,var(--color-ok)_45%,var(--color-border))] bg-ok-soft text-ok disabled:opacity-50',
}

export function Button({
  variant = 'primary',
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex touch-manipulation items-center justify-center rounded-md border px-3 py-2 text-[13px] font-medium transition-[background-color,border-color,color,transform,filter] duration-150 motion-safe:active:scale-[0.97] disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
