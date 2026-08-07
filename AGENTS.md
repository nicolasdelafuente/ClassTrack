# AGENTS.md — ClassTrack

Instrucciones para agentes (Cursor) que trabajen en este repo.

## 1. Skills primero

Antes de código: abrí el `SKILL.md` que corresponda (ver `.cursor/rules/skills-activation.mdc`).

Ubicación: `.agents/skills/<nombre>/SKILL.md`

## 2. Stack actual

| App | Stack |
|-----|--------|
| `apps/web` | React + Vite + TS + Tailwind v4 + Atomic Design |
| `apps/api` | NestJS + Prisma (SQLite local; Postgres más adelante) |

## 3. Producto

Docs en `project-hub-docs/`. MVP: tablero, detalle de grupo, asistencia. Docker (CT-014) pospuesto.

## 4. Idioma

Trello / commits / PRs en **español**. Código en inglés.

## 5. Datos sensibles

No commitear Excel ni `from-excel.json`. Solo `demo.json` anonimizado.
