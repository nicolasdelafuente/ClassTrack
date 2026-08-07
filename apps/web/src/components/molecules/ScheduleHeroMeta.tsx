import { cn } from '../../lib/cn'

type ScheduleHeroMetaProps = {
  classes: number
  mandatory: number
  optional: number
  noAttendance: number
  maxAbsences: number
  className?: string
}

/** Grouped metrics for Cronograma — agenda feel, not flat admin strip. */
export function ScheduleHeroMeta({
  classes,
  mandatory,
  optional,
  noAttendance,
  maxAbsences,
  className,
}: ScheduleHeroMetaProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-2.5 border-t border-border pt-2.5 sm:grid-cols-2 sm:gap-6',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
          Cronograma
        </p>
        <p className="m-0 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-fg-muted">
          <span>
            <span className="font-semibold tabular-nums text-fg">{classes}</span>{' '}
            clases
          </span>
          <span>
            <span className="font-semibold tabular-nums text-fg">
              {mandatory}
            </span>{' '}
            obligatorias
          </span>
          <span>
            <span className="font-semibold tabular-nums text-fg">
              {optional}
            </span>{' '}
            optativas
          </span>
        </p>
      </div>

      <div className="min-w-0">
        <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
          Asistencia
        </p>
        <p className="m-0 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-fg-muted">
          <span>
            <span className="font-semibold tabular-nums text-fg">
              {noAttendance}
            </span>{' '}
            pendientes
          </span>
          <span>
            Máximo{' '}
            <span className="font-semibold tabular-nums text-fg">
              {maxAbsences}
            </span>{' '}
            faltas
          </span>
        </p>
      </div>
    </div>
  )
}
