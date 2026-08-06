# Skills (skills.sh) — ClassTrack

Lista de skills del ecosistema [skills.sh](https://www.skills.sh/) que usamos o planeamos usar en este proyecto.

> Actualizar este archivo cuando se agregue o quite una skill.

---

## Set activo

| Skill | Para qué | Link | Instalar |
|-------|----------|------|----------|
| `vercel-react-best-practices` | React (patrones y performance) | https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices | `npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices` |
| `web-design-guidelines` | UI usable (spacing, tipografía, a11y) | https://skills.sh/vercel-labs/agent-skills/web-design-guidelines | `npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines` |
| `nestjs-best-practices` | Backend NestJS | https://skills.sh/kadajett/agent-nestjs-skills/nestjs-best-practices | `npx skills add kadajett/agent-nestjs-skills@nestjs-best-practices` |
| `prisma-database-setup` | Prisma: schema, migraciones, seed | https://skills.sh/prisma/skills/prisma-database-setup | `npx skills add https://github.com/prisma/skills --skill prisma-database-setup` |
| `prisma-postgres` | Prisma + PostgreSQL | https://skills.sh/prisma/skills/prisma-postgres | `npx skills add https://github.com/prisma/skills --skill prisma-postgres` |
| `monorepo-management` | Monorepo `apps/web` + `apps/api` | https://skills.sh/wshobson/agents/monorepo-management | `npx skills add wshobson/agents@monorepo-management` |
| `atomic-design-fundamentals` | Componentes (átomos → páginas) | https://skills.sh/thebushidocollective/han/atomic-design-fundamentals | `npx skills add https://github.com/thebushidocollective/han --skill atomic-design-fundamentals` |
| `tailwind-design-system` | Tailwind v4 para apps web (React) | https://skills.sh/wshobson/agents/tailwind-design-system | `npx skills add https://github.com/wshobson/agents --skill tailwind-design-system` |
| `security-and-hardening` | Seguridad web general (FE + BE) | https://skills.sh/addyosmani/agent-skills/security-and-hardening | `npx skills add https://github.com/addyosmani/agent-skills --skill security-and-hardening` |
| `security-review` | Revisión de vulnerabilidades en código | https://skills.sh/getsentry/skills/security-review | `npx skills add https://github.com/getsentry/skills --skill security-review` |

### Seguridad: por qué estas dos

| Necesidad | Skill elegida | Motivo |
|-----------|---------------|--------|
| Frontend security | `security-and-hardening` (Addy Osmani) | Cubre XSS, input hostil, auth, datos sensibles; ~19K installs; audit Pass |
| Backend / API security | `security-review` (Sentry) + la misma `security-and-hardening` | Revisión concreta de código + prácticas al escribir API Nest |

**Alternativas vistas (no preferidas para ClassTrack):**

| Skill | Link | Nota |
|-------|------|------|
| `frontend-security` | https://skills.sh/schalkneethling/webdev-agent-skills/frontend-security | Más “FE audit”, pero pocas stars y **Trust Hub Fail** |
| `backend-security-coder` | https://skills.sh/rmyndharis/antigravity-skills/backend-security-coder | Nombre claro, pero contenido genérico y pocas installs (~93) |
| `api-security-design` | https://skills.sh/vinayaklatthe/microsoft-security-skills/api-security-design | Orientado a Azure / APIM; de más para nuestro MVP |

### Tailwind: cuidado con el link de HyperFrames

Pediste: https://www.skills.sh/heygen-com/hyperframes/tailwind

| Skill | ¿Para ClassTrack? | Nota |
|-------|-------------------|------|
| `heygen-com/hyperframes@tailwind` | **No** | Es Tailwind para **composiciones de video HyperFrames** (runtime browser), no para React+Vite |
| `wshobson/agents@tailwind-design-system` | **Sí** | Tailwind v4 + design tokens + componentes web |

Comando del que **no** usamos en ClassTrack (referencia):

```bash
npx skills add https://github.com/heygen-com/hyperframes --skill tailwind
```

### Flujo de trabajo: GitHub + Trello (tarjetas, commits, PRs)

| Skill | Para qué | Link | Estado |
|-------|----------|------|--------|
| `git-commit` | Commits (Conventional Commits; mensajes en **español**) | https://skills.sh/github/awesome-copilot/git-commit | **Instalada** |
| `github-issues` | Issues en GitHub | https://skills.sh/github/awesome-copilot/github-issues | **Instalada** |
| `github` (Callstack) | Flujo GitHub general | https://skills.sh/callstackincubator/agent-skills/github | **Instalada** |
| `copilot-pr-autopilot` | Pull requests | https://skills.sh/github/awesome-copilot/copilot-pr-autopilot | **Instalada** |
| `create-github-issue-feature-from-specification` | Issues desde especificación | https://skills.sh/github/awesome-copilot/create-github-issue-feature-from-specification | **Instalada** |
| `trello` (clawdis) | Tarjetas vía API Trello | https://skills.sh/steipete/clawdis/trello | **Instalada** |
| `Trello Automation` | Automatización de tableros | https://skills.sh/claude-office-skills/skills/trello-automation | **Instalada** |

**Nota:** `gh-cli` y `create-github-pull-request-from-specification` **ya no están** (o no matchean) en el repo awesome-copilot actual. Usamos `github` + `copilot-pr-autopilot` + la CLI `gh` del sistema.

**Requisitos fuera de skills.sh:**

1. `gh` instalado y `gh auth login`
2. Trello: `TRELLO_API_KEY` + `TRELLO_TOKEN`
3. Textos de tarjetas, commits y PRs en **español** (ver `convencion-idioma.md`)

### Opcional (producto / modelo)

| Skill | Para qué | Link | Instalar |
|-------|----------|------|----------|
| `domain-modeling` | Modelado de dominio | https://skills.sh/mattpocock/skills/domain-modeling | `npx skills add https://github.com/mattpocock/skills --skill domain-modeling` |

### Instalación en bloque (set activo) — **nivel proyecto**

Correr desde la raíz de ClassTrack (**sin** `-g`):

```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices -y
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines -y
npx skills add kadajett/agent-nestjs-skills@nestjs-best-practices -y
npx skills add https://github.com/prisma/skills --skill prisma-database-setup -y
npx skills add https://github.com/prisma/skills --skill prisma-postgres -y
npx skills add wshobson/agents@monorepo-management -y
npx skills add https://github.com/thebushidocollective/han --skill atomic-design-fundamentals -y
npx skills add https://github.com/wshobson/agents --skill tailwind-design-system -y
npx skills add https://github.com/addyosmani/agent-skills --skill security-and-hardening -y
npx skills add https://github.com/getsentry/skills --skill security-review -y
npx skills add https://github.com/github/awesome-copilot --skill git-commit -y
npx skills add https://github.com/callstackincubator/agent-skills --skill github -y
npx skills add https://github.com/steipete/clawdis --skill trello -y
npx skills add https://github.com/claude-office-skills/skills --skill "Trello Automation" -y
```

Quedan en: `classTrack/.agents/skills/` (+ `skills-lock.json` si el CLI lo genera).

**Alcance:** solo **proyecto** (sin `-g`). Así no contaminan otros repos. En global solo utilidades de Cursor (`find-skills`, `orca-cli`, `orchestration`, `computer-use`).

---

## Más adelante

| Skill / origen | Cuándo | Link / nota |
|----------------|--------|-------------|
| Skills de diseño propias | Cuando las pases | *(pendiente — prioridad sobre genéricas)* |
| `frontend-design` (Anthropic) | Si no hay skills propias de diseño | https://skills.sh/anthropics/skills/frontend-design |
| Docker / Compose | Al dockerizar el monorepo | Buscar en https://www.skills.sh/ con buen ranking |
| Turborepo (Vercel) | Solo si adoptamos Turborepo | Ver skills de vercel-labs / turborepo |

---

## No priorizar (fuera de ClassTrack MVP)

React Native, deploy a Vercel/Azure, Lark, video/HyperFrames, marketing, etc.

---

## Estado de instalación

**Ubicación:** `./.agents/skills/` (proyecto). **No** en `~/.agents/skills` (global).

| Skill | ¿Instalada? | Fecha / notas |
|-------|-------------|----------------|
| vercel-react-best-practices | **Sí** | Proyecto CT-008 |
| web-design-guidelines | **Sí** | Proyecto |
| nestjs-best-practices | **Sí** | Proyecto |
| prisma-database-setup | **Sí** | Proyecto |
| prisma-postgres | **Sí** | Proyecto |
| monorepo-management | **Sí** | Proyecto |
| atomic-design-fundamentals | **Sí** | Proyecto |
| tailwind-design-system | **Sí** | Proyecto |
| security-and-hardening | **Sí** | Proyecto |
| security-review | **Sí** | Proyecto |
| git-commit | **Sí** | Proyecto |
| github-issues | **Sí** | Proyecto |
| github | **Sí** | Proyecto |
| copilot-pr-autopilot | **Sí** | Proyecto |
| create-github-issue-feature-from-specification | **Sí** | Proyecto |
| trello (clawdis) | **Sí** | Proyecto |
| Trello Automation | **Sí** | Proyecto |
| gh-cli | No disponible | Usar `gh` + skill `github` |
| create-github-pull-request-from-specification | No disponible | Usar `copilot-pr-autopilot` |
| domain-modeling | Opcional | No instalada |
| Skills de diseño propias | Pendiente | Esperando al autor |
| heygen `tailwind` (HyperFrames) | No usar | No aplica a ClassTrack |
