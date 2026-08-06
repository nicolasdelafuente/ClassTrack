# Navegación — MVP

## Idea general

Pocas pantallas, caminos cortos. El docente casi siempre aterriza en el **tablero de grupos**.

## Flujo feliz (criterio MVP)

```text
Abrir app
   → Home detecta cursada actual (ej. DesApp 2026-c1)
   → Tablero de grupos
   → Tocá un grupo
   → Detalle (estado + gente + links)
   → (opcional) “Tomar asistencia” → Asistencia del grupo/día
```

Tiempo objetivo: **menos de 1 minuto** hasta entender el estado de los grupos.

## Navegación en celular

- **Header corto:** nombre de la cursada + acción atrás.
- **Tablero [B]** es la pantalla principal (home efectiva).
- Desde un grupo [C]: botones claros a *Asistencia* y a *abrir link* (GitHub/Trello/Drive en el navegador externo).
- Asistencia [D]/[E]: una columna de alumnos, controles grandes (pulgar).

## Navegación en desktop

- Misma estructura; el tablero puede verse en **grilla** (más grupos a la vista).
- El detalle de grupo puede usar más ancho (integrantes + semáforo lado a lado).
- No inventar un menú lateral pesado en el MVP: con header + lista alcanza.

## Estados de navegación a tener en cuenta

| Caso | Comportamiento simple |
|------|------------------------|
| Sin cursada cargada | Mensaje: “No hay cursada demo” (seed pendiente) |
| Grupo sin links | Mostrar “Sin link” editable después (o vacío) |
| Fecha de asistencia nueva | Crear fila del día al guardar la primera marca |

## Qué no hacemos en navegación v1

- Deep links complejos
- Búsqueda global
- Notificaciones
- Cambio de rol docente/alumno
