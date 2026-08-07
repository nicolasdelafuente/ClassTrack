---
name: classtrack-ui
description: >-
  ClassTrack product UI direction — light, minimalist app surfaces inspired by
  Notion / Claude / Dropbox (lists, panels, little decoration) with soft depth
  and short transitions. Use when building or redesigning any apps/web UI,
  Tailwind tokens, Atomic Design components, or visual polish for ClassTrack.
---

# ClassTrack UI

## Design read (always)

**Reading this as:** teacher product app (not marketing landing). Light, calm, minimal. Lists and panels. Few decorations. Soft shadows and short transitions (2026 product feel). **Not** a dark Linear-style issue tracker.

References for *feel* (not pixel copy): Notion, Claude, Dropbox — **app chrome**, not hero landings.

**Same app rule:** Board, Group detail, and Attendance must share `PageHero`, `Panel` tones, `StatusBadge`, type scale, and motion. If a new screen invents its own card markup, stop and reuse primitives.

## Dials

- `DESIGN_VARIANCE`: 4 (restrained)
- `MOTION_INTENSITY`: 6 (noticeable short motion; never cinematic)
- `VISUAL_DENSITY`: 5 (heroes denser; less empty air)

## Must

- **Light theme by default** — near-white page, soft gray panels
- **Minimal decoration** — no purple gradients, no glow, no neon accents, no heavy glassmorphism
- **Depth via surface levels** — not identical white cards:
  - `canvas` (page) → `surface` / `default` → `elevated` → `interactive` (hover)
- **Type scale (fixed):**
  - Display / page title: ~30–34 / 700–600
  - Section title: ~17–18 / 600
  - Body: ~14–15 / 400
  - Meta: ~12–13 / 500
- **Transitions** on hover/focus: `transform` + `opacity` + colors only; ease-out
- Honor `prefers-reduced-motion` (disable or near-zero motion)
- Tailwind v4 tokens in `apps/web/src/index.css` (`@theme`)
- Atomic Design: `atoms` → `molecules` → `organisms` → `templates` → `pages`
- Primary accent: quiet teal/green (education / UNaHur-adjacent), used sparingly
- Icons: quiet SVG only — **no emoji clusters**

## Must not

- Dark-first / near-black tool UI (old Linear cockpit direction)
- Dense “dashboard 2020” cards with harsh borders only and zero motion
- Marketing hero layouts, big illustrative blobs, emoji clusters
- `transition: all`
- Long entrance choreographies or parallax
- One-off card markup that bypasses `Panel` / `PageHero` on product pages

## Hierarchy (workspace screens)

1. **Hero** (`PageHero` + `Panel tone="elevated"`) — identity, derived meta, primary CTAs  
2. **Supporting panels** — clear `SectionTitle` + one quiet icon  
3. **Surface levels** — elevated > default > soft/flat  
4. **Interactive rows** — hover lift / bg / border  

## Semáforo

- Group detail: **horizontal interactive timeline** (`SprintTimeline`) — compact, scroll-snap on small screens  
- Board cards: **mini read-only timeline** aligned visually (`SprintLights`)  
- Status color + label; keyboard / `aria-label`; never color-only  

## Component language

| Pattern | Guidance |
|---------|----------|
| Page | Light canvas; max-width; shared `PageHero` |
| Panel | Vary `tone`; soft shadow; rounded ~12px (`rounded-xl`) |
| Rows / cards | Hover: `translateY(-2px)` + shadow-lift + border-strong ≤ 200ms |
| Buttons | Primary or ghost; hover lift; press scale ≤ 0.98 |
| Status | `StatusBadge` shared; soft critical pulse optional |
| Empty / loading | Calm copy + `aria-live` |

## Motion budget (allowed)

1. Page/panel entrance: opacity + `translateY(8–12px)` ≤ **300ms**  
2. Panel stagger ~**40ms** between siblings  
3. Hover lift on interactive surfaces ≤ **200ms**  
4. Press scale on buttons/nodes  
5. Sprint status change: color + scale fade ≤ **180ms**  

If unsure, ship **less** motion.

## Checklist before shipping UI

- [ ] Board / Group / Attendance look like the **same app**
- [ ] Surface levels differ (not one flat white plane)
- [ ] Focus-visible rings present
- [ ] Reduced motion respected
- [ ] Reuses atoms/molecules; no one-off BEM CSS
- [ ] Desktop + ~375px mobile

## Conflict resolution

If another skill (e.g. generic dark defaults) conflicts: **this skill wins** for ClassTrack `apps/web`.
