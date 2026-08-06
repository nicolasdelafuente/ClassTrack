# API — MVP (borrador)

API HTTP JSON. Solo lo necesario para las pantallas A–E.

Base sugerida: `/api`

## Primer vertical (tablero) — implementar primero

### Cursada actual
`GET /api/courses/current`  
→ `{ id, name, code }`

### Tablero de grupos
`GET /api/courses/:courseId/groups`  
→ lista de grupos con semáforo resumido:

```json
[
  {
    "id": "...",
    "number": 3,
    "name": "Grupo 3",
    "projectTopic": "App de acompañamiento",
    "teacherName": "Nico",
    "sprints": [
      { "sprintNumber": 1, "status": "ok" },
      { "sprintNumber": 2, "status": "ok" },
      { "sprintNumber": 3, "status": "unknown" }
    ]
  }
]
```

### Detalle de grupo
`GET /api/groups/:groupId`  
→ grupo + integrantes + links + sprints

### Actualizar un sprint
`PATCH /api/groups/:groupId/sprints/:sprintNumber`  
body: `{ "status": "attention" }`

### Actualizar links
`PATCH /api/groups/:groupId/links`  
body: `{ "githubUrl": "...", "trelloUrl": "...", "driveUrl": "..." }`

---

## Vertical asistencia (después)

### Asistencia por fecha
`GET /api/courses/:courseId/attendance?date=YYYY-MM-DD`  
→ alumnos (+ grupo) y marcas del día

### Upsert marca
`PUT /api/courses/:courseId/attendance`  
body: `{ "studentId", "date", "present", "participated" }`

### Asistencia filtrada por grupo
`GET /api/groups/:groupId/attendance?date=YYYY-MM-DD`

---

## Auth (MVP)

Sin auth real al inicio (app docente local/demo).  
Más adelante: login docente simple. No bloquear el esqueleto por esto.

## Fuera de la API MVP

- Webhooks GitHub/Trello
- Import continuo del Excel
- Endpoints de alumnos / notas / PPS
