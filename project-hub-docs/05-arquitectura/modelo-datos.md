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

## Seed (demo)

Fuente: `DesAPP-PPS 2026-c1- Asistencia.xlsx` (solo import inicial).

Prioridad de seed para el primer vertical:
1. course  
2. groups + teacher + topic + sprint statuses  
3. students + memberships + links  
4. attendance (puede esperar al vertical de asistencia)

## Nota sobre sincronización

No hay tablas de sync en el MVP. Ver fase 2 más adelante (`sincronizacion.md` cuando exista).
