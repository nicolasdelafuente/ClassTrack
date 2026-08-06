# Entidades — MVP

Modelo conceptual simple. Nombres en inglés en código; acá los explicamos en español.

## Diagrama (texto)

```text
Course (Cursada)
   │
   ├── has many → Group
   │                 │
   │                 ├── has many → Membership → Student
   │                 ├── has many → SprintStatus (S1…S5)
   │                 └── has one  → GroupLinks (urls)
   │
   ├── has many → Teacher (o referencia simple por nombre)
   │
   └── has many → AttendanceRecord
                      │
                      ├── belongs to Student
                      └── fecha + asistencia + participación
```

## Entidades

### Course (Cursada)
Un cuatrimestre de la materia.  
Ejemplo: `DesApp 2026-c1`.

| Campo | Idea |
|-------|------|
| id | identificador |
| name | nombre visible |
| code | opcional, ej. `2026-c1` |
| isCurrent | si es la cursada “activa” en Home |

### Teacher (Docente)
En MVP puede ser solo un **nombre** en el grupo (`teacherName`).  
Si hace falta entidad aparte: id + name. Sin login complejo todavía.

### Group (Grupo)
Equipo de la cursada.

| Campo | Idea |
|-------|------|
| id | |
| courseId | cursada |
| number | 1…10 |
| name | opcional (“Grupo 3”) |
| projectTopic | tema del TP |
| teacherName | docente a cargo |

### Student (Alumno)
| Campo | Idea |
|-------|------|
| id | |
| legajo | |
| fullName | |
| email | |

### Membership
Une alumno ↔ grupo (un alumno en un grupo por cursada, en el MVP).

| Campo | Idea |
|-------|------|
| groupId | |
| studentId | |

### SprintStatus
Estado manual de un sprint para un grupo.

| Campo | Idea |
|-------|------|
| groupId | |
| sprintNumber | 1…5 |
| status | `unknown` \| `ok` \| `attention` \| `critical` |

### GroupLinks
URLs manuales (sin sync).

| Campo | Idea |
|-------|------|
| groupId | |
| githubUrl | |
| trelloUrl | |
| driveUrl | |

### AttendanceRecord
Marca de un alumno en una fecha.

| Campo | Idea |
|-------|------|
| courseId | |
| studentId | |
| date | día del encuentro |
| present | sí/no |
| participated | sí/no |

## Fuera del modelo MVP

- Sync con APIs externas
- Notas / actas
- Usuarios con roles y auth completa
- Historial de cambios / auditoría
