# ClassTrack

App web responsive para docentes de **Desarrollo de Aplicaciones** (UNaHur).

Seguimiento de cursada: grupos, semáforo de sprints, asistencia — sin depender del Excel.

## Monorepo

| App | Stack | Puerto |
|-----|--------|--------|
| [`apps/web`](./apps/web) | React + Vite + TypeScript | 5173 |
| [`apps/api`](./apps/api) | NestJS + TypeScript | 3001 (`/api`) |

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run prisma:migrate
npm run seed
npm run dev:api   # terminal 1
npm run dev:web   # terminal 2
```

Seed demo (anónimo): `apps/api/prisma/data/demo.json`. Detalle: [`apps/api/prisma/README.md`](./apps/api/prisma/README.md).

Detalle apps: [`apps/README.md`](./apps/README.md)

## Documentación de producto

| Doc | Contenido |
|-----|-----------|
| [project-hub-docs/README.md](./project-hub-docs/README.md) | Mapa de etapas |
| [project-hub-docs/06-roadmap/mvp.md](./project-hub-docs/06-roadmap/mvp.md) | Alcance del MVP |
| [project-hub-docs/stack-kit.md](./project-hub-docs/stack-kit.md) | Stack + skills reutilizables |
| [project-hub-docs/convencion-idioma.md](./project-hub-docs/convencion-idioma.md) | Español en Trello, commits y PRs |
| [project-hub-docs/flujo-trello-github.md](./project-hub-docs/flujo-trello-github.md) | Flujo profesional Trello ↔ GitHub |

## Tablero

[Trello — ClassTrack DesApp](https://trello.com/b/jizP2m9a/classtrack-desapp)

Tickets numerados `CT-E##` (épicas) y `CT-###` (tareas).

## Nota

No versionar Excel ni padrones con datos de alumnos (ver `.gitignore`).
