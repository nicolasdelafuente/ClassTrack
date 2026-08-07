# CT-018 — Alineación con skills

Pasada de deuda técnica (evitar trabajo doble). Skills aplicadas:

| Skill | Cambios principales |
|-------|---------------------|
| `nestjs-best-practices` / `security-validate-all-input` | DTOs + `ValidationPipe` global |
| `security-and-hardening` | `helmet`, CORS acotado, rate limit (`Throttler`) |
| `vercel-react-best-practices` | `GET /courses/current/board` (sin waterfall course→groups) |
| `web-design-guidelines` | skip link, `aria-live`, focus-visible, touch-manipulation, reduced-motion |

## Fuera de alcance (a propósito)

- Auth JWT (MVP sin login)
- Postgres (`prisma-postgres` → CT-014)
- Virtualización de listas (hoy ~10 grupos / ~50 alumnos)

## Cómo verificar

```bash
npm run build -w api
npm run build -w web
npm run seed
npm run dev:api
# GET http://localhost:3001/api/courses/current/board
```
