# Pantallas — MVP

Descripción funcional de cada pantalla (sin mockups visuales todavía). Sirve de guía para Etapa 3.

---

## [A] Home / Cursada actual

**Para qué:** punto de entrada; si hay una sola cursada demo, redirige o muestra un acceso directo al tablero.

**Contiene:**
- Nombre de la cursada (ej. `DesApp 2026-c1`)
- Botón / card: “Ver grupos”
- (Opcional) atajo “Tomar asistencia de hoy”

**No contiene:** estadísticas densas, listados largos, widgets de IA.

---

## [B] Tablero de grupos ★

**Para qué:** responder “¿cómo están los 10 grupos?” de un vistazo.

**Cada fila/card de grupo muestra:**
- Número / nombre del grupo
- Tema corto del proyecto (si hay)
- Docente a cargo
- Semáforo compacto de sprints (ej. S1–S5 con color o ícono: ok / en riesgo / pendiente / vacío)

**Interacción:** tocar un grupo → [C].

**Desktop:** grilla de cards o tabla compacta.  
**Mobile:** lista vertical, una card por grupo.

**Semáforo (definición simple para MVP):**
- Valores por sprint: `sin datos` | `ok` | `atención` | `crítico` (nombres finales se pueden ajustar)
- En MVP el docente los carga/edita a mano (no vienen de GitHub/Trello)

---

## [C] Detalle de grupo ★

**Para qué:** entender un grupo antes de la reunión de cierre o durante el encuentro.

**Secciones (en este orden):**
1. **Cabecera** — Grupo N, tema, docente a cargo  
2. **Semáforo** — S1…S5 editables (tocar para cambiar estado)  
3. **Integrantes** — nombre, legajo, mail (tap mail = abrir cliente de correo)  
4. **Links** — GitHub, Trello, Drive (abrir en nueva pestaña / app); campo URL editable  
5. **Acciones** — “Tomar asistencia de este grupo” → [E]

**No contiene:** historial de commits, boards embebidos, chat, notas largas.

---

## [D] Asistencia de la cursada ★

**Para qué:** pasar lista del encuentro semanal.

**Contiene:**
- Selector de **fecha** (default: hoy)
- Lista de alumnos de la cursada (agrupados por grupo ayuda mucho)
- Por alumno, marcas simples:
  - Asistencia: sí / no (o presente / ausente)
  - Participación: sí / no (opcional en la misma fila)
- Guardado explícito o autoguardado por toque (decidir en implementación; preferible feedback inmediato)

**Mobile:** fila alta, controles grandes; evitar grilla tipo Excel.

---

## [E] Asistencia de un grupo

**Para qué:** mismo flujo que [D], filtrado a un grupo (atajo desde [C]).

Misma UX que [D]; solo cambia el conjunto de alumnos.

---

## Flujos resumen

### Flujo 1 — Panorama de cursada
`[A] → [B]` → mirar semáforos → (opcional) `[C]`

### Flujo 2 — Preparar / dar seguimiento a un grupo
`[B] → [C]` → revisar gente, sprints, abrir Trello/GitHub

### Flujo 3 — Asistencia en el aula
`[A] o [B] → [D]` **o** `[C] → [E]` → marcar presentes / participación

---

## Criterio de aceptación UX (MVP)

- [ ] Desde el celular se entiende el tablero sin zoom horizontal tipo Excel  
- [ ] Un grupo se abre en ≤ 2 toques desde el tablero  
- [ ] Cambiar un sprint del semáforo es inmediato (pocos toques)  
- [ ] Marcar asistencia no requiere scroll horizontal  
- [ ] Desktop no se siente “celular agrandado”: el tablero aprovecha el ancho  
