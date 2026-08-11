# CT-E10 — Persistencia de logs (archivo)

**Logger técnico:** NestJS → **Pino** (`nestjs-pino`) → **pino-roll** → `apps/api/logs/classtrack-api*.jsonl`  
(+ consola: pretty en develop / JSON en testing-production).

No AppLogger / Winston / sink JSONL casero.

**Trello:** [CT-E10](https://trello.com/c/H0BKIHri)

## Tickets

| ID | Título | Trello |
|----|--------|--------|
| CT-081 | Sink + rotación | [KY17obEV](https://trello.com/c/KY17obEV) |
| CT-082 | Docs | [8BL2uEuI](https://trello.com/c/8BL2uEuI) |

## Verificación manual (error BD)

1. `npm run start:dev -w api`
2. Forzá un error Prisma / 500.
3. `Get-Content .\apps\api\logs\classtrack-api*.jsonl -Tail 20`
4. Buscá `"level":50` / `CT_DB` / `Prisma` — debe haber `requestId` y stack en el log, no en el body HTTP de prod.
