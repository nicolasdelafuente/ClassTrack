# Dirección visual — ClassTrack (2026)

**Reading this as:** app docente **light, minimal**, estilo Notion / Claude / Dropbox (listas y paneles, poca decoración), con **transiciones cortas** y sombras suaves.

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
- Motion: 5 (hover lift, fade-up ≤ 250ms)  
- Density: 4 (aires)

## Tokens (resumen)

| Token | Idea |
|-------|------|
| surface | `#f7f7f5` canvas |
| surface-1 | blanco paneles |
| surface soft / elevated | niveles de profundidad (no todas las cards iguales) |
| accent | teal `#0f6b4c` (acciones) |
| shadow-panel / shadow-lift | profundidad suave |

## Workspace de grupo

La ficha de grupo debe sentirse **workspace**, no grilla de formularios:

1. Hero elevado (identidad + meta + CTA asistencia arriba)  
2. Semáforo en chips interactivos  
3. Integrantes con avatar / filas densas  
4. Recursos tipo lista Notion (estado + abrir)

## Qué NO hacer

- Dark cockpit tipo Linear app  
- Gradientes púrpura / glow  
- Animaciones largas o parallax  
- Cards idénticas sin jerarquía  

## Continuidad

Tailwind v4 + Atomic Design. Nuevas pantallas: leer `classtrack-ui` primero.
