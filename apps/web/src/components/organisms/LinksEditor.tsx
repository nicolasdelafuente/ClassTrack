import { useEffect, useState } from 'react'
import type { GithubRepoLink, GroupLinks } from '../../types'
import { Button } from '../atoms/Button'
import { IconDrive, IconGithub, IconTrello } from '../atoms/icons'
import { InlineStatus } from '../atoms/InlineStatus'
import { Input } from '../atoms/Input'
import { Label } from '../atoms/Label'
import {
  TeamResourceCard,
  TeamResourceUrl,
} from '../molecules/TeamResourceCard'

type LinksEditorProps = {
  links: GroupLinks
  disabled?: boolean
  onSave: (links: GroupLinks) => Promise<void>
}

type UrlFieldKey = 'trelloUrl' | 'driveUrl'

type SavePhase = 'idle' | 'saving' | 'saved' | 'error'

const EMPTY_LINKS: GroupLinks = {
  githubWorkspaceUrl: null,
  githubRepos: [],
  trelloUrl: null,
  driveUrl: null,
}

function normalizeIncoming(links: GroupLinks): GroupLinks {
  return {
    ...EMPTY_LINKS,
    ...links,
    githubRepos: Array.isArray(links.githubRepos)
      ? links.githubRepos.map((r) => ({
          url: r.url ?? '',
          branch: r.branch ?? null,
        }))
      : [],
  }
}

function sameRepos(a: GithubRepoLink[], b: GithubRepoLink[]) {
  if (a.length !== b.length) return false
  return a.every(
    (repo, i) =>
      repo.url === b[i].url && (repo.branch ?? null) === (b[i].branch ?? null),
  )
}

function hasAnyResource(links: GroupLinks) {
  return Boolean(
    links.githubWorkspaceUrl?.trim() ||
      links.githubRepos.some((r) => r.url.trim()) ||
      links.trelloUrl?.trim() ||
      links.driveUrl?.trim(),
  )
}

export function LinksEditor({
  links,
  disabled = false,
  onSave,
}: LinksEditorProps) {
  const [draft, setDraft] = useState<GroupLinks>(() =>
    normalizeIncoming(links),
  )
  const [editing, setEditing] = useState(false)
  const [phase, setPhase] = useState<SavePhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setDraft(normalizeIncoming(links))
  }, [links])

  const dirty =
    draft.githubWorkspaceUrl !== links.githubWorkspaceUrl ||
    !sameRepos(draft.githubRepos, links.githubRepos ?? []) ||
    draft.trelloUrl !== links.trelloUrl ||
    draft.driveUrl !== links.driveUrl

  const saving = phase === 'saving'
  const fieldsDisabled = disabled || saving

  async function handleSave() {
    const next: GroupLinks = {
      githubWorkspaceUrl: draft.githubWorkspaceUrl?.trim() || null,
      githubRepos: draft.githubRepos
        .map((repo) => ({
          url: repo.url.trim(),
          branch: repo.branch?.trim() || null,
        }))
        .filter((repo) => repo.url),
      trelloUrl: draft.trelloUrl?.trim() || null,
      driveUrl: draft.driveUrl?.trim() || null,
    }

    if (!hasAnyResource(next)) {
      window.alert(
        'No deberías dejar el grupo sin recursos. Cargá al menos espacio GitHub, un repo, Trello o Drive.',
      )
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
        err instanceof Error ? err.message : 'No se pudo guardar',
      )
    }
  }

  function clearGithubAll() {
    setDraft((prev) => ({
      ...prev,
      githubWorkspaceUrl: null,
      githubRepos: [],
    }))
  }

  function clearField(key: UrlFieldKey) {
    setDraft((prev) => ({ ...prev, [key]: null }))
  }

  function addRepo() {
    setDraft((prev) => ({
      ...prev,
      githubRepos: [...prev.githubRepos, { url: '', branch: 'main' }],
    }))
  }

  function removeRepo(index: number) {
    setDraft((prev) => ({
      ...prev,
      githubRepos: prev.githubRepos.filter((_, i) => i !== index),
    }))
  }

  function updateRepoUrl(index: number, url: string) {
    setDraft((prev) => {
      const next = [...prev.githubRepos]
      next[index] = { ...next[index], url }
      return { ...prev, githubRepos: next }
    })
  }

  function updateRepoBranch(index: number, branch: string) {
    setDraft((prev) => {
      const next = [...prev.githubRepos]
      next[index] = { ...next[index], branch }
      return { ...prev, githubRepos: next }
    })
  }

  const githubConnected =
    Boolean(draft.githubWorkspaceUrl?.trim()) ||
    draft.githubRepos.some((r) => r.url.trim())
  const trelloConnected = Boolean(draft.trelloUrl?.trim())
  const driveConnected = Boolean(draft.driveUrl?.trim())

  const workspace = draft.githubWorkspaceUrl?.trim() || null
  const repos = draft.githubRepos.filter((r) => r.url.trim())

  return (
    <div className="flex flex-col gap-2">
      <TeamResourceCard
        icon={<IconGithub className="text-fg" />}
        name="GitHub"
        connected={githubConnected}
        editing={editing}
        staggerIndex={0}
        secondary="Espacio del equipo y repos a evaluar"
        detail={
          githubConnected ? (
            <div className="space-y-2.5">
              <div className="min-w-0">
                <p className="m-0 text-[12px] font-medium text-fg-faint">
                  Espacio
                </p>
                {workspace ? (
                  <TeamResourceUrl href={workspace} />
                ) : (
                  <p className="m-0 text-[13px] text-fg-faint">—</p>
                )}
              </div>
              <div className="min-w-0">
                <p className="m-0 text-[12px] font-medium text-fg-faint">
                  Repositorios
                  {repos.length > 0 ? ` · ${repos.length}` : ''}
                </p>
                {repos.length > 0 ? (
                  <ul className="m-0 mt-1 flex list-none flex-col gap-1.5 p-0">
                    {repos.map((repo) => (
                      <li key={repo.url} className="min-w-0">
                        <TeamResourceUrl href={repo.url} />
                        <p className="m-0 text-[12px] text-fg-faint">
                          Rama: {repo.branch?.trim() ? repo.branch : '—'}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 mt-0.5 text-[13px] text-fg-faint">
                    Sin repos a evaluar
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="m-0 text-[13px] text-fg-faint">Sin link configurado</p>
          )
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="githubWorkspaceUrl">Espacio de trabajo</Label>
            <Input
              id="githubWorkspaceUrl"
              type="url"
              inputMode="url"
              placeholder="https://github.com/org-o-equipo"
              value={draft.githubWorkspaceUrl ?? ''}
              disabled={fieldsDisabled}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  githubWorkspaceUrl: e.target.value,
                }))
              }
            />
            <p className="mt-1 m-0 text-[12px] text-fg-faint">
              Link de la organización o del equipo (no el repo).
            </p>
          </div>

          <div>
            <Label>Repositorios a evaluar</Label>
            <ul className="m-0 mt-1.5 flex list-none flex-col gap-3 p-0">
              {draft.githubRepos.length === 0 ? (
                <li className="text-[12px] text-fg-faint">
                  Todavía no hay repos. Agregá los que el docente debe revisar
                  (una rama por repo).
                </li>
              ) : null}
              {draft.githubRepos.map((repo, repoIndex) => (
                <li
                  key={`repo-${repoIndex}`}
                  className="rounded-lg border border-border bg-surface px-2.5 py-2.5"
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <Label htmlFor={`repo-url-${repoIndex}`}>
                          Repo {repoIndex + 1}
                        </Label>
                        <Input
                          id={`repo-url-${repoIndex}`}
                          type="url"
                          inputMode="url"
                          placeholder="https://github.com/org/repo"
                          value={repo.url}
                          disabled={fieldsDisabled}
                          onChange={(e) =>
                            updateRepoUrl(repoIndex, e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor={`repo-branch-${repoIndex}`}>
                          Rama a evaluar
                        </Label>
                        <Input
                          id={`repo-branch-${repoIndex}`}
                          type="text"
                          placeholder="main"
                          value={repo.branch ?? ''}
                          disabled={fieldsDisabled}
                          onChange={(e) =>
                            updateRepoBranch(repoIndex, e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-6 min-h-9 shrink-0 px-2.5 text-[12px] text-critical"
                      disabled={fieldsDisabled}
                      onClick={() => removeRepo(repoIndex)}
                    >
                      Quitar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 min-h-9 px-2.5 text-[12px]"
              disabled={fieldsDisabled}
              onClick={addRepo}
            >
              + Agregar repositorio
            </Button>
          </div>

          {githubConnected ? (
            <Button
              type="button"
              variant="ghost"
              className="self-start min-h-9 px-2.5 text-[12px] text-critical"
              disabled={fieldsDisabled}
              onClick={clearGithubAll}
            >
              Eliminar GitHub
            </Button>
          ) : null}
        </div>
      </TeamResourceCard>

      <TeamResourceCard
        icon={<IconTrello className="text-fg" />}
        name="Trello"
        connected={trelloConnected}
        editing={editing}
        staggerIndex={1}
        secondary={
          trelloConnected
            ? 'Tablero del equipo'
            : 'Tablero para seguimiento de tareas'
        }
        detail={
          trelloConnected && draft.trelloUrl ? (
            <TeamResourceUrl href={draft.trelloUrl} />
          ) : (
            <p className="m-0 text-[13px] text-fg-faint">Sin link configurado</p>
          )
        }
      >
        <div className="flex flex-col gap-2">
          <div>
            <Label htmlFor="trelloUrl">URL del tablero</Label>
            <Input
              id="trelloUrl"
              type="url"
              inputMode="url"
              placeholder="https://trello.com/b/…"
              value={draft.trelloUrl ?? ''}
              disabled={fieldsDisabled}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, trelloUrl: e.target.value }))
              }
            />
          </div>
          {trelloConnected ? (
            <Button
              type="button"
              variant="ghost"
              className="self-start min-h-9 px-2.5 text-[12px] text-critical"
              disabled={fieldsDisabled}
              onClick={() => clearField('trelloUrl')}
            >
              Eliminar Trello
            </Button>
          ) : null}
        </div>
      </TeamResourceCard>

      <TeamResourceCard
        icon={<IconDrive className="text-fg" />}
        name="Drive"
        connected={driveConnected}
        editing={editing}
        staggerIndex={2}
        secondary={
          driveConnected
            ? 'Carpeta compartida del equipo'
            : 'La carpeta debe tener permiso de editor para el docente / tutores.'
        }
        detail={
          driveConnected && draft.driveUrl ? (
            <TeamResourceUrl href={draft.driveUrl} />
          ) : (
            <p className="m-0 text-[13px] text-fg-faint">Sin link configurado</p>
          )
        }
      >
        <div className="flex flex-col gap-2">
          <div>
            <Label htmlFor="driveUrl">URL de la carpeta</Label>
            <Input
              id="driveUrl"
              type="url"
              inputMode="url"
              placeholder="https://drive.google.com/…"
              value={draft.driveUrl ?? ''}
              disabled={fieldsDisabled}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, driveUrl: e.target.value }))
              }
            />
            <p className="mt-1.5 m-0 text-[12px] text-pretty text-fg-faint">
              La carpeta debe tener permiso de editor para el docente / tutores.
            </p>
          </div>
          {driveConnected ? (
            <Button
              type="button"
              variant="ghost"
              className="self-start min-h-9 px-2.5 text-[12px] text-critical"
              disabled={fieldsDisabled}
              onClick={() => clearField('driveUrl')}
            >
              Eliminar Drive
            </Button>
          ) : null}
        </div>
      </TeamResourceCard>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {editing ? (
          <>
            <Button
              variant="primary"
              disabled={!dirty || saving || disabled}
              onClick={() => void handleSave()}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setDraft(normalizeIncoming(links))
                setEditing(false)
                setPhase('idle')
                setErrorMessage(null)
              }}
            >
              Cancelar
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            disabled={disabled}
            onClick={() => {
              setEditing(true)
              setPhase('idle')
            }}
          >
            Editar recursos
          </Button>
        )}
        <InlineStatus
          phase={phase === 'idle' ? 'idle' : phase}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  )
}
