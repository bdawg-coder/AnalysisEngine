# Analysis Engine

React-based manufacturing process analysis tool for process engineers to investigate and filter production data.

- **Backend:** Node.js/Express (CommonJS), SQL (schema + seed), port 3001, Dockerized
- **Frontend:** React 18, Vite 5, CSS Modules, plain JavaScript (no TypeScript)
- **Testing:** None configured yet

## Repository Layout

```
src/                React frontend — components, pages, contexts
  components/
    layout/         AppLayout, TopBar, SideNav, MainContent + CSS Modules
  pages/            LoginPage, ColorAnalysisPage + CSS Modules
  context/          AuthContext, ThemeContext, AnalysisContext
server/             Node.js/Express API — auth middleware, DB schema, seed
docs/               Specs, plans, tickets, research, reviews
.claude/            Agents, skills, rules, hooks (see Context Engineering below)
```

## Key Commands

```bash
npm run dev          # Vite dev server (port 5173, proxies /api → localhost:3001)
npm run build        # Production build
npm run preview      # Preview production build locally
```

## Architecture Overview

Full-stack Dockerized app. The Vite frontend (port 5173) proxies all `/api` calls to the Express backend (port 3001). React contexts (`AuthContext`, `ThemeContext`, `AnalysisContext`) manage global state — no Redux. `AppLayout` is the shell that composes `TopBar`, `SideNav`, and `MainContent`. The `SideNav` owns filter state and exposes a menu toggle + clear functionality. Auth is handled by Express with middleware in `server/auth/authMiddleware.js`. Database is SQL with schema and seed scripts in `server/db/`.

## Coding Conventions

- **CSS Modules** for all component styles — no global class names, no inline styles
- **Plain JavaScript (JSX)** — no TypeScript, no `.tsx` files
- **Contexts over prop drilling** — shared state lives in `src/context/`, never passed 3+ levels deep
- **Co-locate styles** — every component has a matching `.module.css` in the same folder
- **Co-locate single-use helpers** — small components used only by one page (e.g., `KpiCard` in `ColorAnalysisPage.jsx`) are defined as non-exported functions in the same `.jsx` file, not a separate file
- **Single source of truth:** Skills and agents reference CLAUDE.md — never duplicate architecture or conventions. Update CLAUDE.md files only; skills/agents inherit.

## Context Engineering

### Path-Scoped Rules (`.claude/rules/`)

No rules files exist yet. Add them as subsystems grow:

| Rule | Paths | Content |
|------|-------|---------|
| `server.md` | `server/**` | Express patterns, auth middleware, DB conventions |
| `components.md` | `src/components/**` | React component and CSS Module conventions |

### Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| `research` | Sonnet | Locate files, analyze implementation, find patterns, extract doc insights |
| `test-runner` | inherit | Run tests intelligently based on code changes |

### Worktree Workflow

```
/fb-plan → Agent(isolation="worktree", prompt="/fb-execute plan-A.md")  # parallel
         → Agent(isolation="worktree", prompt="/fb-execute plan-B.md")  # parallel
         → /fb-verify → merge
```

Plan features to be file-disjoint at planning time.

## Workflow Skills

| Skill | Purpose |
|-------|---------|
| `/fb-plan` | Research codebase and create implementation plan |
| `/fb-execute` | Execute one phase of a plan (worktree-aware) |
| `/fb-verify` | Verify implementation against plan |
| `/drift-check` | Audit CLAUDE.md accuracy against live codebase |
