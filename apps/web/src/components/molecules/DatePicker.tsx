import { useEffect, useId, useMemo, useState } from 'react'
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
} from '../atoms/icons'
import { cn } from '../../lib/cn'

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'] as const

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

type DatePickerProps = {
  id?: string
  value: string
  onChange: (isoDate: string) => void
  disabled?: boolean
  /** Keep the month grid always open (good for form pages). Default true. */
  alwaysOpen?: boolean
  className?: string
}

function parseIso(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null
  }
  return date
}

function toIso(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplay(iso: string): string {
  const date = parseIso(iso)
  if (!date) return 'Elegí una fecha'
  const d = String(date.getUTCDate()).padStart(2, '0')
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${d}/${m}/${date.getUTCFullYear()}`
}

function startOfMonthUtc(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0))
}

/** Monday-first index: Mon=0 … Sun=6 */
function mondayFirstDow(date: Date): number {
  return (date.getUTCDay() + 6) % 7
}

function buildMonthCells(year: number, monthIndex: number) {
  const first = startOfMonthUtc(year, monthIndex)
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const lead = mondayFirstDow(first)
  const cells: Array<{ iso: string; inMonth: boolean; day: number }> = []

  const prevMonthLast = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate()
  for (let i = lead - 1; i >= 0; i -= 1) {
    const day = prevMonthLast - i
    const date = new Date(Date.UTC(year, monthIndex - 1, day, 12, 0, 0))
    cells.push({ iso: toIso(date), inMonth: false, day })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0))
    cells.push({ iso: toIso(date), inMonth: true, day })
  }

  while (cells.length % 7 !== 0) {
    const day = cells.length - (lead + daysInMonth) + 1
    const date = new Date(Date.UTC(year, monthIndex + 1, day, 12, 0, 0))
    cells.push({ iso: toIso(date), inMonth: false, day })
  }

  return cells
}

/**
 * ClassTrack date picker — inline month grid (no modal overlay).
 * Value is always YYYY-MM-DD (UTC calendar day).
 */
export function DatePicker({
  id,
  value,
  onChange,
  disabled = false,
  alwaysOpen = true,
  className,
}: DatePickerProps) {
  const labelId = useId()
  const selected = parseIso(value)
  const todayIso = toIso(new Date())

  const initialCursor = selected ?? new Date()
  const [cursorYear, setCursorYear] = useState(initialCursor.getUTCFullYear())
  const [cursorMonth, setCursorMonth] = useState(initialCursor.getUTCMonth())
  const [open, setOpen] = useState(alwaysOpen)

  useEffect(() => {
    if (!selected) return
    setCursorYear(selected.getUTCFullYear())
    setCursorMonth(selected.getUTCMonth())
  }, [value])

  const cells = useMemo(
    () => buildMonthCells(cursorYear, cursorMonth),
    [cursorYear, cursorMonth],
  )

  function shiftMonth(delta: number) {
    const next = new Date(Date.UTC(cursorYear, cursorMonth + delta, 1, 12, 0, 0))
    setCursorYear(next.getUTCFullYear())
    setCursorMonth(next.getUTCMonth())
  }

  function pick(iso: string) {
    onChange(iso)
    if (!alwaysOpen) setOpen(false)
  }

  return (
    <div className={cn('w-full max-w-sm', className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-labelledby={labelId}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'flex w-full min-h-10 cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-2.5 py-2 text-left text-[13px] text-fg shadow-panel transition-[border-color,background-color,box-shadow] duration-200',
          'hover:border-border-strong hover:bg-surface-1',
          'focus:border-accent focus:bg-surface-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          disabled && 'cursor-not-allowed opacity-50',
        )}
        onClick={() => {
          if (!alwaysOpen) setOpen((v) => !v)
        }}
      >
        <span id={labelId} className="font-medium tabular-nums">
          {formatDisplay(value)}
        </span>
        <IconCalendar className="shrink-0 text-fg-faint" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Calendario"
          className="mt-2 rounded-xl border border-border bg-surface-1 p-3 shadow-panel motion-safe:animate-fade-up"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={disabled}
              aria-label="Mes anterior"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-50"
              onClick={() => shiftMonth(-1)}
            >
              <IconChevronLeft />
            </button>
            <p className="m-0 text-[14px] font-semibold text-fg">
              {MONTHS[cursorMonth]} {cursorYear}
            </p>
            <button
              type="button"
              disabled={disabled}
              aria-label="Mes siguiente"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-50"
              onClick={() => shiftMonth(1)}
            >
              <IconChevronRight />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-fg-faint"
              >
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell) => {
              const isSelected = cell.iso === value
              const isToday = cell.iso === todayIso
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={disabled}
                  aria-label={formatDisplay(cell.iso)}
                  aria-current={isSelected ? 'date' : undefined}
                  className={cn(
                    'inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-md text-[13px] font-medium tabular-nums transition-[background-color,color,transform] duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
                    cell.inMonth ? 'text-fg' : 'text-fg-faint/70',
                    !isSelected &&
                      cell.inMonth &&
                      'hover:bg-surface-interactive motion-safe:active:scale-[0.96]',
                    isSelected && 'bg-accent text-white hover:bg-accent',
                    !isSelected &&
                      isToday &&
                      'ring-1 ring-accent/40 ring-inset',
                    disabled && 'cursor-not-allowed opacity-50',
                  )}
                  onClick={() => pick(cell.iso)}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
