# Update CLAUDE.md and PROGRESS.md Implementation Plan

## Overview
Replace template placeholders in CLAUDE.md and PROGRESS.md with accurate content
reflecting the actual Analysis Engine project stack, structure, and build progress.

## Current State
- `CLAUDE.md` — still the skeleton template with `[placeholders]` throughout
- `PROGRESS.md` — still the skeleton "Documentation Health Log" template
- Project is a Dockerized full-stack React + Express app, phase 1 complete

## Out of Scope
- Adding or changing any source code
- Creating new rules files or agents

## Phase 1: Update CLAUDE.md
### Changes Required
- **File:** `CLAUDE.md:1` — Replace all template placeholders with real values:
  - Project name: Analysis Engine
  - Description: React-based manufacturing process analysis tool for process engineers
  - Backend: Node.js/Express (CommonJS), port 3001, SQL (schema + seed)
  - Frontend: React 18, Vite 5, CSS Modules, pure JavaScript
  - Testing: none configured yet
  - Repo layout: reflect actual folders (src/, server/, docs/, .claude/)
  - Key commands: `npm run dev`, `npm run build`, `npm run preview`
  - Architecture: Dockerized full-stack, Vite proxies /api to Express, contexts for Auth/Theme/Analysis
  - Coding conventions: CSS Modules for scoped styles, JSX (no TSX), no TypeScript
  - Remove backend/frontend sub-CLAUDE.md references (files don't exist)
  - Remove placeholder rules table rows

### Success Criteria
- [ ] No `[placeholder]` text remains in CLAUDE.md
- [ ] All sections reflect actual codebase

## Phase 2: Update PROGRESS.md
### Changes Required
- **File:** `PROGRESS.md:1` — Replace template with a real progress tracker showing:
  - Phase 1 (Foundation) — COMPLETE: Login page, AppLayout, TopBar, SideNav, MainContent, ThemeContext, AuthContext, AnalysisContext
  - Current phase and what's next

### Success Criteria
- [ ] PROGRESS.md reflects actual build state
- [ ] Template boilerplate removed

## Rollback
Both files are tracked in git. `git checkout -- CLAUDE.md PROGRESS.md` to revert.
