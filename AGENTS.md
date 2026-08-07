# AGENTS.md — ClassTrack

Instrucciones para agentes (Cursor) en este repo.

## 1. Skills primero

Abrí el `SKILL.md` que corresponda (`.cursor/rules/skills-activation.mdc`).

UI web: **siempre** `.agents/skills/classtrack-ui/SKILL.md` primero.

**Sin modales** salvo confirmación/alerta: preferí rutas nuevas o UI inline (`.cursor/rules/no-modales.mdc`).

## 2. Stack

| App | Stack |
|-----|--------|
| `apps/web` | React + Vite + TS + Tailwind v4 + Atomic Design — **light minimal** |
| `apps/api` | NestJS + Prisma (SQLite local) |

## 3. Producto

Docs: `project-hub-docs/`. MVP: tablero, detalle, asistencia. Docker pospuesto.

## 4. Idioma

Trello / commits / PRs en **español**. Código en inglés.

**Trello (obligatorio para agentes):**

1. **Labels** en toda tarjeta nueva (`mvp`/`feature`/`chore`/`infra`/`docs`/`épica`).
2. Toda tarea con `**Épica:** CT-E0X` en la descripción.
3. Checklist **`Tickets de la épica`** en cada épica: agregar ítem al crear ticket; marcar al pasar a Hecho; si el checklist queda 100% → mover épica a **Hecho**.

Detalle: `project-hub-docs/flujo-trello-github.md`.

## 5. Datos sensibles

No commitear Excel ni `from-excel.json`. Solo `demo.json` anonimizado.
