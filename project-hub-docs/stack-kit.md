# Stack kit — plantilla reutilizable

Plantilla para levantar proyectos full-stack (web responsive, monorepo FE/BE, Docker después).  
Nació con ClassTrack / DesApp (UNaHur); sirve para copiar y adaptar.

> Cómo usarla: copiá este archivo a un repo nuevo, tachá lo que no aplique, instalá las skills del bloque activo.

---

## 1. Stack técnico

| Capa | Tecnología | Notas |
|------|------------|--------|
| Frontend | **React + Vite + TypeScript** | Web responsive (celular + desktop) |
| Estilos | **Tailwind CSS v4** | Design tokens + UI usable |
| Routing FE | **React Router** | Apps multi-pantalla |
| Backend | **NestJS + TypeScript** | API modular |
| ORM / BD | **Prisma + PostgreSQL** | Seed, migraciones, Docker-friendly |
| Monorepo | **npm/pnpm workspaces** | Sin Turborepo al día 1 (opcional después) |
| Contenedores | **Docker Compose** | `web` + `api` + `db` (cuando el local ya anda) |
| Repo | **GitHub** + **`gh` CLI** | Issues, PRs, Actions |
| Tablero | **Trello** + API (key/token) | Tarjetas; no CLI oficial fuerte |

### Estructura de monorepo sugerida

```text
mi-proyecto/
├── apps/
│   ├── web/                 # React + Vite
│   └── api/                 # NestJS + Prisma
├── packages/                # (opcional) tipos / UI compartidos
├── docker-compose.yml
├── package.json             # workspaces
└── docs/                    # o project-hub-docs/
    ├── stack.md             # ← este archivo
    ├── skills.md
    └── ...
```

### Orden de armado (etapas típicas)

1. Alinear producto (visión, usuario, MVP)  
2. Pantallas / flujos del MVP  
3. Arquitectura mínima (entidades + API borrador)  
4. Instalar skills  
5. Scaffold monorepo + primer vertical  
6. Dockerizar  
7. Integraciones (GitHub/Trello/Drive/IA) si hacen falta  

---

## 2. Skills (skills.sh) — set base

Browse: https://www.skills.sh/

### Instalación en bloque

Correr **en la raíz del proyecto** (sin `-g`):

```bash
# Frontend / UI
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices -y
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines -y
npx skills add https://github.com/wshobson/agents --skill tailwind-design-system -y
npx skills add https://github.com/thebushidocollective/han --skill atomic-design-fundamentals -y

# Backend / datos
npx skills add kadajett/agent-nestjs-skills@nestjs-best-practices -y
npx skills add https://github.com/prisma/skills --skill prisma-database-setup -y
npx skills add https://github.com/prisma/skills --skill prisma-postgres -y

# Repo / monorepo
npx skills add wshobson/agents@monorepo-management -y
npx skills add https://github.com/github/awesome-copilot --skill git-commit -y
npx skills add https://github.com/callstackincubator/agent-skills --skill github -y

# Seguridad
npx skills add https://github.com/addyosmani/agent-skills --skill security-and-hardening -y
npx skills add https://github.com/getsentry/skills --skill security-review -y

# Trello (tarjetas)
npx skills add https://github.com/steipete/clawdis --skill trello -y
```

Las skills quedan en `./.agents/skills/` del proyecto. **No instalar con `-g`** si querés evitar que afecten otros repos.

### Tabla rápida (nombre → link)

| Skill | Link |
|-------|------|
| vercel-react-best-practices | https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices |
| web-design-guidelines | https://skills.sh/vercel-labs/agent-skills/web-design-guidelines |
| tailwind-design-system | https://skills.sh/wshobson/agents/tailwind-design-system |
| atomic-design-fundamentals | https://skills.sh/thebushidocollective/han/atomic-design-fundamentals |
| nestjs-best-practices | https://skills.sh/kadajett/agent-nestjs-skills/nestjs-best-practices |
| prisma-database-setup | https://skills.sh/prisma/skills/prisma-database-setup |
| prisma-postgres | https://skills.sh/prisma/skills/prisma-postgres |
| monorepo-management | https://skills.sh/wshobson/agents/monorepo-management |
| gh-cli | https://skills.sh/github/awesome-copilot/gh-cli |
| git-commit | https://skills.sh/github/awesome-copilot/git-commit |
| security-and-hardening | https://skills.sh/addyosmani/agent-skills/security-and-hardening |
| security-review | https://skills.sh/getsentry/skills/security-review |
| trello | https://skills.sh/steipete/clawdis/trello |

### Opcionales

| Skill | Cuándo | Link |
|-------|--------|------|
| domain-modeling | Modelo de dominio más formal | https://skills.sh/mattpocock/skills/domain-modeling |
| frontend-design (Anthropic) | Si no tenés skills propias de diseño | https://skills.sh/anthropics/skills/frontend-design |
| Skills de diseño propias | Prioridad sobre genéricas | *(las tuyas)* |

### No copiar a ciegas

| Skill | Por qué no |
|-------|------------|
| heygen `hyperframes/tailwind` | Tailwind para video HyperFrames, no para React+Vite |
| React Native skills | Solo si el producto es app nativa |
| Azure / Lark / marketing | Fuera de este kit |

---

## 3. Checklist al abrir un proyecto nuevo

- [ ] Copiar este `stack.md` (y opcionalmente `skills.md`)  
- [ ] Idioma: tarjetas Trello, commits y PRs en **español** (código en inglés)  
- [ ] Definir MVP en 1 página (entra / no entra)  
- [ ] Instalar set de skills  
- [ ] `gh auth login`  
- [ ] Trello: `TRELLO_API_KEY` + `TRELLO_TOKEN` (si usás tablero)  
- [ ] Scaffold `apps/web` + `apps/api`  
- [ ] Seed mínimo + primer vertical  
- [ ] Docker Compose cuando FE+BE+DB ya corran en local  

---

## 4. Variantes rápidas

| Si preferís… | Cambiá… |
|--------------|---------|
| Backend más liviano | NestJS → **Express/Fastify** + Prisma (sacá skill Nest, mantené Prisma) |
| App solo docentes / panel | Mismo stack; Atomic Design + tablero primero |
| Mobile nativa | Expo + skill React Native (otro kit) |
| Sin Trello | Issues de GitHub + `gh-cli` alcanza |

---

*Última base: ClassTrack (DesApp UNaHur) — stack FE React/Vite, BE Nest/Prisma/Postgres, monorepo, skills.sh.*
