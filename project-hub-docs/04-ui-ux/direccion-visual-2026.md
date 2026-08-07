# Dirección visual — ClassTrack (2026)

**Reading this as:** app docente **light, minimal**, estilo Notion / Claude / Dropbox (listas y paneles, poca decoración), con **transiciones cortas** y profundidad por niveles de superficie.

Skill dueño: `.agents/skills/classtrack-ui/SKILL.md` (gana sobre skills genéricos de UI).

## Skills

| Skill | Rol |
|-------|-----|
| **`classtrack-ui`** | Dirección visual del producto (obligatoria en `apps/web`) |
| `frontend-design` / `design-taste-frontend` | Apoyo anti-slop |
| `tailwind-design-system` + `atomic-design-fundamentals` | Tokens + estructura |
| `web-design-guidelines` | a11y / interacción |

**Removido:** `linear-ui-skills` (dirección dark/tool descartada).

## Dials

- Variance: 4  
- Motion: 6 (entrada ≤300ms, stagger ~40ms, hover ≤200ms)  
- Density: 5 (heroes densos)

## Tokens (resumen)

| Token | Idea |
|-------|------|
| surface (canvas) | `#f5f5f3` |
| surface-1 | blanco paneles |
| surface-2 / soft | paneles secundarios |
| surface-hover / interactive | hover y filas |
| accent | teal `#0f6b4c` |
| shadow-panel / shadow-lift | profundidad suave |

## Tipografía

| Rol | Tamaño / peso |
|-----|----------------|
| Display | ~30–34 / 700 |
| Section | ~17–18 / 600 |
| Body | ~14–15 / 400 |
| Meta | ~12–13 / 500 |

## Patrones de página

Las tres pantallas (Board, Grupo, Asistencia) usan:

1. `PageHero` + meta derivada de datos existentes  
2. `Panel` con tones distintos  
3. `StatusBadge` / timeline de sprints compartida  
4. Mismos botones, listas y motion  

## Workspace de grupo

1. Hero elevado denso (estado, sprint, integrantes, links, progreso derivado)  
2. Semáforo = **timeline horizontal** interactiva  
3. Integrantes con avatar  
4. Recursos = filas (ícono, nombre, badge, acción)  

## Qué NO hacer

- Dark cockpit tipo Linear app  
- Gradientes púrpura / glow / emoji clusters  
- Animaciones largas o parallax  
- Cards idénticas sin jerarquía  
- Features inventadas sin datos (roles, sync fake, etc.)  

## Continuidad

Tailwind v4 + Atomic Design. Nuevas pantallas: leer `classtrack-ui` primero.
