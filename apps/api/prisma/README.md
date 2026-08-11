# Prisma (API)

Local demo uses **SQLite** (`DATABASE_URL=file:./dev.db`).

## Setup

```bash
# from repo root
cp apps/api/.env.example apps/api/.env
npm run prisma:migrate
npm run seed
```

## Seed sources

| File | Purpose | Git |
|------|---------|-----|
| `data/demo.json` | Anonymized groups/students | committed |
| `data/from-excel.json` | Real Excel extract (PII) | gitignored |

Roster source: sheet **DesApp2026** (from row 3: Legajo / Alumno / Grupo / Contactos).
For local tests the extractor sets **every legajo to `40000000`**.
Other sheets only enrich topic, teacher and links.

Regenerate both from the local Excel (never commit the xlsx):

```bash
npm run extract:excel -w api
```

Seed real data locally (creates a **User** for every student + teachers; password `demo123`):

```bash
# PowerShell
$env:SEED_FROM_EXCEL=1; npm run seed -w api
```

Teachers get emails like `nicolas@classtrack.local`. Students use their Excel email.
Presentismo (`p` / vacío) se lee de las columnas por fecha en **DesApp2026** y se guarda en `attendance`.
With `SEED_FROM_EXCEL=1` the cronograma keeps real DesApp dates (no shift) so marks match.
The login screen lists sample accounts from `GET /auth/login-hints`.

## Verify API

```bash
npm run dev:api
# GET http://localhost:3001/api/courses/current
# GET http://localhost:3001/api/courses/:id/groups
```
