import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { fieldControlClassName } from './Input'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

/** Multiline field — same surface/border/focus as `Input` (CT-062). */
export function Textarea({
  className,
  autoComplete = 'off',
  spellCheck = true,
  rows = 3,
  ...props
}: TextareaProps) {
  return (
    <textarea
      autoComplete={autoComplete}
      spellCheck={spellCheck}
      rows={rows}
      className={cn(fieldControlClassName, 'min-h-[3rem] resize-y', className)}
      {...props}
    />
  )
}
