# Auditoría de observabilidad — ClassTrack

**Fecha:** 2026-08-11  
**Alcance:** monorepo `apps/api` (NestJS + Prisma) + `apps/web` (React + Vite)  
**Fase:** 1 — auditoría (completada) · Fase 2 — diseño en `observability-architecture.md` + `logging-policy.md`  
**Skill de referencia:** `.agents/skills/production-monitoring` (instalada desde vstorm-co/production-stack-skills)

---

## 1. Estado actual

### 1.1 Stack

| Capa | Tecnología |
|------|------------|
| API | NestJS 11, TypeScript, Express |
| DB | Prisma 6 + **SQLite** local (`file:./dev.db`) |
| Auth MVP | Header `X-User-Id` (sin JWT/sesiones server-side) |
| Mail | Mailjet HTTP API (`fetch`) |
| Web | React 19 + Vite + TypeScript + Tailwind v4 |
| Monorepo | npm workspaces (`apps/api`, `apps/web`) |
| Docker | **No** hay Dockerfile / compose |
| CI/CD | **No** hay workflows en `.github/` |
| Cache / queues / cron | **No** |

### 1.2 Entry points

- **API:** `apps/api/src/main.ts` — Helmet, CORS, `ValidationPipe` global, prefijo `/api`, static uploads, `dotenv` reciente para `.env`.
- **Web:** `apps/web/src/main.tsx` → `App.tsx` (React Router).

### 1.3 Módulos / controllers (API)

| Módulo | Controller | Dominio |
|--------|------------|---------|
| App | `AppController` | `/`, `/health` |
| Auth | `AuthController` | login, register, invites preview, login-hints |
| Courses | `CoursesController` | board, structure, invites, broadcast email, enrollment |
| Groups | `GroupsController` | detalle, sprints, links, tutor, members |
| Attendance | `AttendanceController` | lista / marcar |
| CourseStudents | `CourseStudentsController` | perfil alumno en cursada |
| Schedule | `ScheduleController` | cronograma / sesiones / ítems / policy |
| Me | `MeController` | perfil alumno, join/leave grupo, sheets propias |
| SprintSheets | `SprintSheetsController` | fichas inicio/fin, approve, comments |
| Grades | `GradesController` | notas parciales / finales |
| GroupNotes | `GroupNotesController` | notas de seguimiento + attachments |

### 1.4 Logging hoy

| Mecanismo | Dónde | Formato |
|-----------|--------|--------|
| `Nest Logger` | casi solo `MailService` | texto libre (warn/error) |
| `console.log` | `main.ts` (listen) | texto |
| Access log HTTP | **no** | — |
| Structured JSON | **no** | — |
| requestId / correlationId | **no** | — |
| Audit trail (acciones de usuario) | **no** | — |
| Metrics / OTEL / Sentry | **no** | — |

Frontend: **cero** `console.log/error` en `apps/web/src`. Los errores se muestran en UI (`InlineStatus`, `Text critical`, toasts) sin telemetría.

### 1.5 Manejo de excepciones hoy

- Nest **default** exception filter (sin `ExceptionFilter` custom).
- Errores de dominio vía `BadRequestException`, `NotFoundException`, `UnauthorizedException`, `ForbiddenException`, `ConflictException`.
- `ValidationPipe`: `whitelist`, `forbidNonWhitelisted`, `transform`.
- **No** hay códigos internos de error (`CT_AUTH_001`, etc.).
- Stack traces: Nest puede devolver detalle en desarrollo; **no** hay política explícita de ocultarlos en producción.

### 1.6 Auth / autorización

- Login/register en `AuthService` (passwords en **texto plano** en DB — MVP demo).
- Identidad en requests: `X-User-Id` seteado por el cliente (`setApiUserId`).
- Checks ad-hoc en services (`requireTeacher`, `requireStudent`, etc.).
- **No** hay `AuthGuard` / roles guard reutilizable.
- `GET /auth/login-hints` expone emails + password compartida `demo123` (solo pensado para local).

### 1.7 Integraciones externas

| Servicio | Archivo | Observabilidad |
|----------|---------|----------------|
| Mailjet | `mail/mail.service.ts` | `logger.warn` (redirect / no config), `logger.error` (HTTP fail) — **sin** duration, **sin** requestId, **sin** éxito INFO estructurado |

### 1.8 Uploads / archivos

- Notas: `group-notes/upload-storage.ts` + static `/api/uploads/group-notes`.
- Validación mime/tamaño con `BadRequestException`.
- **Sin** log de upload exitoso / fallido / tamaño / autor (más allá de filas en DB).

### 1.9 Base de datos

- Prisma client sin middleware de logging.
- Sin métricas de query lenta / timeout.
- Errores Prisma suelen burbujear como 500 genéricos si no se mapean.

### 1.10 Health

```text
GET /api/health → { status, service, timestamp }
```

- **No** chequea DB (readiness).
- **No** hay `/ready` separado.

### 1.11 Frontend — errores

- `requestJson` lanza `Error` con mensaje parseado del body Nest.
- Cada página hace `try/catch` local → estado de UI.
- **No** hay Error Boundary de React.
- **No** hay `window.onerror` / `unhandledrejection`.
- **No** se envían errores al backend.

### 1.12 Infra

- Variables relevantes: `APP_ENV`, `MAILJET_*`, `MAIL_REDIRECT_TO`, `WEB_APP_URL`, `DATABASE_URL`, `VITE_API_URL`.
- Sin Docker / Prometheus / Loki / CI observability gates.

---

## 2. Problemas encontrados

1. **No se puede reconstruir una operación end-to-end** (falta requestId + correlación FE→API→Mailjet→DB).
2. **Casi no hay application logs** fuera de Mailjet → incidentes = “caja negra”.
3. **No hay audit log** (quién borró nota, cambió asistencia, aprobó ficha, invitó, etc.).
4. **Auth débil + sin auditoría de login** (éxito/fallo).
5. **login-hints** y passwords en claro: riesgo alto si se loguea body o se deja expuesto fuera de develop.
6. **Health superficial**: “ok” aunque la DB esté rota.
7. **Errores Prisma / 500** sin contexto estructurado (userId, endpoint, duración).
8. **Mailjet**: fallos se loguean como string; éxitos casi silenciosos; destinatarios intended aparecen en warn (PII).
9. **Throttler** activo pero sin métrica/log de rate-limit hits.
10. **Frontend** traga fallos de red/API sin telemetría central.
11. **Sin separación** application log vs audit vs error log (concepto aún no existe en código).
12. **Dependencia de skill OTEL/Prometheus**: útil a futuro, pero **sobrepeso** para MVP SQLite local — priorizar logging estructurado + requestId primero.

---

## 3. Lugares donde faltan logs

### Application / INFO

- Bootstrap completo (env, port, mail configured yes/no **sin secretos**).
- Login éxito / fallo (sin password).
- Create/update/delete: grupos, miembros, notas, attachments, schedule sessions, grades, sheets submit/approve.
- Broadcast email / invite: resultado `emailed`, redirect, count.

### WARN

- Mailjet no configurado (ya existe, mejorar estructura).
- Redirect de mail en non-prod (ya existe; redactar lista completa de intended si es larga).
- Rate limit 429.
- Upload rechazado (mime/size).

### ERROR

- Excepciones no controladas (filter global).
- Mailjet HTTP ≠ 2xx (mejorar con status + duration + operation).
- Prisma known errors (P2002 unique, P2025 not found, etc.).
- Fallos de filesystem en uploads.

### Audit (separado)

| Acción | Actor | Recurso |
|--------|-------|---------|
| `USER_LOGIN` / `USER_LOGIN_FAILED` | email/userId | auth |
| `USER_REGISTER` | userId | auth |
| `INVITE_CREATED` | teacherId | invite |
| `EMAIL_BROADCAST` | teacherId | course |
| `ATTENDANCE_MARKED` | teacherId | session+student |
| `GRADE_UPSERT` | teacherId | student |
| `SHEET_SUBMITTED` / `SHEET_APPROVED` / `SHEET_CHANGES_REQUESTED` | userId | sheet |
| `NOTE_CREATED` / `NOTE_UPDATED` / `NOTE_DELETED` | teacherId | note |
| `MEMBER_ADDED` / `MEMBER_REMOVED` | teacherId | group |
| `GROUP_LINKS_UPDATED` | userId | group |
| `SCHEDULE_SESSION_*` | teacherId | session |

---

## 4. Logs existentes que deberían reemplazarse

| Ubicación | Actual | Destino |
|-----------|--------|---------|
| `main.ts` `console.log(listening…)` | texto | `appLogger.info` bootstrap |
| `MailService` `logger.warn/error` strings | Nest Logger no JSON | structured `external.mailjet.*` + redact |
| (futuro) cualquier `console.*` nuevo | — | prohibido en policy |

Pocos `console.*` hoy → **buena base** (no hay deuda masiva de debug prints).

---

## 5. Errores que actualmente se pierden

- 4xx/5xx **sin log server-side** (solo response al cliente).
- Fallos de `fetch` en el browser (red/CORS/API down) → solo UI; el caso “login de testing desapareció” es ejemplo real.
- Prisma unhandled → 500 genérico, sin requestId en logs.
- Upload parcial / disco lleno: poco contexto.
- Mailjet success path: no deja rastro operable (MessageID de Mailjet no se guarda/loguea).
- Validación DTO: Nest responde 400; **no** se loguea (correcto no spamear; pero métrica `validation_errors_total` sí aportaría).

---

## 6. Operaciones críticas sin auditoría

- Login / register / uso de invite token.
- Invitar alumno / broadcast mail.
- Marcar asistencia / notas finales.
- Aprobar / pedir cambios en fichas de sprint.
- CRUD notas + borrar fotos.
- Sacar/agregar integrante; cambiar tutor; links del grupo.
- Duplicar cursada / estructura de grupos.
- Cambiar email de alumno (`StudentEmailEditor` / `/me/profile`).

Ninguna deja un evento `AUDIT` consultable.

---

## 7. Información sensible que podría terminar en logs

| Dato | Riesgo |
|------|--------|
| Passwords (plaintext en DB + login body) | **Crítico** si se loguea request body |
| `MAILJET_API_KEY` / `SECRET` | Crítico |
| Invite tokens en URL | Alto |
| `X-User-Id` | Medio (identificador) |
| Emails de alumnos (roster, redirect intended list) | PII — loguear con cuidado / masking |
| Contenido de notas / fichas (HTML) | Puede incluir datos personales |
| Paths de uploads / nombres originales | Bajo–medio |
| `login-hints` password `demo123` | No debe loguearse ni ir a prod |

**Política futura (documento `logging-policy.md` en fase posterior):** never log passwords, secrets, full bodies, raw Authorization; mask emails cuando no sean necesarios.

---

## 8. Propuesta de arquitectura

Separación explícita (como pediste):

```text
┌─────────────────────────────────────────────────────────┐
│  HTTP request                                           │
│  + requestId (generado o tomado de X-Request-Id)         │
│  + correlationId (mismo o del frontend)                 │
└───────────────┬─────────────────────────────────────────┘
                │
     ┌──────────▼──────────┐
     │  RequestContext     │  AsyncLocalStorage / Nest CLS
     │  userId, route, …   │
     └──────────┬──────────┘
                │
      ┌─────────┼─────────┬──────────────────┐
      ▼         ▼         ▼                  ▼
 Application  Audit    Error log         Metrics
   logs       events   (+ stack)         (counters)
      │         │         │                  │
      └──── JSON lines / stdout ─────────────┘
                │
         (luego) collector opcional
         Loki / Axiom / CloudWatch
```

### Capas recomendadas (Nest)

1. **`ObservabilityModule`**
   - **Pino / nestjs-pino** — logger técnico (consola + `pino-roll`).
   - `AuditLogger` (canal `audit`; sink Pino). Ver `docs/audit-logger-pending.md`.
   - Redaction (Pino `redact` + helper para metadata de audit).
2. **`genReqId` (pino-http)** — única fuente de `requestId` / header `X-Request-Id`.
3. **`AllExceptionsFilter`** — mapear excepciones → status + `errorCode` + log ERROR/WARN + body seguro.
4. **Prisma middleware / `$extends`** — log WARN queries > N ms; ERROR en fallos (sin params sensibles).
5. **MailService** — `external` span-like log: service, operation, durationMs, status.
6. **Audit calls** en services de mutación (no en cada GET) — **pendiente**.

### Frontend

1. Generar `X-Request-Id` / `X-Correlation-Id` en `requestJson`.
2. Error Boundary + reporter opcional `POST /api/client-errors` (rate-limited, solo prod/testing).
3. No flood de DEBUG en browser.

### Qué **no** meter ahora

- Stack completo ELK/Datadog.
- OpenTelemetry completo (skill lo documenta; **fase 2+** si hay staging real).
- Prometheus scraping hasta tener deploy.

**Justificación:** ClassTrack es MVP educativo, SQLite local, un solo proceso Node. El 80% del valor está en **logs estructurados + requestId + audit + exception filter + health con DB**. OTEL/Prometheus cuando exista entorno desplegado.

### Niveles (política)

| Level | Uso ClassTrack |
|-------|----------------|
| DEBUG | Solo develop: DTOs sanitizados, ramas internas |
| INFO | Bootstrap, mutaciones exitosas (app log), mail OK |
| WARN | Redirect mail, rate limit, config incompleta, query lenta |
| ERROR | Operación fallida, Mailjet fail, unhandled, DB error |
| FATAL | Opcional: fallo al boot (no escuchar puerto / no DB) |

---

## 9. Plan de implementación priorizado

### P0 — Fundación (siguiente fase, sin features de negocio)

1. Documento `logging-policy.md` + `observability-architecture.md`.
2. **Pino / nestjs-pino** (JSON; pretty en develop; archivo vía `pino-roll`).
3. `genReqId` + `customProps` (`requestId` / `correlationId`).
4. `AllExceptionsFilter` (sin stack al cliente fuera de develop; Prisma known/init/unknown/validation/panic).
5. Instrumentar `MailService` + login/register (INFO/WARN/ERROR + audit login).
6. Health: `/health` liveness + `/ready` con `SELECT 1` Prisma.
7. Frontend: propagar `X-Request-Id`; mensaje si API cae (parcialmente ya en LoginPage).

### P1 — Audit de mutaciones críticas

8. Audit helpers en: attendance, grades, sheets approve/submit, notes CRUD, invites, members, schedule delete.
9. Tests: redaction, no stack en prod body, requestId en log, audit en login.

### P2 — DB + métricas mínimas

10. Prisma slow query warn.
11. Contadores in-process (requests, 5xx, mail fail) expuestos en `/metrics` **solo si** se despliega; si no, log periódico opcional.
12. Client error endpoint opcional.

### P3 — Tracing externo (opcional)

13. OpenTelemetry Node SDK si hay staging; dashboards según skill `production-monitoring`.

---

## 10. Inventario rápido `console.*` / Logger

### API

| Archivo | Qué |
|---------|-----|
| `apps/api/src/main.ts` | `console.log` listen |
| `apps/api/src/mail/mail.service.ts` | `Logger.warn` / `Logger.error` |

### Web

| — | Ningún `console.*` en `src/` |

### try/catch

- Abundantes en pages/organisms web (UI only).
- API: pocos try/catch; se prefieren excepciones Nest.

---

## 11. Decisiones abiertas (documentar antes de codear)

1. **¿pino vs Nest Logger + interceptor JSON?**  
   **Decidido:** **Pino + nestjs-pino** (+ `pino-roll` / `pino-pretty`). No Winston. No logger técnico propio.
2. **¿Dónde persistir audit?**  
   MVP: stdout JSON `type:"audit"` (mismo stream). Luego tabla `AuditEvent` en Prisma si hace falta consulta in-app.
3. **¿login-hints en testing/prod?**  
   Debe apagarse fuera de `APP_ENV=develop`.
4. **¿Passwords plaintext?**  
   Fuera del alcance de observabilidad, pero la policy de logs debe asumir que **nunca** se serializa el body de `/auth/login`.

---

## 12. Criterio de éxito (post-implementación)

Poder responder con un `requestId`:

- qué endpoint
- qué userId
- duración
- si fue ERROR/WARN/INFO/AUDIT
- si Mailjet participó y cuánto tardó
- sin passwords ni API keys en el stream

---

## Próximo paso

**No implementar todavía** hasta tu OK explícito para FASE 2+.

Cuando indiques, el orden será: policy + architecture docs → logger + requestId + exception filter → Mail + auth audit → mutaciones P1 → tests.
