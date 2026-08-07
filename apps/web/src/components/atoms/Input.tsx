import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement>

/** Shared look for editable fields — white surface, clear border (not “disabled grey”). */
export const fieldControlClassName =
  'w-full min-w-0 rounded-md border border-border-strong bg-surface-1 px-2.5 py-2 text-[13px] text-fg shadow-panel transition-[border-color,box-shadow,background-color] duration-200 ease-out placeholder:text-fg-faint hover:border-accent/40 focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-2 disabled:text-fg-faint disabled:shadow-none'

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
      className={cn(fieldControlClassName, 'min-h-10', className)}
      {...props}
    />
  )
}
