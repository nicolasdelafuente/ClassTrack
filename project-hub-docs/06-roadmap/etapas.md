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
| **Espacio alumno** | **CT-E09** | **Hecha** | Perfil, sprint actual (cronograma), grupo y fichas |

## Producto usable (hito cerrado)

El flujo de **cursada real** ya está en `main` y se considera **finalizado para uso**:

- Docente: tablero, grupos, asistencia, cronograma, fichas, notas, seguimiento con fotos  
- Alumno: home (sprint actual + datos), Mi grupo, fichas de sprint  
- Auth, invites, mails, tutor, formación de grupos  

**Docker (CT-014)** queda en **Backlog**: es infra, **otro momento**. No bloquea el producto.

## Modo actual — CT-E07 Mejoras continuas

[CT-E09](https://trello.com/c/j8OQSn38) quedó **completa** (PRs #71 / #72). El trabajo vuelve a ser **incremental** bajo CT-E07:

1. Aparece una idea / dolor / mejora  
2. Card con `**Épica:** CT-E07`  
3. Branch → PR → merge a `main` → card a **Hecho**  

## Reglas de trabajo

1. **Épica activa:** CT-E07 (mejoras chicas). No reabrir E04/E06/E08/E09.  
2. **Toda card nueva** lleva `**Épica:** CT-E07` (salvo infra explícita o nueva épica grande).  
3. **Hecho en Trello ⇒ mergeado en `main`**.  
4. **Backlog** = ideas sin compromiso (incluye Docker).  
5. Tema grande nuevo → nueva épica.

## Cierre reciente

1. ~~CT-E09 Espacio alumno~~ **hecho** (PRs #71, #72)  
2. ~~CT-051 — Mergear PRs post-MVP~~ **hecho**  
3. ~~CT-049 / CT-050~~ **hecho**  
4. CT-014 — Docker → **Backlog / infra**

## Tablero

https://trello.com/b/jizP2m9a/classtrack-desapp
