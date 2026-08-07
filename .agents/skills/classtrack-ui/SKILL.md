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

## Dials

- `DESIGN_VARIANCE`: 4 (restrained)
- `MOTION_INTENSITY`: 5 (noticeable but short; never cinematic)
- `VISUAL_DENSITY`: 4 (airy; not cockpit-packed)

## Must

- **Light theme by default** — near-white page, soft gray panels
- **Minimal decoration** — no purple gradients, no glow, no neon accents, no heavy glassmorphism
- **Depth via soft shadow + 1px border**, not multi-layer dramatic shadows
- **Transitions** on hover/focus/navigation: `transform` + `opacity` + colors only; ≤ 200–250ms; `ease-out`
- Honor `prefers-reduced-motion` (disable or near-zero motion)
- Tailwind v4 tokens in `apps/web/src/index.css` (`@theme`)
- Atomic Design: `atoms` → `molecules` → `organisms` → `templates` → `pages`
- Primary accent: quiet teal/green (education / UNaHur-adjacent), used sparingly for actions and focus
- Typography: clean sans (Inter or system); headings slightly tighter tracking; body readable

## Must not

- Dark-first / near-black tool UI (old Linear cockpit direction)
- Dense “dashboard 2020” cards with harsh borders only and zero motion
- Marketing hero layouts, big illustrative blobs, emoji clusters
- `transition: all`
- Long entrance choreographies or parallax

## Hierarchy (workspace screens)

Group detail should feel like a **workspace**, not a grid of equal form boxes:

1. **Hero panel** (`tone="elevated"`) — group identity, meta, primary CTAs first  
2. **Supporting panels** — semáforo / members / resources with clear section titles + one quiet icon each  
3. **Surface levels** — elevated > default > soft/flat (not identical white cards)  
4. **Interactive rows** — links, members, sprint chips respond on hover  

## Component language

| Pattern | Guidance |
|---------|----------|
| Page | Light canvas; max-width content; generous padding |
| Panel / list | White/off-white surface, soft shadow, rounded ~10–12px; vary elevation by role |
| Rows | Hover: slight bg lift or shadow; optional `translateY(-1px)` |
| Buttons | Solid primary or quiet ghost; clear hover; press scale ≤ 0.98 |
| Status (semáforo) | Soft-bg chips, clickable, readable — not tiny equal dots only |
| Empty / loading | Calm copy + `aria-live` |

## Motion budget (allowed)

1. **Hover lift** on interactive cards/rows  
2. **Fade/slide short** on panel mount (optional, ≤ 200ms)  
3. **Color/opacity** on buttons and toggles  

If unsure, ship **less** motion.

## Checklist before shipping UI

- [ ] Looks light and calm on desktop and ~375px mobile  
- [ ] Focus-visible rings present  
- [ ] Reduced motion respected  
- [ ] No leftover dark Linear tokens as the default theme  
- [ ] New pieces reuse atoms/molecules; no one-off BEM CSS files  

## Conflict resolution

If another skill (e.g. generic `linear-ui-skills` or dark defaults) conflicts: **this skill wins** for ClassTrack `apps/web`.
