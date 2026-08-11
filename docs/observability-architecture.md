# Arquitectura de observabilidad — ClassTrack (Fase 2)

**Estado:** diseño aprobado para implementación (Fases 3+)  
**Apps:** `apps/api` (fuente de verdad de logs) + `apps/web` (correlación + errores de UI)  
**Referencias:** `docs/observability-audit.md`, skill `production-monitoring`

---

## 1. Objetivos

Responder en develop y producción:

| Pregunta | Mecanismo |
|----------|-----------|
| ¿Qué ocurrió? | `message` + `action` / `errorCode` |
| ¿Cuándo? | `timestamp` ISO-8601 |
| ¿Dónde? | `service` + `module` + `endpoint` |
| ¿Quién / qué request? | `userId` + `requestId` (+ `correlationId`) |
| ¿Qué error / stack? | canal **error** (`err` serializado solo en servidor) |
| ¿DB / externo? | `db.*` / `external.*` en metadata |
| ¿Cuánto tardó? | `durationMs` |
| ¿Tipo de evento? | `channel`: `app` \| `audit` \| `error` |
| ¿Secuencia? | mismo `requestId` en todos los eventos de la request |

---

## 2. Tres canales (separación obligatoria)

No mezclar semánticas en un solo “log de todo”.

### 2.1 Application logs (`channel: "app"`)

Comportamiento técnico del sistema.

```json
{
  "channel": "app",
  "level": "info",
  "timestamp": "2026-08-11T19:00:00.000Z",
  "service": "classtrack-api",
  "environment": "develop",
  "requestId": "req_01H...",
  "module": "MailService",
  "message": "Mailjet send completed",
  "external": { "service": "mailjet", "operation": "send", "status": "success", "durationMs": 412 }
}
```

Ejemplos: bootstrap, mail OK/fail técnico, query lenta, rate limit.

### 2.2 Audit events (`channel: "audit"`)

Acciones relevantes de un **actor** sobre un **recurso**. Nivel tipicamente `info` (el canal ya marca la semántica).

```json
{
  "channel": "audit",
  "level": "info",
  "timestamp": "2026-08-11T19:00:01.000Z",
  "service": "classtrack-api",
  "environment": "develop",
  "requestId": "req_01H...",
  "actorUserId": "clxyz...",
  "action": "NOTE_DELETED",
  "resourceType": "group_note",
  "resourceId": "clnote...",
  "outcome": "success",
  "module": "GroupNotesService",
  "metadata": { "groupId": "clgroup..." }
}
```

Ejemplos: `USER_LOGIN`, `ATTENDANCE_MARKED`, `SHEET_APPROVED`, `NOTE_DELETED`.  
**No** auditar cada GET ni cada click.

### 2.3 Error logs (`channel: "error"`)

Fallos que impiden completar una operación (o unhandled).

```json
{
  "channel": "error",
  "level": "error",
  "timestamp": "2026-08-11T19:00:02.000Z",
  "service": "classtrack-api",
  "environment": "develop",
  "requestId": "req_01H...",
  "userId": "clxyz...",
  "module": "SprintSheetsService",
  "endpoint": "/api/sheets/:id/approve",
  "httpMethod": "POST",
  "statusCode": 500,
  "errorCode": "CT_UNEXPECTED",
  "errorType": "Error",
  "message": "Unexpected failure approving sheet",
  "err": { "name": "Error", "message": "...", "stack": "..." }
}
```

`err.stack` **solo en stdout del servidor**, nunca en el JSON de respuesta HTTP al browser en `production`.

---

## 3. Decisión de librería

| Opción | Pros | Contras |
|--------|------|---------|
| **pino + nestjs-pino (elegido)** | Estándar Node, redact, transports, Nest ALS | Dependencias nuevas |
| Nest `Logger` solo | Cero deps | Menos ergonomía JSON/redact/archivo |
| Winston | Familiar en .NET shops | No requerido; más pesado aquí |
| Logger first-party | Sin deps | Reinventar redact/rotación (descartado) |

**Elección:**

- Application / error logs → **Pino** (`nestjs-pino`, `pino-http`, `pino-roll`, `pino-pretty`)
- Audit events → **`AuditLogger`** (puerto de negocio; sink = Pino, `channel: "audit"`)
- Consola (pretty en develop) + archivo rotativo en `apps/api/logs/`

**No** Winston. **No** Sentry/OTEL/Datadog en esta fase.

---

## 4. Modelo de campos

### Comunes (opcionales salvo nota)

| Campo | Obligatorio | Notas |
|-------|-------------|-------|
| `timestamp` | sí | ISO-8601 |
| `level` | sí | `debug` \| `info` \| `warn` \| `error` \| `fatal` |
| `channel` | sí | `app` \| `audit` \| `error` |
| `service` | sí | `classtrack-api` / `classtrack-web` |
| `environment` | sí | `develop` \| `testing` \| `production` (`APP_ENV`) |
| `requestId` | cuando hay HTTP | `req_` + ulid/uuid corto |
| `correlationId` | si el FE lo envía | puede = requestId |
| `userId` / `actorUserId` | si hay identidad | desde `X-User-Id` |
| `module` | recomendado | clase Nest / archivo lógico |
| `action` | audit / algunos app | catálogo estable |
| `endpoint` | HTTP | ruta pattern si es posible |
| `httpMethod` | HTTP | |
| `statusCode` | HTTP fin / errores | |
| `durationMs` | request o external | |
| `errorCode` | errores | `CT_*` |
| `errorType` | errores | nombre de clase |
| `message` | sí | humano, corto, sin secretos |
| `metadata` | no | objeto ya redacted |

### Nested opcionales

- `external`: `{ service, operation, status, durationMs, retryCount? }`
- `db`: `{ operation, model?, durationMs, code? }` (sin SQL crudo con datos)
- `err`: `{ name, message, stack? }`

---

## 5. Niveles — política

Ver detalle operativo en `docs/logging-policy.md`. Resumen:

| Level | Cuándo | ¿Alerta futura? |
|-------|--------|-----------------|
| `debug` | Solo develop (y si `LOG_LEVEL=debug`) | No |
| `info` | Happy path relevante + audits | No |
| `warn` | Anomalía manejada (mail redirect, rate limit, slow query) | No |
| `error` | Operación no completada / unhandled | Sí (cuando haya deploy) |
| `fatal` | Proceso no puede continuar (boot DB, listen fail) | Sí |

Regla: si es `error` y nadie va a mirarlo, es `warn`.

---

## 6. Request / correlation ID

**Fuente única:** `pino-http` `genReqId` → `req.id` (+ `customProps.requestId` / `correlationId`).

```text
Browser                         API (pino-http)
   |                             |
   |  X-Request-Id? (opcional)   |
   |  X-Correlation-Id?          |
   |---------------------------->|
   |                     genReqId (única generación)
   |                     customProps.requestId = req.id
   |  X-Request-Id: req_...      |
   |<----------------------------|
```

- Exceptions / services leen el mismo `req.id` / bindings de nestjs-pino.
- No hay middleware ALS paralelo que regenere ids.
- Web (`requestJson`): puede enviar `X-Request-Id` / `X-Correlation-Id`.

OpenTelemetry: **fuera de alcance** hasta staging real (ver auditoría §8).

---

## 7. Componentes Nest (implementación posterior)

```text
apps/api/src/observability/
  types.ts              # contratos audit
  catalog.ts            # acciones audit + error codes
  redact.ts             # sanitización extra (audit metadata)
  pino.config.ts        # nestjs-pino / transports / redact / genReqId
  request-id.ts         # createRequestId (solo usado por genReqId)
  audit-logger.ts       # AuditLogger (negocio → Pino)
  all-exceptions.filter.ts
  observability.module.ts
```

Wire en `AppModule` + `main.ts` (`app.useLogger(app.get(Logger))`).

**Audit cableado:** ver `docs/audit-logger-pending.md` (pendiente de mutaciones de negocio).

### Exception filter (diseño)

| Nest / dominio | HTTP | errorCode (ej.) | Log channel |
|----------------|------|-----------------|-------------|
| ValidationPipe | 400 | `CT_VALIDATION` | app warn (bajo volumen) o métrica |
| Unauthorized | 401 | `CT_AUTH` | app warn + audit login fail |
| Forbidden | 403 | `CT_FORBIDDEN` | app warn |
| NotFound | 404 | `CT_NOT_FOUND` | app info/warn (sin stack) |
| Conflict | 409 | `CT_CONFLICT` | app warn |
| BadRequest negocio | 400 | `CT_BUSINESS` | app warn |
| Mailjet / fetch | 502/500 | `CT_EXTERNAL` | error + external |
| Prisma known | 409/404/500 | `CT_DB_*` | error + db |
| Unknown | 500 | `CT_UNEXPECTED` | error + stack server |

Body al cliente (prod): `{ statusCode, errorCode, message, requestId }` — **sin** stack.

---

## 8. Frontend (diseño)

| Pieza | Rol |
|-------|-----|
| `requestJson` | Adjuntar `X-Request-Id` / `X-Correlation-Id` |
| Error Boundary | Capturar render errors |
| Reporter opcional | `POST /api/client-errors` rate-limited (P2) |
| Login hints down | Mensaje UI (ya parcial) |

Canal FE: logs de browser **mínimos** en prod; preferir enviar eventos al API.

---

## 9. Persistencia de audit

**MVP:** mismo stdout, `channel: "audit"` (grepable / shippable a Loki después).  
**Luego (opcional):** tabla Prisma `AuditEvent` si se necesita UI de auditoría in-app.

No crear tabla en Fase 2–3 salvo decisión explícita.

---

## 10. Health

| Endpoint | Rol |
|----------|-----|
| `GET /api/health` | Liveness (proceso vivo) — ya existe |
| `GET /api/ready` | Readiness: Prisma `$queryRaw\`SELECT 1\`` |

Ready fail → no recibir tráfico (cuando haya orquestador).

---

## 11. Métricas (P2, selectivo)

Sin Prometheus todavía. Contadores in-memory opcionales:

- `http_requests_total{status}`
- `http_request_duration_ms` (histograma simple / log p95 periódico)
- `mailjet_send_total{result}`
- `db_slow_queries_total`

Exponer `/api/metrics` solo si `METRICS_ENABLED=1`.

---

## 12. Contrato TypeScript (Fase 2)

Ver `apps/api/src/observability/types.ts` y `catalog.ts`.  
La implementación de clases concretas es Fase 3+.

---

## 13. Criterios de aceptación del diseño

- [x] Canales `app` / `audit` / `error` separados
- [x] Campos y niveles definidos
- [x] Decisión de deps (**Pino / nestjs-pino**)
- [x] RequestId flow FE↔API
- [x] Mapa de errores → codes
- [x] Policy de redacción en `logging-policy.md`
- [x] Fase 3: excepciones + request id + redaction
- [x] Application logs = **Pino / nestjs-pino** (AppLogger eliminado)
- [x] Audit = `AuditLogger` (canal `audit`, sink Pino)
- [x] Persistencia + rotación = `pino-roll` → `apps/api/logs/`
- [ ] Fases 4+ (FE ids, audit mutaciones, ready, métricas)

---

## 14. Orden de implementación sugerido

1. types + redact + Pino + AuditLogger + ALS  
2. RequestId middleware + exception filter  
3. MailService + Auth login/register  
4. Interceptor HTTP duration  
5. Audit en mutaciones P1  
6. `/ready` + tests de observabilidad  
7. FE request ids + error boundary  
