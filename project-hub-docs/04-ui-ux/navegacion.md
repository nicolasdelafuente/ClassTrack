# Navegación — ClassTrack

## Idea general

Pocas pantallas, caminos cortos. El docente casi siempre aterriza en el **tablero de grupos**.

## Flujo feliz

```text
Abrir app
   → Home detecta cursada actual (ej. DesApp 2026-c1)
   → Tablero de grupos
   → Tocá un grupo
   → Detalle (estado + gente + links)
   → (opcional) “Tomar asistencia” → Asistencia del grupo/día
```

Tiempo objetivo: **menos de 1 minuto** hasta entender el estado de los grupos.

## Chrome docente (CT-053 / CT-061)

Separar **navegación global** de **acciones contextuales**.

### Sidebar (módulos)

Rail en desktop (íconos, se expande al hover) y menú drawer en mobile:

- Cronograma
- Tablero de grupos
- Fichas de sprint
- Notas y calificaciones
- Configuración → Invitar, Duplicar cursada

Los módulos top-level del sidebar **no** llevan `← Tablero` en el header.

### Acciones en la página

Viven en el `PageHero` (1–2 primarias; el resto en **Más acciones** / CT-067), no en el sidebar.

Ejemplos: Tomar asistencia, Escribir mail, Armar grupos (enlace cerca del meta).

### Back contextual

Solo cuando hay jerarquía hijo → padre:

- Clase del cronograma → Cronograma
- Detalle de ficha → Cola de fichas
- Detalle de grupo → Tablero
- Ficha alumno → Inicio alumno

## Navegación en celular

- **Header corto:** nombre de la cursada + menú (hamburger) o back contextual.
- **Tablero** sigue siendo la home efectiva del docente.
- Desde un grupo: CTA clara a *Asistencia* y links externos (GitHub/Trello) bajo Más acciones.
- Asistencia: una columna de alumnos, controles grandes.

## Navegación en desktop

- Misma estructura; el tablero en **grilla**.
- El detalle de grupo puede usar más ancho (integrantes + semáforo lado a lado).
- Sidebar de módulos + contenido (no un “dashboard” de widgets).

## Espacio alumno

- Sin sidebar de cursada: **home** (sprint actual + mis datos + atajos) → **Mi grupo** → fichas / recursos.
- Sprint actual = fechas planning→review del cronograma ([regla](../01-producto/sprint-actual-cronograma.md)); el semáforo es otra señal (evaluación).
- Rutas: `/alumno` → `/alumno/grupos/:groupId` → `/alumno/grupos/:groupId/sprints/:sprintNumber`.
- Back contextual a “Mi grupo” / inicio alumno.
- Salir solo en el chrome (`AppShell`), no duplicado en el body.

## Estados de navegación

| Caso | Comportamiento simple |
|------|------------------------|
| Sin cursada cargada | Mensaje: “No hay cursada demo” (seed pendiente) |
| Grupo sin links | Mostrar “Sin link” editable (o vacío) |
| Fecha de asistencia nueva | Crear fila del día al guardar la primera marca |

## Qué no hacemos (por ahora)

- Deep links complejos
- Búsqueda global
- Notificaciones push
- Menú de navegación inventado por pantalla (reutilizar sidebar + PageHero)
