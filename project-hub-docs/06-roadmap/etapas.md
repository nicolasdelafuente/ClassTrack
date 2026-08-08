# Etapas del producto — ClassTrack

Cómo organizamos el desarrollo (visión senior / alumno).

## Mapa de etapas

| Etapa | Épica Trello | Estado | Qué es |
|-------|--------------|--------|--------|
| **0–3** | CT-E01…E03 | Hecho | Docs, skills, GitHub/Trello |
| **MVP clásico** | **CT-E04** | **Cerrada** | Tablero + detalle grupo + asistencia (+ cronograma/faltas) |
| **Cronograma** | CT-E05 | Hecho | Clases, obligatoriedad, libre |
| **Post-MVP / cursada real** | **CT-E06** | **Cerrada** | Alumno, fichas, notas, seguimiento + fotos |
| **Mejoras continuas** | **CT-E07** | **Activa** | Features e mejoras que vayan surgiendo |

## Producto usable (hito cerrado)

El flujo de **cursada real** ya está en `main` y se considera **finalizado para uso**:

- Docente: tablero, grupos, asistencia, cronograma, fichas, notas, seguimiento con fotos  
- Alumno: grupo, fichas de sprint  
- Auth, invites, mails, tutor, formación de grupos  

**Docker (CT-014)** queda en **Backlog**: es infra, **otro momento**. No bloquea el producto.

## Modo actual — CT-E07 Mejoras continuas

A partir de ahora el trabajo es **incremental**:

1. Aparece una idea / dolor / mejora  
2. Se crea una card (o se pide y la armamos) con `**Épica:** CT-E07`  
3. Branch → PR → merge a `main` → card a **Hecho**  

No hace falta una “etapa gigante”: cada mejora es un ticket chico y shippable.

## Reglas de trabajo

1. **Etapa activa:** CT-E07.  
2. **Toda card nueva** lleva `**Épica:** CT-E07` (salvo infra explícita).  
3. **Hecho en Trello ⇒ mergeado en `main`**.  
4. **Backlog** = ideas sin compromiso (incluye Docker).  
5. No reabrir E04/E06; si hace falta un tema grande nuevo → nueva épica.

## Cierre reciente

1. ~~CT-051 — Mergear PRs post-MVP~~ **hecho**  
2. ~~CT-049 — Notas de seguimiento~~ **hecho** (PR #48)  
3. ~~CT-050 — Fotos en notas~~ **hecho** (PR #49)  
4. CT-014 — Docker → **Backlog / infra**

## Tablero

https://trello.com/b/jizP2m9a/classtrack-desapp
