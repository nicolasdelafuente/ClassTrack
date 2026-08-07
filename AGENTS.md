# AGENTS.md — ClassTrack

Instrucciones para agentes (Cursor) en este repo.

## 1. Skills primero

Abrí el `SKILL.md` que corresponda (`.cursor/rules/skills-activation.mdc`).

UI web: **siempre** `.agents/skills/classtrack-ui/SKILL.md` primero.

## 2. Stack

| App | Stack |
|-----|--------|
| `apps/web` | React + Vite + TS + Tailwind v4 + Atomic Design — **light minimal** |
| `apps/api` | NestJS + Prisma (SQLite local) |

## 3. Producto

Docs: `project-hub-docs/`. MVP: tablero, detalle, asistencia. Docker pospuesto.

## 4. Idioma

Trello / commits / PRs en **español**. Código en inglés.

**Trello:** al crear una tarjeta, **siempre** poner labels (`mvp`/`feature`/`chore`/`infra`/`docs`/`épica`). Ver `project-hub-docs/flujo-trello-github.md`.

## 5. Datos sensibles

No commitear Excel ni `from-excel.json`. Solo `demo.json` anonimizado.
