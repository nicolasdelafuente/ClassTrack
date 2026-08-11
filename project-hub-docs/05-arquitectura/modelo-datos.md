# Modelo de datos — MVP

Traducción práctica de [entidades.md](./entidades.md) para implementar.

## Enfoque recomendado (MVP)

Para el **primer vertical** (tablero de grupos) se puede empezar así:

1. **Frontend + datos demo en JSON/memoria** (seed desde el Excel), o  
2. **Backend mínimo + SQLite/Postgres** con las tablas de abajo.

Elegimos stack concreto al armar el esqueleto. El modelo conceptual no cambia.

## Tablas / colecciones

### `courses`
- `id` (pk)
- `name` (text)
- `code` (text, unique opcional)
- `is_current` (boolean)

### `groups`
- `id` (pk)
- `course_id` (fk → courses)
- `number` (int)
- `name` (text, nullable)
- `project_topic` (text, nullable)
- `teacher_name` (text, nullable)

### `students`
- `id` (pk)
- `legajo` (text)
- `full_name` (text)
- `email` (text, nullable)

### `memberships`
- `id` (pk)
- `group_id` (fk → groups)
- `student_id` (fk → students)
- unique (`group_id`, `student_id`)

### `sprint_statuses`
- `id` (pk)
- `group_id` (fk → groups)
- `sprint_number` (int, 1–5)
- `status` (enum/text: `unknown` | `ok` | `attention` | `critical`)
- unique (`group_id`, `sprint_number`)

### `group_links`
- `group_id` (pk/fk → groups)
- `github_url` (text, nullable)
- `trello_url` (text, nullable)
- `drive_url` (text, nullable)

### `attendance_records`
- `id` (pk)
- `course_id` (fk → courses)
- `student_id` (fk → students)
- `date` (date)
- `present` (boolean)
- `participated` (boolean)
- unique (`course_id`, `student_id`, `date`)

### `sent_emails` (CT-080)
Registro de emails salientes (invitaciones + broadcast).
- `id` (pk)
- `course_id` (fk → courses, nullable)
- `category` (`invite` | `sprint` | `other`)
- `subject` (text)
- `body_html` (text) — cuerpo enviado / would-send
- `body_text` (text, nullable)
- `sent_by_user_id` (fk → users, nullable)
- `recipients_json` (JSON array de emails)
- `recipient_count` (int)
- `emailed` (boolean) — si Mailjet aceptó el envío
- `reason` (text, nullable) — fallo / no configurado
- `redirected` (boolean)
- `created_at` (datetime)

## Seed (demo)

Fuente original: `DesAPP-PPS 2026-c1- Asistencia.xlsx` (solo import local, no versionar).

En el repo: `apps/api/prisma/data/demo.json` (datos anonimizados). Schema SQLite + seed: CT-010.

Prioridad de seed para el primer vertical:
1. course  
2. groups + teacher + topic + sprint statuses  
3. students + memberships + links  
4. attendance (puede esperar al vertical de asistencia)

## Nota sobre sincronización

No hay tablas de sync en el MVP. Ver fase 2 más adelante (`sincronizacion.md` cuando exista).
