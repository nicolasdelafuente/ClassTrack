import { useEffect, useState } from 'react'
import { Button } from '../atoms/Button'
import { InlineStatus } from '../atoms/InlineStatus'
import { Input } from '../atoms/Input'
import { Label } from '../atoms/Label'

type SavePhase = 'idle' | 'saving' | 'saved' | 'error'

type StudentEmailEditorProps = {
  /** Current login / notification email. */
  email: string
  /** Optional legajo shown in the compact header line. */
  legajo?: string | null
  disabled?: boolean
  onSave: (email: string) => Promise<void>
  /**
   * `meta` — one quiet line in the hero: Legajo · email · Editar
   * `panel` — standalone block (legacy; prefer meta on home)
   */
  variant?: 'meta' | 'panel'
}

/**
 * Inline editor for the student’s contact + login email (no modal).
 */
export function StudentEmailEditor({
  email,
  legajo = null,
  disabled = false,
  onSave,
  variant = 'meta',
}: StudentEmailEditorProps) {
  const [draft, setDraft] = useState(email)
  const [editing, setEditing] = useState(false)
  const [phase, setPhase] = useState<SavePhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setDraft(email)
  }, [email])

  const dirty = draft.trim().toLowerCase() !== email.trim().toLowerCase()
  const legajoLabel = legajo?.trim() ? `Legajo ${legajo.trim()}` : null
  const emailLabel = email.trim() || 'Sin email'

  async function handleSave() {
    const next = draft.trim()
    if (!next) {
      setPhase('error')
      setErrorMessage('Ingresá un email válido')
      return
    }

    setPhase('saving')
    setErrorMessage(null)
    try {
      await onSave(next)
      setPhase('saved')
      setEditing(false)
    } catch (err) {
      setPhase('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudo guardar el email',
      )
    }
  }

  function startEdit() {
    setEditing(true)
    setPhase('idle')
    setErrorMessage(null)
  }

  function cancelEdit() {
    setDraft(email)
    setEditing(false)
    setPhase('idle')
    setErrorMessage(null)
  }

  const editForm = (
    <>
      <div>
        {variant === 'panel' ? <Label htmlFor="student-email">Email</Label> : null}
        <Input
          id="student-email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="tu@email.com"
          value={draft}
          disabled={disabled || phase === 'saving'}
          aria-label="Email"
          className={variant === 'meta' ? 'mt-0' : undefined}
          onChange={(e) => setDraft(e.target.value)}
        />
        <p className="mt-1.5 m-0 text-[12px] text-pretty text-fg-faint">
          Lo usás para iniciar sesión y para recibir notificaciones. Si lo
          cambiás, la próxima vez entrá con el email nuevo (misma contraseña).
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          disabled={!dirty || disabled || phase === 'saving'}
          onClick={() => void handleSave()}
        >
          {phase === 'saving' ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button
          variant="ghost"
          disabled={phase === 'saving'}
          onClick={cancelEdit}
        >
          Cancelar
        </Button>
        <InlineStatus
          phase={phase === 'idle' ? 'idle' : phase}
          errorMessage={errorMessage}
        />
      </div>
    </>
  )

  if (variant === 'meta') {
    return (
      <div className="min-w-0">
        {!editing ? (
          <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 text-[12px] font-medium text-fg-faint sm:text-[13px]">
            {legajoLabel ? <span>{legajoLabel}</span> : null}
            {legajoLabel ? <span aria-hidden>·</span> : null}
            <span className="min-w-0 break-all text-fg-muted">{emailLabel}</span>
            <span aria-hidden>·</span>
            <button
              type="button"
              disabled={disabled}
              onClick={startEdit}
              className="inline font-semibold text-accent underline-offset-2 transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Editar
            </button>
            <InlineStatus
              phase={phase === 'idle' || phase === 'saving' ? 'idle' : phase}
              errorMessage={errorMessage}
            />
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {legajoLabel ? (
              <p className="m-0 text-[12px] font-medium text-fg-faint sm:text-[13px]">
                {legajoLabel}
              </p>
            ) : null}
            {editForm}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {editing ? (
        editForm
      ) : (
        <>
          <p className="m-0 min-w-0 truncate text-[14px] font-medium text-fg">
            {email.trim() || (
              <span className="font-normal text-fg-faint">Sin email</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              disabled={disabled}
              onClick={startEdit}
            >
              Editar email
            </Button>
            <InlineStatus
              phase={phase === 'idle' ? 'idle' : phase}
              errorMessage={errorMessage}
            />
          </div>
        </>
      )}
    </div>
  )
}
