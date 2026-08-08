# Flujo Trello + GitHub — ClassTrack

Cómo trabajamos el seguimiento de forma profesional.

## Tablero

https://trello.com/b/jizP2m9a/classtrack-desapp

### Columnas

| Lista | Uso |
|-------|-----|
| **Épicas** | Agrupa de trabajo grande (varios tickets) — solo épicas **abiertas** |
| **Backlog** | Ideas sin compromiso de etapa |
| **Por hacer** | Listo para empezar (priorizado en la épica activa) |
| **En curso** | En desarrollo ahora (ideal: 1–2 cards) |
| **En revisión** | PR abierto / esperando feedback |
| **Hecho** | Cerrado **y mergeado a `main`** (link a PR). Épicas cerradas también. |

### Etapa activa

Ver [06-roadmap/etapas.md](./06-roadmap/etapas.md). Hoy: **CT-E07 Mejoras continuas**. No reabrir CT-E04 / CT-E06.

### Regla Hecho ⇔ main

Marcar **Hecho** solo cuando el PR está mergeado (o crear/mantener card de higiene de merges, p. ej. CT-051).

### Numeración

- Épicas: `CT-E01`, `CT-E02`, …
- Tareas: `CT-001`, `CT-002`, …

### Labels (obligatorias al crear)

**Toda tarjeta nueva (épica o tarea) debe llevar labels desde el alta.** Sin excepciones.

| Label | Color | Uso |
|-------|-------|-----|
| épica | purple | Tarjeta épica (`CT-E0X`) |
| docs | blue | Documentación |
| infra | orange | Repo, Docker, CI, skills, seed técnico |
| feature | green | Funcionalidad de producto |
| mvp | yellow | Dentro del MVP / producto activo |
| chore | black | Mantenimiento, bugfix UI, alineación |
| urgente | red | Bloqueante / prioridad alta |

**Combinaciones habituales**

| Tipo de tarjeta | Labels |
|-----------------|--------|
| Épica | `épica` + `mvp` (si aplica) |
| Feature de producto | `mvp` + `feature` |
| Bugfix / polish técnico | `mvp` + `chore` |
| Infra / Docker / CI | `infra` (+ `chore` si aplica) |
| Docs | `docs` (+ `mvp` si es del producto) |

API: al crear la card, POST `/cards/{id}/idLabels?value={labelId}` por cada label.

### Épicas ↔ tickets (checklist)

Cada épica **debe** tener un checklist llamado **`Tickets de la épica`** con un ítem por ticket hijo:

```text
CT-0XX — Título — https://trello.com/c/...
```

**Reglas para agentes / al cerrar trabajo**

1. Al **crear** un ticket: poner `**Épica:** CT-E0X` en la descripción, labels, y **agregar el ítem** al checklist de la épica (unchecked).
2. Al **mover un ticket a Hecho**: marcar ese ítem del checklist de la épica como **completo**.
3. Si **todos** los ítems del checklist están completos → mover la **épica a Hecho**.
4. Si se reabre un ticket → desmarcar el ítem y, si la épica estaba en Hecho, devolverla a **Épicas**.

### Asignación

Toda tarjeta activa lleva **miembro asignado** (quién la hace).

### Vínculos

En la descripción o comentarios de cada tarjeta:

```text
## GitHub
- PR: https://github.com/nicolasdelafuente/ClassTrack/pull/N
- Commit: https://github.com/nicolasdelafuente/ClassTrack/commit/SHA
```

Relación épica ↔ tareas: las tareas mencionan `**Épica:** CT-E0X` en la descripción.

## Git / PRs

- Rama desde `main`: `docs/...`, `feat/...`, `chore/...`
- Commits en **español** (ver [convencion-idioma.md](./convencion-idioma.md))
- PR en español; en el body: `Trello: CT-00N` + link a la tarjeta
- Al mergear: mover tarjeta a **Hecho**, pegar link del PR, **actualizar checklist de la épica** (y cerrar épica si corresponde)

## Repo

https://github.com/nicolasdelafuente/ClassTrack
