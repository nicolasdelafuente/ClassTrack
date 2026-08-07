import { Button } from '../atoms/Button'
import { InlineStatus } from '../atoms/InlineStatus'
import { cn } from '../../lib/cn'

type AttendanceTogglesProps = {
  present: boolean
  participated: boolean
  disabled?: boolean
  saving?: boolean
  justSaved?: boolean
  onTogglePresent: () => void
  onToggleParticipated: () => void
}

export function AttendanceToggles({
  present,
  participated,
  disabled,
  saving = false,
  justSaved = false,
  onTogglePresent,
  onToggleParticipated,
}: AttendanceTogglesProps) {
  const phase = saving ? 'saving' : justSaved ? 'saved' : 'idle'

  return (
    <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-end">
      <div className="grid w-full grid-cols-2 gap-1.5 sm:w-auto sm:min-w-[220px]">
        <Button
          variant={present ? 'toggleOn' : 'toggle'}
          disabled={disabled}
          aria-pressed={present}
          onClick={onTogglePresent}
          className={cn(
            'transition-[transform,background-color,border-color,box-shadow] duration-200',
            present && 'motion-safe:animate-fade-up',
          )}
        >
          Presente
        </Button>
        <Button
          variant={participated ? 'toggleOn' : 'toggle'}
          disabled={disabled}
          aria-pressed={participated}
          onClick={onToggleParticipated}
          className={cn(
            'transition-[transform,background-color,border-color,box-shadow] duration-200',
            participated && 'motion-safe:animate-fade-up',
          )}
        >
          Participó
        </Button>
      </div>
      <InlineStatus phase={phase} className="min-h-[1.1rem]" />
    </div>
  )
}
