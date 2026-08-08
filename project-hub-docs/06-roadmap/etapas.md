# Etapas del producto — ClassTrack

Cómo organizamos el desarrollo (visión senior / proceso).

## Mapa de etapas

| Etapa | Épica Trello | Estado | Qué es |
|-------|--------------|--------|--------|
| **0–3** | CT-E01…E03 | Hecho | Docs, skills, GitHub/Trello |
| **MVP clásico** | **CT-E04** | **Cerrada** | Tablero + detalle grupo + asistencia (+ cronograma/faltas) |
| **Cronograma** | CT-E05 | Hecho | Clases, obligatoriedad, libre |
| **Post-MVP** | **CT-E06** | **Activa** | Alumno, fichas, notas, seguimiento docente, ops |

## MVP clásico (cerrado) — criterio

Un docente, en el celular, en &lt; 1 min:

1. Abre la cursada actual  
2. Ve los grupos y el semáforo  
3. Entra a un grupo y entiende integrantes / sprints / links  
4. Puede tomar asistencia del día  

Detalle: [mvp.md](./mvp.md).

## Post-MVP (activa) — CT-E06

Trabajo de **cursada real**, fuera del MVP original:

- Auth, roles, invites, mails, duplicar cursada, tutor  
- Formación de grupos, fichas de sprint, precalificación / notas finales  
- Próximo: **notas de grupo** (CT-049) + **fotos** (CT-050)  
- Infra pendiente: Docker (CT-014) en Backlog  

## Reglas de trabajo (obligatorias)

1. **Una etapa activa.** Hoy: CT-E06. No inventar features “sueltas”.  
2. **Toda card nueva** lleva `**Épica:** CT-E0X`, labels, y entra al checklist de la épica.  
3. **Hecho en Trello ⇒ mergeado en `main`** (o card CT-051 de higiene abierta hasta mergear).  
4. **Orden de PRs:** mergear de menor a mayor número / dependencia; rebase si hace falta.  
5. **Backlog** = ideas sin compromiso de sprint.  
6. Si una idea no cabe en E06 → nueva épica (no reabrir E04).

## Orden inmediato sugerido

1. ~~CT-051 — Mergear PR #45 → #46 → #47 a `main`~~ **hecho**  
2. ~~CT-049 — Notas de seguimiento por grupo~~ **hecho** (PR #48)  
3. **CT-050 — Fotos/capturas en notas** (en curso)  
4. CT-014 — Docker (cuando toque infra)

## Tablero

https://trello.com/b/jizP2m9a/classtrack-desapp
