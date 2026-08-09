# Sprint actual según cronograma (CT-072 / CT-E09)

Cómo ClassTrack decide **en qué sprint está el alumno** usando el cronograma de la cursada — no el semáforo docente.

Complementa [workspace-alumno-grupo.md](./workspace-alumno-grupo.md).

## Idea en una frase

El **sprint actual** es una ventana de calendario: desde la clase de **planning** hasta la de **review** de ese sprint (ambas inclusive).

## Definiciones

| Concepto | Origen en el cronograma |
|----------|-------------------------|
| Inicio Sprint N | Fecha de la `ClassSession` que tiene un ítem `sprint_planning` del sprint N |
| Fin Sprint N | Fecha de la `ClassSession` que tiene un ítem `sprint_review` del sprint N |
| Sprint actual | El N con mayor número tal que `startsOn ≤ hoy ≤ endsOn` (fechas de calendario, sin hora) |
| Semáforo (`ok` / `attention` / `critical`) | Evaluación del **docente** sobre el grupo — **otra** señal; no define el sprint actual |

Si el review aún no está cargado en el cronograma, `endsOn` puede ser `null` y el sprint se considera abierto desde su planning.

## Cómo se numeran los sprints

Se leen los ítems del cronograma en orden de fecha. El número N sale del título habitual DesApp (`1er`, `2do`, `3er`, `4to`, `5to`) o, si no hay número claro, del orden de aparición de los planning (1…5).

## Casos borde

| Situación | Comportamiento |
|-----------|----------------|
| **Mismo día** review del N y planning del N+1 | Ese día es fin de N e inicio de N+1. Si `hoy` cae ahí, el **actual es N+1** (el de mayor número que incluye el día). |
| Antes del 1.er planning | No hay sprint actual (`currentSprintNumber = null`). UI: “Los sprints todavía no empezaron”. |
| Después del último review | No hay sprint actual. UI: “Ya terminaron los sprints del calendario” (igual se pueden ver fichas e historial). |
| Hoy entre review N y planning N+1 (hueco) | No hay actual. |
| Cursada sin ítems planning/review | Lista de ventanas vacía; no hay actual. |

## Qué ve el alumno (pantallas)

1. **Inicio (`/alumno`)** — sprint actual destacado (número + fechas), datos del padrón, atajos a Mi grupo y fichas.
2. **Mi grupo** — compañeros + **evaluaciones** (semáforo; solo lectura).
3. **Fichas** — inicio/fin del sprint actual bien visibles; el resto en listado.

## Criterios de aceptación (producto)

- [ ] El sprint actual se calcula solo con fechas del cronograma.
- [ ] No se usa el semáforo para decidir el sprint actual.
- [ ] El caso “review + planning el mismo día” queda definido (gana el sprint nuevo).
- [ ] Docs de pantallas / navegación del espacio alumno alineados.

## API (implementación)

- `GET /me/courses/:courseId/sprint-calendar` — ventanas `startsOn` / `endsOn` + `currentSprintNumber` (CT-073).
- Seed demo: `shiftCronogramaSoTodayInSprint` corre el cronograma para que “hoy” caiga ~7 días después del planning del Sprint 2 (CT-079). Tras `pnpm prisma db seed`, el home alumno debería mostrar un sprint actual.

## Cómo probar en local

1. `pnpm --filter api prisma db seed` (o el script de seed del monorepo).
2. Login como alumno demo.
3. En `/alumno` debería verse “Estás en Sprint 2” (u otro N si cambiás opciones del shift) con fechas.
4. Si necesitás el calendario oficial 2026 sin shift, usá `CRONOGRAMA_DESAPP_2026` sin `shiftCronogramaSoTodayInSprint` en el seed.
