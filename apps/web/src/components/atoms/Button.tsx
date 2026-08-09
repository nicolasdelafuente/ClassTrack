import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { buttonBaseClassName, buttonVariantClassName } from './buttonStyles'

type ButtonVariant = keyof typeof buttonVariantClassName

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  children: ReactNode
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
        buttonBaseClassName,
        buttonVariantClassName[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
