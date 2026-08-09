# Etapas del producto — ClassTrack

Cómo organizamos el desarrollo (visión senior / alumno).

## Mapa de etapas

| Etapa | Épica Trello | Estado | Qué es |
|-------|--------------|--------|--------|
| **0–3** | CT-E01…E03 | Hecho | Docs, skills, GitHub/Trello |
| **MVP clásico** | **CT-E04** | **Cerrada** | Tablero + detalle grupo + asistencia (+ cronograma/faltas) |
| **Cronograma** | CT-E05 | Hecho | Clases, obligatoriedad, libre |
| **Post-MVP / cursada real** | **CT-E06** | **Cerrada** | Alumno, fichas, notas, seguimiento + fotos |
| **Mejoras continuas** | **CT-E07** | Activa (mejoras chicas) | Features e mejoras que vayan surgiendo |
| **Espacio alumno** | **CT-E09** | **Activa** | Perfil, sprint actual (cronograma), grupo y fichas |

## Producto usable (hito cerrado)

El flujo de **cursada real** ya está en `main` y se considera **finalizado para uso**:

- Docente: tablero, grupos, asistencia, cronograma, fichas, notas, seguimiento con fotos  
- Alumno: grupo, fichas de sprint  
- Auth, invites, mails, tutor, formación de grupos  

**Docker (CT-014)** queda en **Backlog**: es infra, **otro momento**. No bloquea el producto.

## Modo actual — CT-E09 Espacio alumno (+ CT-E07 mejoras chicas)

**Épica de producto activa:** [CT-E09](https://trello.com/c/j8OQSn38) — perfil del alumno, sprint actual por cronograma, Mi grupo y fichas.

Las mejoras sueltas (no de este bloque) siguen yendo a **CT-E07**.

Flujo:

1. Tomar un ticket del checklist de CT-E09 (o crear uno con `**Épica:** CT-E09`)  
2. Branch → PR → merge a `main` → card a **Hecho** + marcar ítem en el checklist  
3. Si el checklist de la épica queda 100% → mover CT-E09 a **Hecho**

## Reglas de trabajo

1. **Épica de producto activa:** CT-E09. Mejoras chicas: CT-E07.  
2. **Toda card nueva** lleva `**Épica:** CT-E09` o `CT-E07` según el tema (salvo infra explícita).  
3. **Hecho en Trello ⇒ mergeado en `main`**.  
4. **Backlog** = ideas sin compromiso (incluye Docker).  
5. No reabrir E04/E06/E08; si hace falta un tema grande nuevo → nueva épica.

## Cierre reciente

1. ~~CT-051 — Mergear PRs post-MVP~~ **hecho**  
2. ~~CT-049 — Notas de seguimiento~~ **hecho** (PR #48)  
3. ~~CT-050 — Fotos en notas~~ **hecho** (PR #49)  
4. CT-014 — Docker → **Backlog / infra**

## Tablero

https://trello.com/b/jizP2m9a/classtrack-desapp
