import { Button } from '../atoms/Button'

type AttendanceTogglesProps = {
  present: boolean
  participated: boolean
  disabled?: boolean
  onTogglePresent: () => void
  onToggleParticipated: () => void
}

export function AttendanceToggles({
  present,
  participated,
  disabled,
  onTogglePresent,
  onToggleParticipated,
}: AttendanceTogglesProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-1.5 sm:w-auto sm:min-w-[220px]">
      <Button
        variant={present ? 'toggleOn' : 'toggle'}
        disabled={disabled}
        aria-pressed={present}
        onClick={onTogglePresent}
      >
        Presente
      </Button>
      <Button
        variant={participated ? 'toggleOn' : 'toggle'}
        disabled={disabled}
        aria-pressed={participated}
        onClick={onToggleParticipated}
      >
        Participó
      </Button>
    </div>
  )
}
