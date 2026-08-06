# ClassTrack monorepo

```text
apps/
  web/   React + Vite + TypeScript (puerto 5173)
  api/   NestJS + TypeScript (puerto 3001, prefijo /api)
```

## Requisitos

- Node.js 20+

## Instalar

Desde la raíz del repo:

```bash
npm install
```

## Desarrollo

```bash
# terminal 1 — API
npm run dev:api

# terminal 2 — Web
npm run dev:web
```

- Web: http://localhost:5173 — tablero de grupos (CT-011)  
- API health: http://localhost:3001/api/health  
- API cursos: http://localhost:3001/api/courses/current  

## Seed

```bash
cp apps/api/.env.example apps/api/.env
npm run prisma:migrate
npm run seed
```

## Trello

CT-009 monorepo · CT-010 seed · CT-011 tablero
