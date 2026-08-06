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

Regenerate both from the local Excel (never commit the xlsx):

```bash
npm run extract:excel -w api
```

Seed real data locally:

```bash
# PowerShell
$env:SEED_FROM_EXCEL=1; npm run seed -w api
```

## Verify API

```bash
npm run dev:api
# GET http://localhost:3001/api/courses/current
# GET http://localhost:3001/api/courses/:id/groups
```
