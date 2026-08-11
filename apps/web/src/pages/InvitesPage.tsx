import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  createInvite,
  fetchInviteCandidates,
  type CreateInviteResult,
  type InviteCandidate,
} from '../api/client'
import { Button } from '../components/atoms/Button'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import { Panel } from '../components/atoms/Panel'
import { Text } from '../components/atoms/Text'
import { PageHeroSkeleton } from '../components/molecules/PageHeroSkeleton'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; candidates: InviteCandidate[] }

type LastInvite = CreateInviteResult & { fullName?: string }

/**
 * Teacher invites students (from roster emails) or colleague teachers.
 * Without Mailjet keys, shows a copyable invite URL (CT-042).
 */
export function InvitesPage() {
  const { courseId = '' } = useParams()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [teacherEmail, setTeacherEmail] = useState('')
  const [busyEmail, setBusyEmail] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [lastInvite, setLastInvite] = useState<LastInvite | null>(null)
  const [copied, setCopied] = useState(false)

  async function reload() {
    const candidates = await fetchInviteCandidates(courseId)
    setState({ status: 'ready', candidates })
  }

  useEffect(() => {
    if (!courseId) {
      setState({ status: 'error', message: 'Falta el id de la cursada' })
      return
    }
    let cancelled = false
    async function load() {
      try {
        const candidates = await fetchInviteCandidates(courseId)
        if (!cancelled) setState({ status: 'ready', candidates })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'No se pudieron cargar los candidatos',
          })
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseId])

  async function sendInvite(
    email: string,
    role: 'teacher' | 'student',
    fullName?: string,
  ) {
    setFormError(null)
    setCopied(false)
    setBusyEmail(email)
    try {
      const result = await createInvite(courseId, { email, role })
      setLastInvite({ ...result, fullName })
      await reload()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo crear la invitación',
      )
    } finally {
      setBusyEmail(null)
    }
  }

  async function onInviteTeacher(event: FormEvent) {
    event.preventDefault()
    await sendInvite(teacherEmail.trim(), 'teacher')
    setTeacherEmail('')
  }

  async function copyLink() {
    if (!lastInvite) return
    try {
      await navigator.clipboard.writeText(lastInvite.inviteUrl)
      setCopied(true)
    } catch {
      setFormError('No se pudo copiar. Seleccioná el link a mano.')
    }
  }

  if (state.status === 'loading') {
    return (
      <AppShell>
        <div className="flex flex-col gap-4" aria-busy aria-label="Cargando">
          <PageHeroSkeleton compact stats={0} showActions={false} />
          <Panel tone="default" className="h-48 p-4">
            <div className="h-full rounded-md bg-surface-2 motion-safe:animate-skeleton" />
          </Panel>
        </div>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell>
        <StateBox title="No se pudo abrir invitaciones" message={state.message} />
      </AppShell>
    )
  }

  const { candidates } = state
  const actionable = candidates.filter((c) => !c.alreadyRegistered)

  return (
    <AppShell>
      <section className="flex flex-col gap-4">
        <PageHero
          compact
          eyebrow="Acceso"
          title="Invitar a ClassTrack"
          description="Mandamos un mail con el link de registro. Si Mailjet no está configurado, te mostramos el link para copiar."
        />

        {lastInvite ? (
          <Panel
            tone={lastInvite.emailed ? 'default' : 'soft'}
            className="p-4 sm:p-5"
            role="status"
          >
            <p className="m-0 text-[14px] font-semibold text-fg">
              {lastInvite.emailed
                ? lastInvite.redirected
                  ? 'Mail enviado (redirigido a casilla de pruebas)'
                  : 'Mail enviado'
                : 'Invitación creada (modo local)'}
            </p>
            <p className="mt-1 text-[13px] text-fg-muted">
              {lastInvite.fullName ? `${lastInvite.fullName} · ` : null}
              {lastInvite.email} ·{' '}
              {lastInvite.role === 'teacher' ? 'docente' : 'alumno'}
            </p>
            {!lastInvite.emailed ? (
              <div className="mt-3 space-y-2">
                <Text faint>
                  Configurá Mailjet en el `.env` de la API para enviar mails
                  reales. Mientras tanto, compartí este link:
                </Text>
                <code className="block break-all rounded-md border border-border bg-surface-1 px-3 py-2 text-[12px] text-fg">
                  {lastInvite.inviteUrl}
                </code>
                <Button type="button" variant="ghost" onClick={() => void copyLink()}>
                  {copied ? 'Copiado' : 'Copiar link'}
                </Button>
              </div>
            ) : null}
          </Panel>
        ) : null}

        {formError ? (
          <p className="m-0 text-[13px] text-critical" role="alert">
            {formError}
          </p>
        ) : null}

        <Panel tone="default" className="overflow-hidden">
          <div className="border-b border-border bg-surface-2/80 px-4 py-3">
            <p className="m-0 text-[14px] font-semibold text-fg">
              Alumnos de la cursada
            </p>
            <Text faint className="mt-1">
              Solo mails del roster. {actionable.length} pendientes de cuenta.
            </Text>
          </div>
          {actionable.length === 0 ? (
            <p className="m-0 px-4 py-6 text-[13px] text-fg-muted">
              No hay alumnos con email pendientes de invitar (o ya tienen
              cuenta).
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {actionable.map((c) => (
                <li
                  key={c.studentId}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[14px] font-medium text-fg">
                      {c.fullName}
                    </p>
                    <p className="m-0 truncate text-[12px] text-fg-muted">
                      {c.email} · G{c.group.number}
                      {c.invitePending ? ' · invitación pendiente' : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-9 shrink-0 text-[12px]"
                    disabled={busyEmail === c.email}
                    onClick={() =>
                      void sendInvite(c.email, 'student', c.fullName)
                    }
                  >
                    {busyEmail === c.email
                      ? 'Enviando…'
                      : c.invitePending
                        ? 'Reenviar'
                        : 'Invitar'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel tone="soft" className="p-4 sm:p-5">
          <p className="m-0 text-[14px] font-semibold text-fg">
            Invitar docente colega
          </p>
          <Text faint className="mt-1">
            El curso no guarda mails de docentes en el roster; cargá el email
            del colega.
          </Text>
          <form
            onSubmit={onInviteTeacher}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <div className="min-w-[14rem] flex-1">
              <Label htmlFor="invite-teacher-email">Email</Label>
              <Input
                id="invite-teacher-email"
                type="email"
                required
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="colega@universidad.edu"
              />
            </div>
            <Button
              type="submit"
              disabled={busyEmail !== null || !teacherEmail.trim()}
            >
              Invitar docente
            </Button>
          </form>
        </Panel>
      </section>
    </AppShell>
  )
}
