# Flujo Trello + GitHub — ClassTrack

Cómo trabajamos el seguimiento de forma profesional.

## Tablero

https://trello.com/b/jizP2m9a/classtrack-desapp

### Columnas

| Lista | Uso |
|-------|-----|
| **Épicas** | Agrupa de trabajo grande (varios tickets) |
| **Backlog** | Ideas / después del MVP |
| **Por hacer** | Listo para empezar (priorizado) |
| **En curso** | En desarrollo ahora |
| **En revisión** | PR abierto / esperando feedback |
| **Hecho** | Cerrado (con link a PR/commit) |

### Numeración

- Épicas: `CT-E01`, `CT-E02`, …
- Tareas: `CT-001`, `CT-002`, …

### Labels

| Label | Color | Uso |
|-------|-------|-----|
| épica | purple | Tarjeta épica |
| docs | blue | Documentación |
| infra | orange | Repo, Docker, CI, skills |
| feature | green | Funcionalidad de producto |
| mvp | yellow | Dentro del MVP |
| chore | black | Mantenimiento |

### Asignación

Toda tarjeta activa lleva **miembro asignado** (quién la hace).

### Vínculos

En la descripción o comentarios de cada tarjeta:

```text
## GitHub
- PR: https://github.com/nicolasdelafuente/ClassTrack/pull/N
- Commit: https://github.com/nicolasdelafuente/ClassTrack/commit/SHA
```

Relación épica ↔ tareas: las tareas mencionan `Épica: CT-E0X` en la descripción.

## Git / PRs

- Rama desde `main`: `docs/...`, `feat/...`, `chore/...`
- Commits en **español** (ver [convencion-idioma.md](./convencion-idioma.md))
- PR en español; en el body: `Trello: CT-00N` + link a la tarjeta
- Al mergear: mover tarjeta a **Hecho** y pegar link del PR

## Repo

https://github.com/nicolasdelafuente/ClassTrack
