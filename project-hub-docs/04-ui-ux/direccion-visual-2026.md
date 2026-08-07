# Dirección visual — ClassTrack (2026)

**Reading this as:** product UI de herramienta docente, lenguaje **Linear-style** (oscuro, denso, preciso), no landing marketing.

## Skills usadas

| Skill | Rol |
|-------|-----|
| `frontend-design` | Evitar estética genérica / “AI slop” |
| `design-taste-frontend` | Gustos de producto moderno |
| `linear-ui-skills` | Tokens / grilla / dark tool UI |
| `web-design-guidelines` | a11y + interacción |

## Dials

- `DESIGN_VARIANCE`: 5 (contenido, no experimental)
- `MOTION_INTENSITY`: 3 (micro feedback ≤ 200ms)
- `VISUAL_DENSITY`: 7 (usable en aula / muchos grupos)

## Tokens (resumen)

| Token | Valor | Uso |
|-------|-------|-----|
| surface-base | `#08090a` | Fondo |
| surface-1 | `#111213` | Paneles |
| border | `#232526` | Separadores 1px |
| text | `#f7f8f8` | Primario |
| text-muted | `#8b8f98` | Secundario |
| accent | `#5e6ad2` | Acciones / focus |
| ok / attention / critical | verdes / ámbar / rojo | Semáforo |

Tipografía: **Inter** (como Linear). Radio: **6–8px**. Espaciado en grilla de **4px**.

## Qué NO hacer

- Gradientes púrpura genéricos
- Cards con sombra suave “dashboard 2020”
- Tipografía serif ornamental en producto
- Animaciones decorativas largas

## Continuidad

Nuevas pantallas: **Tailwind v4** + **Atomic Design** (`atoms` → `molecules` → `organisms` → `templates` → `pages`).

Tokens en `apps/web/src/index.css` (`@theme`). No agregar CSS suelto tipo BEM; preferí clases Tailwind y componentes reutilizables.
