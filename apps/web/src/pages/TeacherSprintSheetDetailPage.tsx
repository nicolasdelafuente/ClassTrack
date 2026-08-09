import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  approveSheet,
  fetchSheetById,
  requestSheetChanges,
} from '../api/client'
import { Button } from '../components/atoms/Button'
import { Label } from '../components/atoms/Label'
import { Panel } from '../components/atoms/Panel'
import { Text } from '../components/atoms/Text'
import { fieldControlClassName } from '../components/atoms/Input'
import { StateBox } from '../components/molecules/StateBox'
import { ListRow } from '../components/molecules/ListRow'
import { RichTextView } from '../components/molecules/RichTextEditor'
import { TaskCategoryChips } from '../components/molecules/TaskCategoryChips'
import { TaskTrelloLinks } from '../components/molecules/TaskTrelloLinks'
import { PageHero } from '../components/organisms/PageHero'
import { SprintSheetPageSkeleton } from '../components/organisms/PageSkeletons'
import { AppShell } from '../components/templates/AppShell'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { cn } from '../lib/cn'
import { SHEET_STATUS_LABELS, type SprintSheet } from '../types'

/**
 * Teacher review of one sprint sheet (CT-046).
 */
export function TeacherSprintSheetDetailPage() {
  const { courseId = '', sheetId = '' } = useParams()
  const [sheet, setSheet] = useState<SprintSheet | null>(null)
  const [groupLabel, setGroupLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await fetchSheetById(sheetId)
        if (cancelled) return
        setSheet(data.sheet)
        setGroupLabel(
          `Grupo ${data.group.number}${data.group.name ? ` · ${data.group.name}` : ''}`,
        )
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [sheetId])

  async function handleApprove() {
    if (!sheet) return
    setBusy(true)
    try {
      const updated = await approveSheet(sheet.id)
      setSheet(updated)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo aprobar')
    } finally {
      setBusy(false)
    }
  }

  async function handleRequestChanges() {
    if (!sheet) return
    if (comment.trim().length < 5) {
      window.alert('Escribí un comentario de al menos 5 caracteres')
      return
    }
    setBusy(true)
    try {
      const updated = await requestSheetChanges(sheet.id, comment)
      setSheet(updated)
      setComment('')
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudieron pedir cambios',
      )
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <AppShell showBack>
        <SprintSheetPageSkeleton />
      </AppShell>
    )
  }

  if (error || !sheet) {
    return (
      <AppShell showBack>
        <StateBox title="Error" message={error ?? 'Ficha no encontrada'} />
      </AppShell>
    )
  }

  const inReview = sheet.status === 'in_review'

  return (
    <AppShell
      showBack
      backTo={`/courses/${courseId}/sprint-sheets`}
      backLabel="← Cola de fichas"
    >
      <section className="mx-auto flex max-w-2xl flex-col gap-4 pb-10">
        <PageHero
          eyebrow={groupLabel}
          title={`Sprint ${sheet.sprintNumber} · ${sheet.kind === 'start' ? 'Inicio' : 'Fin'}`}
          description={SHEET_STATUS_LABELS[sheet.status]}
          actions={
            <ButtonLink
              variant="ghost"
              className="min-h-11"
              to={`/courses/${courseId}/sprint-sheets`}
            >
              Volver a la cola
            </ButtonLink>
          }
        />

        {sheet.comments.length > 0 ? (
          <Panel className="p-4">
            <p className="m-0 text-[13px] font-semibold">Comentarios previos</p>
            <ul className="mt-2 m-0 list-none space-y-2 p-0">
              {sheet.comments.map((c) => (
                <ListRow
                  key={c.id}
                  as="li"
                  tone="soft"
                  className="px-3 py-2 text-[13px]"
                >
                  {c.body}
                </ListRow>
              ))}
            </ul>
          </Panel>
        ) : null}

        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {sheet.tasks.map((t) => (
            <ListRow key={t.id} as="li" className="px-3.5 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <TaskCategoryChips value={t.categories ?? []} />
                {t.isExtra ? (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-faint">
                    extra
                  </span>
                ) : null}
              </div>
              <p className="mt-1 m-0 text-[14px] font-medium text-fg">
                {t.title}
              </p>
              {t.description ? (
                <RichTextView className="mt-1" html={t.description} />
              ) : null}
              <TaskTrelloLinks links={t.trelloLinks ?? []} />
              {sheet.kind === 'end' ? (
                <div className="mt-1 text-[12px] text-fg-faint">
                  {t.isExtra ? (
                    <>
                      <span>Motivo extra</span>
                      {t.extraReason ? (
                        <RichTextView className="mt-0.5" html={t.extraReason} />
                      ) : (
                        <span>: —</span>
                      )}
                    </>
                  ) : t.completed ? (
                    'Hecha'
                  ) : (
                    <>
                      <span>No hecha</span>
                      {t.incompleteReason ? (
                        <RichTextView
                          className="mt-0.5"
                          html={t.incompleteReason}
                        />
                      ) : (
                        <span>: —</span>
                      )}
                    </>
                  )}
                </div>
              ) : null}
            </ListRow>
          ))}
        </ul>

        {inReview ? (
          <Panel className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={busy}
                onClick={() => void handleApprove()}
              >
                Aprobar
              </Button>
            </div>
            <Label className="mt-4" htmlFor="changes">
              Pedir cambios (comentario)
            </Label>
            <textarea
              id="changes"
              rows={3}
              value={comment}
              disabled={busy}
              className={cn(fieldControlClassName, 'min-h-[4rem]')}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Qué tienen que mejorar…"
            />
            <Button
              type="button"
              variant="ghost"
              className="mt-2"
              disabled={busy}
              onClick={() => void handleRequestChanges()}
            >
              Pedir cambios
            </Button>
          </Panel>
        ) : (
          <Text className="text-[13px] text-fg-muted">
            Esta ficha no está en revisión (estado:{' '}
            {SHEET_STATUS_LABELS[sheet.status]}).
          </Text>
        )}
      </section>
    </AppShell>
  )
}
