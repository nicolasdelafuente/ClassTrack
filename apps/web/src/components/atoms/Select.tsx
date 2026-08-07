import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { fieldControlClassName } from './Input'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

/** Native select styled like Input — editable white field, not grey. */
export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(fieldControlClassName, 'min-h-10 cursor-pointer', className)}
      {...props}
    >
      {children}
    </select>
  )
}
