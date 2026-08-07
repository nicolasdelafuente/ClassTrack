import { cn } from '../../lib/cn'

type AvatarProps = {
  name: string
  size?: 'sm' | 'md'
  className?: string
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent ring-1 ring-accent-border transition-transform duration-200',
        size === 'sm' ? 'size-8 text-[11px]' : 'size-10 text-[13px]',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
