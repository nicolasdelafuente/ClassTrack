# AuditLogger — cableado pendiente

`AuditLogger` **se mantiene**: es el mecanismo de **auditoría de negocio** (quién hizo qué sobre qué recurso). El sink es Pino (`channel: "audit"`), no un logger técnico paralelo.

## Estado actual

- Clase y catálogo (`AUDIT_ACTIONS`) listos.
- **Ningún service llama aún** a `AuditLogger.record(...)`.
- Logging técnico (requests, excepciones, DB, mail Nest Logger) → **Pino / nestjs-pino**.

## Operaciones que SÍ deberían auditarse (prioridad)

| Acción | Cuándo |
|--------|--------|
| `USER_LOGIN` / `USER_LOGIN_FAILED` | Login |
| `USER_REGISTER` | Alta vía invite |
| `INVITE_CREATED` | Invitaciones |
| `EMAIL_BROADCAST` | Mail masivo del curso |
| `ATTENDANCE_MARKED` | Marcar asistencia |
| `GRADE_UPSERT` | Cargar / editar nota |
| `SHEET_SUBMITTED` / `SHEET_APPROVED` / `SHEET_CHANGES_REQUESTED` | Flujo de fichas |
| `NOTE_CREATED` / `NOTE_UPDATED` / `NOTE_DELETED` | Notas de seguimiento |
| `NOTE_ATTACHMENT_*` | Adjuntos |
| `MEMBER_ADDED` / `MEMBER_REMOVED` | Miembros de grupo |
| `GROUP_LINKS_UPDATED` / `GROUP_TUTOR_UPDATED` / `GROUP_SPRINT_STATUS_UPDATED` | Config de grupo |
| `SCHEDULE_SESSION_*` | Alta/edición/baja de clases |

## Qué no auditar

- GET / listados / health
- Cada keystroke o autosave trivial
- Errores técnicos (van al canal `error` de Pino)

## Pendiente (siguiente fase, sin bloquear Pino)

Cablear `AuditLogger` solo en las mutaciones de la tabla de arriba, empezando por login, fichas, notas y asistencia.
