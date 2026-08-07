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
        'w-full min-w-0 rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[13px] text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        className,
      )}
      {...props}
    />
  )
}
