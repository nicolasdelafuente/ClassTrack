# Convención de idioma — ClassTrack

Todo el seguimiento y el historial de Git van en **español**.

## Trello

- Nombres de **listas** y **tarjetas**: español.
- Descripciones: español, claro y corto.
- Se pueden dejar códigos técnicos (`apps/web`, `[B]`, `Prisma`) si ayudan, pero la frase principal en español.

**Bien:** `Crear el monorepo (apps/web y apps/api)`  
**Mal:** `Scaffold monorepo apps/web + apps/api`

## Commits (Git)

- Mensaje en **español**.
- Preferible estilo convencional con tipo en inglés corto o descripción toda en español. Elegimos:

```text
tipo: descripción en español

Ejemplos:
feat: agregar tablero de grupos con semáforo
fix: corregir carga de asistencia por fecha
docs: actualizar visión del MVP
chore: configurar monorepo web y api
```

- Cuerpo del commit (si hace falta): también en español.
- No mezclar mensajes en inglés salvo nombres propios de libs (`React`, `NestJS`).

## Pull requests (GitHub)

- **Título** en español.
- **Descripción** en español (resumen + plan de prueba).
- Ejemplo de título: `Agregar esqueleto del monorepo y tablero de grupos`

## Issues / comentarios

- En español, mismo criterio que las tarjetas.

## Código

- Código, nombres de archivos, variables y commits de dependencias: **inglés** (convención de programación).
- Comentarios de código: inglés o español breve; preferimos inglés en código, español en docs/Trello/GitHub humano.

---

Esta regla aplica a ClassTrack y se puede copiar a otros proyectos del stack-kit.
