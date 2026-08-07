# ClassTrack Web

React + Vite + TypeScript + **Tailwind CSS v4**.

UI organizada con **Atomic Design**:

```text
src/components/
  atoms/        # Button, Input, Badge, StatusDot…
  molecules/    # SprintLights, MemberRow, LinkField…
  organisms/    # GroupCard, MembersList, LinksEditor…
  templates/    # AppShell
pages/          # Board, Detalle, Asistencia
```

Tokens (quarks) en `src/index.css` (`@theme`).

## Dev

```bash
npm run seed
npm run dev:api
npm run dev:web
```

http://localhost:5173
