import { Input } from '../atoms/Input'
import { Label } from '../atoms/Label'

type LinkFieldProps = {
  id: string
  label: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}

export function LinkField({
  id,
  label,
  value,
  disabled,
  onChange,
}: LinkFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <Input
          id={id}
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
        {value.trim() ? (
          <a
            className="px-2 text-xs font-semibold text-accent no-underline hover:underline"
            href={value.trim()}
            target="_blank"
            rel="noreferrer"
          >
            Abrir
          </a>
        ) : (
          <span className="px-2 text-xs font-medium text-fg-faint">Sin link</span>
        )}
      </div>
    </div>
  )
}
