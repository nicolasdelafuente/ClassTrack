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

- Web: http://localhost:5173  
- API health: http://localhost:3001/api/health  

## Trello

CT-009 — Crear monorepo apps/web y apps/api
