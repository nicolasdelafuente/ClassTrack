import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchSentEmail, type SentEmailDetail } from '../api/client'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Panel } from '../components/atoms/Panel'
import { Text } from '../components/atoms/Text'
import { PageHeroSkeleton } from '../components/molecules/PageHeroSkeleton'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; email: SentEmailDetail }

const CATEGORY_LABELS = {
  invite: 'Invitación',
  sprint: 'Sprint',
  other: 'Otro',
} as const

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

/**
 * Detail of one outbound email from the audit log (CT-080). Route, not modal.
 */
export function SentEmailDetailPage() {
  const { courseId = '', emailId = '' } = useParams()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    if (!courseId || !emailId) {
      setState({ status: 'error', message: 'Faltan datos del email' })
      return
    }
    let cancelled = false
    async function load() {
      try {
        const email = await fetchSentEmail(courseId, emailId)
        if (!cancelled) setState({ status: 'ready', email })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'No se pudo cargar el email',
          })
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseId, emailId])

  const backTo = `/courses/${courseId}/emails`

  if (state.status === 'loading') {
    return (
      <AppShell showBack backTo={backTo} backLabel="← Emails">
        <div className="flex flex-col gap-4" aria-busy>
          <PageHeroSkeleton compact stats={0} showActions={false} />
          <Panel tone="default" className="h-56 p-4" />
        </div>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack backTo={backTo} backLabel="← Emails">
        <StateBox title="Email no encontrado" message={state.message} />
      </AppShell>
    )
  }

  const { email } = state

  return (
    <AppShell showBack backTo={backTo} backLabel="← Emails">
      <section className="flex flex-col gap-4 pb-10">
        <PageHero
          compact
          eyebrow={CATEGORY_LABELS[email.category]}
          title={email.subject}
          description={
            <p className="m-0 text-[13px] text-fg-muted">
              {formatWhen(email.createdAt)}
              {email.sentBy ? ` · ${email.sentBy.label}` : ''}
              <span aria-hidden> · </span>
              {email.emailed
                ? email.redirected
                  ? 'Redirigido (modo pruebas)'
                  : 'Enviado por Mailjet'
                : email.reason
                  ? `No enviado (${email.reason})`
                  : 'No enviado'}
            </p>
          }
          actions={
            <ButtonLink to={backTo} variant="ghost">
              Volver al registro
            </ButtonLink>
          }
        />

        <Panel tone="soft" className="p-4 sm:p-5">
          <h2 className="m-0 text-[15px] font-semibold text-fg">
            Destinatarios ({email.recipientCount})
          </h2>
          <ul className="mt-2 m-0 flex list-none flex-col gap-1 p-0">
            {email.recipients.map((addr) => (
              <li key={addr} className="text-[13px] text-fg-muted">
                {addr}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel tone="default" className="p-4 sm:p-5">
          <h2 className="m-0 text-[15px] font-semibold text-fg">Mensaje</h2>
          {email.bodyText ? (
            <pre className="mt-3 m-0 whitespace-pre-wrap break-words rounded-lg border border-border bg-surface-2/50 p-3 font-sans text-[13px] leading-relaxed text-fg">
              {email.bodyText}
            </pre>
          ) : (
            <div
              className="prose-email mt-3 max-w-none overflow-x-auto rounded-lg border border-border bg-surface-1 p-3 text-[13px] text-fg"
              dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            />
          )}
          <Text className="mt-3 text-[12px] text-fg-faint">
            Se guarda el cuerpo enviado (o el que se habría enviado si Mailjet
            no estaba configurado).
          </Text>
        </Panel>
      </section>
    </AppShell>
  )
}
