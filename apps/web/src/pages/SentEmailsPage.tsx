import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  fetchSentEmails,
  type SentEmailCategory,
  type SentEmailSummary,
} from '../api/client'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Panel } from '../components/atoms/Panel'
import { Select } from '../components/atoms/Select'
import { Text } from '../components/atoms/Text'
import { ListRow } from '../components/molecules/ListRow'
import { PageHeroSkeleton } from '../components/molecules/PageHeroSkeleton'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; emails: SentEmailSummary[]; total: number }

const CATEGORY_LABELS: Record<SentEmailCategory, string> = {
  invite: 'Invitación',
  sprint: 'Sprint',
  other: 'Otro',
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

/**
 * Teacher audit log of outbound emails (CT-080).
 */
export function SentEmailsPage() {
  const { courseId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const category: SentEmailCategory | 'all' =
    categoryParam === 'invite' ||
    categoryParam === 'sprint' ||
    categoryParam === 'other'
      ? categoryParam
      : 'all'

  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    if (!courseId) {
      setState({ status: 'error', message: 'Falta el id de la cursada' })
      return
    }
    let cancelled = false
    async function load() {
      try {
        const data = await fetchSentEmails(courseId, category)
        if (!cancelled) {
          setState({
            status: 'ready',
            emails: data.emails,
            total: data.total,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'No se pudo cargar el registro de emails',
          })
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseId, category])

  if (state.status === 'loading') {
    return (
      <AppShell showBack>
        <div className="flex flex-col gap-4" aria-busy aria-label="Cargando">
          <PageHeroSkeleton compact stats={0} showActions={false} />
          <Panel tone="default" className="h-40 p-4" />
        </div>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack>
        <StateBox title="No se pudo abrir el registro" message={state.message} />
      </AppShell>
    )
  }

  return (
    <AppShell showBack>
      <section className="flex flex-col gap-4 pb-10">
        <PageHero
          compact
          eyebrow="Comunicación"
          title="Emails enviados"
          description="Historial de invitaciones y mensajes salientes de esta cursada."
          actions={
            <ButtonLink
              to={`/courses/${courseId}/compose-email`}
              variant="primary"
            >
              Escribir mail
            </ButtonLink>
          }
        />

        <Panel tone="soft" className="flex flex-wrap items-end gap-3 p-4">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
              Categoría
            </span>
            <Select
              value={category}
              onChange={(e) => {
                const next = e.target.value
                if (next === 'all') {
                  setSearchParams({})
                } else {
                  setSearchParams({ category: next })
                }
              }}
            >
              <option value="all">Todas</option>
              <option value="invite">Invitación</option>
              <option value="sprint">Sprint</option>
              <option value="other">Otro</option>
            </Select>
          </label>
          <Text className="text-[13px] text-fg-muted">
            {state.total} registro{state.total === 1 ? '' : 's'}
          </Text>
        </Panel>

        {state.emails.length === 0 ? (
          <StateBox
            title="Todavía no hay emails"
            message="Cuando invites alumnos o escribas un mail, van a aparecer acá."
          />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {state.emails.map((row) => (
              <li key={row.id}>
                <ListRow
                  to={`/courses/${courseId}/emails/${row.id}`}
                  className="block px-3.5 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-[15px] font-semibold text-fg">
                        {row.subject}
                      </p>
                      <p className="mt-1 m-0 text-[12px] text-fg-muted">
                        {CATEGORY_LABELS[row.category]}
                        <span aria-hidden> · </span>
                        {formatWhen(row.createdAt)}
                        {row.sentBy ? (
                          <>
                            <span aria-hidden> · </span>
                            {row.sentBy.label}
                          </>
                        ) : null}
                      </p>
                      <p className="mt-1 m-0 text-[12px] text-fg-faint">
                        {row.recipientCount} destinatario
                        {row.recipientCount === 1 ? '' : 's'}
                        {row.recipientsPreview.length > 0
                          ? ` · ${row.recipientsPreview.join(', ')}`
                          : ''}
                        {row.recipientCount > row.recipientsPreview.length
                          ? '…'
                          : ''}
                      </p>
                    </div>
                    <span
                      className={
                        row.emailed
                          ? 'rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok'
                          : 'rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-fg-muted'
                      }
                    >
                      {row.emailed
                        ? row.redirected
                          ? 'Redirigido'
                          : 'Enviado'
                        : 'No enviado'}
                    </span>
                  </div>
                </ListRow>
              </li>
            ))}
          </ul>
        )}

        <Text className="text-[12px] text-fg-faint">
          También podés{' '}
          <Link
            className="font-semibold text-accent no-underline hover:underline"
            to={`/courses/${courseId}/compose-email`}
          >
            escribir un mail nuevo
          </Link>
          .
        </Text>
      </section>
    </AppShell>
  )
}
