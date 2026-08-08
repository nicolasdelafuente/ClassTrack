import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import {
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  type TaskCategory,
} from '../../types'
import { cn } from '../../lib/cn'

type TaskCategoryChipsProps = {
  value: TaskCategory[]
  editable?: boolean
  disabled?: boolean
  onChange?: (next: TaskCategory[]) => void
  className?: string
}

/**
 * Compact multi-select tags for sprint-sheet tasks (CT-070).
 * Read-only: Badge chips. Editable: toggle buttons (no modal).
 */
export function TaskCategoryChips({
  value,
  editable = false,
  disabled = false,
  onChange,
  className,
}: TaskCategoryChipsProps) {
  if (!editable) {
    if (value.length === 0) return null
    return (
      <div className={cn('flex flex-wrap gap-1.5', className)}>
        {value.map((cat) => (
          <Badge key={cat}>{TASK_CATEGORY_LABELS[cat]}</Badge>
        ))}
      </div>
    )
  }

  function toggle(cat: TaskCategory) {
    if (!onChange || disabled) return
    if (value.includes(cat)) {
      onChange(value.filter((c) => c !== cat))
    } else {
      onChange([...value, cat])
    }
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <p className="m-0 text-[12px] font-medium text-fg-muted">
        Tags (opcional)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {TASK_CATEGORIES.map((cat) => {
          const on = value.includes(cat)
          return (
            <Button
              key={cat}
              type="button"
              variant={on ? 'toggleOn' : 'toggle'}
              disabled={disabled}
              className="min-h-8 px-2.5 text-[12px]"
              aria-pressed={on}
              onClick={() => toggle(cat)}
            >
              {TASK_CATEGORY_LABELS[cat]}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
