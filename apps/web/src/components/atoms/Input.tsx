import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({
  className,
  autoComplete = 'off',
  spellCheck = false,
  ...props
}: InputProps) {
  return (
    <input
      autoComplete={autoComplete}
      spellCheck={spellCheck}
      className={cn(
        'w-full min-w-0 rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[13px] text-fg shadow-panel transition-[border-color,box-shadow,background-color] duration-200 ease-out placeholder:text-fg-faint hover:border-border-strong focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_3px_var(--color-accent-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        className,
      )}
      {...props}
    />
  )
}
