# Política de logging — ClassTrack

**Versión:** 1.1 (Pino)  
**Aplica a:** `apps/api` (obligatorio) y `apps/web` (correlación / errores)  
**Complementa:** `docs/observability-architecture.md`

---

## 1. Principios

1. **Application logging** = **Pino** vía `nestjs-pino`. No logger técnico propio (`AppLogger` eliminado). No Winston.
2. **Audit events** = `AuditLogger` (semántica de negocio). El sink es Pino, pero el puerto es distinto.
3. Separar **app** vs **audit** vs **error** (`channel`).
4. Logs **estructurados** (JSON; `pino-pretty` solo en consola develop).
5. **Nunca** registrar secretos ni passwords (redact de Pino + `redactSensitive` en audit metadata).
6. Si nadie lo va a usar en un incidente, **no lo logues**.
7. `ERROR` implica “algo falló de verdad”; no uses ERROR para 404 esperados.

---

## 2. Persistencia en archivo (pino-roll)

Arquitectura:

```text
NestJS → Pino (nestjs-pino) → pino-roll → apps/api/logs/classtrack-api*.jsonl
                 ↘ consola (pretty en develop / JSON si no)
```

Por defecto el sink de archivo está activo. Desactivar con `LOG_TO_FILE=0`.

### Residuos del logger casero anterior

Si existe un archivo exacto `classtrack-api.jsonl` con campos estilo `"level":"info"` + `"message"` (no el formato Pino `level` numérico + `msg` + `time`), es **histórico del AppLogger** eliminado. Renombrarlo a `legacy-homegrown-app-logger.jsonl` (o borrarlo). No usarlo como sink activo. La carpeta `apps/api/logs/` ya está en `.gitignore`.

### Cómo ver errores de BD (Pino)

```powershell
Get-ChildItem .\apps\api\logs\classtrack-api*.jsonl | Sort-Object LastWriteTime -Descending
Get-Content .\apps\api\logs\classtrack-api*.jsonl -Tail 50
Select-String -Path .\apps\api\logs\classtrack-api*.jsonl -Pattern '"level":50|CT_DB|Prisma'
```

Rotación: `pino-roll` (`LOG_FILE_MAX_SIZE`, `LOG_FILE_MAX_FILES`).

---

## 3. Niveles

### DEBUG

- Solo con `LOG_LEVEL=debug` y preferentemente `APP_ENV=develop`.
- Ejemplos: rama interna de validación, payload ya **redacted**, decisión de redirect de mail.
- **Prohibido** en production por default (`LOG_LEVEL=info`).

### INFO

Eventos normales relevantes:

- App arrancó (env, port, `mailConfigured: true|false` sin keys).
- Request HTTP completada (vía interceptor: method, route, status, duration) — opcional sampleo si hay ruido.
- Integración externa OK (Mailjet send success + duration).
- Mutación de negocio exitosa puede ir como **audit** en lugar de app info duplicado.

### WARN

Anomalías manejadas:

- Mailjet no configurado (modo copy-link).
- Mail redirect en non-prod.
- Rate limit (429).
- Query Prisma > umbral (ej. 500 ms).
- Login fallido (también audit `USER_LOGIN_FAILED`).
- Upload rechazado por mime/tamaño.

### ERROR

La operación no se completó:

- Unhandled exception.
- Mailjet HTTP error / network error.
- Error de DB no mapeado a 4xx de negocio.
- Fallo de filesystem en uploads.

Incluir: `requestId`, `errorCode`, `errorType`, `message`, `err.stack` **solo en log servidor**.

### FATAL

Solo boot / proceso:

- No se puede abrir SQLite / Prisma al iniciar readiness crítico.
- No se puede bindear el puerto.

En Nest: log fatal + `process.exit(1)` solo si el proceso no es usable.

---

## 4. Qué NUNCA loguear

| Dato | Acción |
|------|--------|
| `password`, `passwordConfirmation` | strip |
| `MAILJET_API_KEY`, `MAILJET_API_SECRET` | strip |
| Headers `Authorization`, cookies | strip |
| Invite **token** completo | mask (`inv_…****`) o solo “tokenPresent” |
| JWT (si existiera) | strip |
| Cuerpos completos de `/auth/login` o `/auth/register` | no loguear body |
| HTML completo de notas/fichas | no; solo ids |
| Números de tarjeta / secretos genéricos | N/A hoy; política preventiva |
| Listas enormes de emails en redirect | truncar (ej. primeros 3 + `+N`) |

### Redacción

Antes de emitir cualquier evento, pasar `metadata` / `err.message` por `redactSensitive()`:

- Keys case-insensitive matching: `password`, `secret`, `token`, `apiKey`, `authorization`, …
- Valores: reemplazo `[REDACTED]`.

---

## 5. Qué SÍ incluir cuando exista

- `requestId` en todo log durante una request HTTP.
- `userId` / `actorUserId` si hay `X-User-Id` válido.
- `module` (nombre del service).
- Para externos: `external.service`, `operation`, `durationMs`, `status`.
- Para errores: `errorCode` estable (`CT_*`).

---

## 6. Application vs Audit vs Error (ejemplos ClassTrack)

| Situación | Canal | Level | Acción / mensaje |
|-----------|--------|-------|------------------|
| Pedido… (N/A) / Nota creada | **audit** | info | `NOTE_CREATED` |
| Mailjet respondió 200 | **app** | info | mail send ok + duration |
| Mailjet 401 | **error** | error | `CT_EXTERNAL` + status |
| Usuario login OK | **audit** | info | `USER_LOGIN` |
| Password incorrecta | **audit** + **app** | info/warn | `USER_LOGIN_FAILED` (sin password) |
| POST /notes 500 inesperado | **error** | error | `CT_UNEXPECTED` + stack server |
| GET grupo 404 | **app** | info o warn | sin stack; no audit |

Regla práctica: **audit = verbo de negocio en pasado + actor + recurso**.  
**app = motor técnico**.  
**error = fallo**.

---

## 6. Comportamiento por entorno (`APP_ENV`)

| | develop | testing | production |
|--|---------|---------|------------|
| Formato | pretty (default) o JSON si `LOG_FORMAT=json` | JSON | JSON |
| Level default | `debug` o `info` | `info` | `info` |
| Stack en log | sí | sí | sí (servidor) |
| Stack en HTTP body | sí (Nest-like OK) | no | **no** |
| login-hints | permitido | deshabilitar | deshabilitar |
| Mail redirect log | warn + intended truncado | igual | N/A (no redirect) |
| Sample access log | todas las requests | todas | todas o sample si volumen |

---

## 7. Catálogo mínimo de acciones audit

Definido en código: `apps/api/src/observability/catalog.ts`.

- `USER_LOGIN` / `USER_LOGIN_FAILED` / `USER_REGISTER`
- `INVITE_CREATED` / `EMAIL_BROADCAST`
- `ATTENDANCE_MARKED`
- `GRADE_UPSERT`
- `SHEET_SUBMITTED` / `SHEET_APPROVED` / `SHEET_CHANGES_REQUESTED`
- `NOTE_CREATED` / `NOTE_UPDATED` / `NOTE_DELETED` / `NOTE_ATTACHMENT_ADDED` / `NOTE_ATTACHMENT_DELETED`
- `MEMBER_ADDED` / `MEMBER_REMOVED`
- `GROUP_LINKS_UPDATED` / `GROUP_TUTOR_UPDATED` / `GROUP_SPRINT_STATUS_UPDATED`
- `SCHEDULE_SESSION_CREATED` / `UPDATED` / `DELETED`

Outcome: `success` \| `failure`.

---

## 8. Códigos de error internos

Prefijo `CT_`:

| Código | Uso |
|--------|-----|
| `CT_VALIDATION` | DTO / ValidationPipe |
| `CT_AUTH` | No autenticado / credenciales |
| `CT_FORBIDDEN` | Rol insuficiente |
| `CT_NOT_FOUND` | Recurso inexistente |
| `CT_CONFLICT` | Uniqueness / estado conflictivo |
| `CT_BUSINESS` | Regla de negocio (BadRequest) |
| `CT_DB` | Error Prisma genérico |
| `CT_DB_UNIQUE` | P2002 |
| `CT_EXTERNAL` | Mailjet u otro HTTP externo |
| `CT_UNEXPECTED` | No clasificado |

---

## 9. Prohibiciones de código

```ts
// ❌
console.log('user', user)
console.error(err)
this.logger.log(JSON.stringify(req.body)) // Nest Logger ad-hoc con body

// ✅
this.appLogger.info('Sheet approved', { module: 'SprintSheetsService', ... })
this.auditLogger.record({ action: 'SHEET_APPROVED', ... })
```

Excepción: solo diagnóstico local puntual; preferí `PinoLogger` / Nest `Logger` de `nestjs-pino`.

---

## 10. Retención y acceso (futuro deploy)

- Hoy: stdout del proceso Nest (terminal / process manager).
- Luego: ship JSON lines a un store; acceso restringido (emails de alumnos = PII).
- No pegar logs crudos en tickets públicos sin redacción.

---

## 11. Checklist de revisión de PR

- [ ] ¿Este log aporta a un incidente?
- [ ] ¿Canal correcto (app/audit/error)?
- [ ] ¿Level correcto?
- [ ] ¿Sin password/secret/token/body crudo?
- [ ] ¿Trae `requestId` en request path?
- [ ] ¿Audit solo en mutación relevante?
