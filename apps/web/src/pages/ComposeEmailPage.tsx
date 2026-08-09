import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  fetchCourseGroups,
  fetchEmailRecipients,
  sendCourseEmail,
  type EmailAudience,
  type EmailRecipient,
} from '../api/client'
import { Button } from '../components/atoms/Button'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Textarea } from '../components/atoms/Textarea'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import { Panel } from '../components/atoms/Panel'
import { Select } from '../components/atoms/Select'
import { Text } from '../components/atoms/Text'
import { PageHeroSkeleton } from '../components/molecules/PageHeroSkeleton'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'
import type { GroupSummary } from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      groups: GroupSummary[]
      allRecipients: EmailRecipient[]
    }

const AUDIENCE_OPTIONS: { value: EmailAudience; label: string; blurb: string }[] =
  [
    {
      value: 'all',
      label: 'Toda la cursada',
      blurb: 'Todos los alumnos con email',
    },
    {
      value: 'group',
      label: 'Un grupo',
      blurb: 'Solo integrantes de un grupo',
    },
    {
      value: 'student',
      label: 'Un alumno',
      blurb: 'Un destinatario puntual',
    },
  ]

/**
 * Teacher composes a broadcast email (CT-043).
 * Uses shared ClassTrack HTML layout on the API.
 */
export function ComposeEmailPage() {
  const { courseId = '' } = useParams()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const [audience, setAudience] = useState<EmailAudience>('all')
  const [groupId, setGroupId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [previewTotal, setPreviewTotal] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) {
      setState({ status: 'error', message: 'Falta el id de la cursada' })
      return
    }
    let cancelled = false
    async function load() {
      try {
        const [groups, recipients] = await Promise.all([
          fetchCourseGroups(courseId),
          fetchEmailRecipients(courseId, { audience: 'all' }),
        ])
        if (cancelled) return
        setState({
          status: 'ready',
          groups,
          allRecipients: recipients.recipients,
        })
        setPreviewTotal(recipients.total)
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'No se pudo cargar la cursada',
          })
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseId])

  useEffect(() => {
    if (state.status !== 'ready' || !courseId) return
    let cancelled = false
    async function refreshCount() {
      try {
        if (audience === 'group' && !groupId) {
          setPreviewTotal(0)
          return
        }
        if (audience === 'student' && !studentId) {
          setPreviewTotal(0)
          return
        }
        const data = await fetchEmailRecipients(courseId, {
          audience,
          groupId: audience === 'group' ? groupId : undefined,
          studentId: audience === 'student' ? studentId : undefined,
        })
        if (!cancelled) setPreviewTotal(data.total)
      } catch {
        if (!cancelled) setPreviewTotal(null)
      }
    }
    void refreshCount()
    return () => {
      cancelled = true
    }
  }, [audience, groupId, studentId, courseId, state.status])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setResultMessage(null)
    setSubmitting(true)
    try {
      const result = await sendCourseEmail(courseId, {
        subject,
        body,
        audience,
        groupId: audience === 'group' ? groupId : undefined,
        studentId: audience === 'student' ? studentId : undefined,
      })
      if (result.emailed) {
        setResultMessage(
          `Enviado a ${result.sent} destinatario${result.sent === 1 ? '' : 's'}.`,
        )
      } else {
        setResultMessage(
          `Se armaron ${result.total} destinatarios, pero Mailjet no está configurado (o falló el envío). Revisá MAILJET_* en el .env de la API.`,
        )
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo enviar el mail',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (state.status === 'loading') {
    return (
      <AppShell showBack>
        <div className="flex flex-col gap-4" aria-busy aria-label="Cargando">
          <PageHeroSkeleton compact stats={0} showActions={false} />
          <Panel tone="default" className="p-4">
            <div className="h-40 rounded-md bg-surface-2 motion-safe:animate-skeleton" />
          </Panel>
        </div>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack>
        <StateBox title="No se puede escribir el mail" message={state.message} />
      </AppShell>
    )
  }

  const { groups, allRecipients } = state
  const canSubmit =
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    (audience === 'all' ||
      (audience === 'group' && Boolean(groupId)) ||
      (audience === 'student' && Boolean(studentId))) &&
    (previewTotal ?? 0) > 0

  return (
    <AppShell showBack>
      <section className="flex flex-col gap-4">
        <PageHero
          compact
          eyebrow="Comunicación"
          title="Escribir mail"
          description="Redactá un mensaje y mandalo a toda la cursada, un grupo o un alumno. Usa la plantilla HTML de ClassTrack."
        />

        <form
          onSubmit={onSubmit}
          className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <Panel tone="default" className="flex flex-col gap-4 p-4 sm:p-5">
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
                Destinatarios
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {AUDIENCE_OPTIONS.map((option) => {
                  const selected = audience === option.value
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={selected ? 'toggleOn' : 'toggle'}
                      onClick={() => setAudience(option.value)}
                      className="h-auto min-h-0 flex-col items-start gap-1 px-3 py-3 text-left shadow-none"
                    >
                      <span className="block text-[13px] font-semibold text-fg">
                        {option.label}
                      </span>
                      <span className="block text-[11px] font-normal text-fg-muted">
                        {option.blurb}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </fieldset>

            {audience === 'group' ? (
              <div>
                <Label htmlFor="mail-group">Grupo</Label>
                <Select
                  id="mail-group"
                  required
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  <option value="">Elegí un grupo</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      G{g.number}
                      {g.name ? ` · ${g.name}` : ''}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            {audience === 'student' ? (
              <div>
                <Label htmlFor="mail-student">Alumno</Label>
                <Select
                  id="mail-student"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                >
                  <option value="">Elegí un alumno</option>
                  {allRecipients
                    .filter((r) => r.studentId)
                    .map((r) => (
                      <option key={r.studentId!} value={r.studentId!}>
                        {r.fullName} · {r.email}
                        {r.groupNumber != null ? ` · G${r.groupNumber}` : ''}
                      </option>
                    ))}
                </Select>
              </div>
            ) : null}

            <div>
              <Label htmlFor="mail-subject">Asunto</Label>
              <Input
                id="mail-subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Aviso de la próxima clase"
              />
            </div>

            <div>
              <Label htmlFor="mail-body">Mensaje</Label>
              <Textarea
                id="mail-body"
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Escribí el mensaje. Los saltos de línea se respetan en el mail."
              />
            </div>

            {error ? (
              <p className="m-0 text-[13px] text-critical" role="alert">
                {error}
              </p>
            ) : null}
            {resultMessage ? (
              <p className="m-0 text-[13px] font-medium text-ok" role="status">
                {resultMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" disabled={submitting || !canSubmit}>
                {submitting
                  ? 'Enviando…'
                  : previewTotal != null
                    ? `Enviar a ${previewTotal}`
                    : 'Enviar'}
              </Button>
              <ButtonLink variant="ghost" to="/">
                Cancelar
              </ButtonLink>
            </div>
          </Panel>

          <Panel tone="soft" className="p-4 sm:p-5">
            <p className="m-0 text-[13px] font-semibold text-fg">
              Vista previa del layout
            </p>
            <Text faint className="mt-1">
              Así se ve el encabezado y el pie en el mail (misma plantilla que
              las invitaciones).
            </Text>
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface-1 shadow-panel">
              <div className="border-b border-border bg-surface px-4 py-3">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-accent">
                  ClassTrack
                </p>
              </div>
              <div className="px-4 py-4">
                <p className="m-0 text-[18px] font-bold text-fg">
                  {subject.trim() || 'Asunto del mensaje'}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-fg-muted">
                  {body.trim() ||
                    'Acá va el cuerpo del mail que escribas a la izquierda.'}
                </p>
              </div>
              <div className="border-t border-border bg-surface px-4 py-3">
                <p className="m-0 text-[11px] text-fg-faint">
                  Enviado desde ClassTrack
                </p>
              </div>
            </div>
            <p className="mt-4 text-[13px] text-fg-muted">
              Destinatarios con email:{' '}
              <strong className="font-semibold text-fg">
                {previewTotal ?? '…'}
              </strong>
            </p>
          </Panel>
        </form>
      </section>
    </AppShell>
  )
}
