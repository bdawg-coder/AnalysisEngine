---
name: drift-check
description: Audit CLAUDE.md files and .claude/rules/ for accuracy against the live codebase. Detects stale documentation, missing references, and undocumented code. Run periodically or after major changes.
allowed-tools: Read Grep Glob Bash
---

# Documentation Drift Check

Audit all CLAUDE.md files and `.claude/rules/` against the live codebase. Produce a structured report and update PROGRESS.md.

## Audit Checklist

Run each check below. For each, record: PASS (accurate), DRIFT (inaccurate — explain what changed), or SKIP (not applicable).

### 1. Repository Layout
Verify directories listed in root `CLAUDE.md` `## Repository Layout` still exist.

### 2. Test Module Count
Compare actual test file count against any documented count in CLAUDE.md or tests/CLAUDE.md.

### 3. Key Commands
Spot-check that documented commands still work (e.g., test command produces output).

### 4. Path-Scoped Rules Validity
For each `.claude/rules/*.md`, verify the `paths:` glob patterns match actual files.

### 5. Environment Variables
Verify env vars documented in CLAUDE.md (or `.claude/rules/config.md`) are actually read in code.

### 6. Architecture Description
Compare architecture overview in CLAUDE.md against actual file structure and entry points.

### 7. Agent & Skill File Existence
Verify all agents and skills referenced in CLAUDE.md or docs still exist.

## Output Format

```
## Drift Check Results — [date]

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Repository layout | PASS/DRIFT | details |
| 2 | Test module count | PASS/DRIFT | actual vs documented |
| 3 | Key commands | PASS/DRIFT | broken commands |
| 4 | Rules path validity | PASS/DRIFT | broken globs |
| 5 | Environment variables | PASS/DRIFT | undocumented/stale vars |
| 6 | Architecture | PASS/DRIFT | structural changes |
| 7 | Agents & skills | PASS/DRIFT | missing/extra files |

**Overall: [X] PASS / [Y] DRIFT / [Z] SKIP**
```

## If Drift is Found

For each DRIFT item:
1. State exactly what the doc says vs what the code shows.
2. Propose the specific edit to fix it (file, section, old text, new text).
3. Ask the user whether to apply the fix now.

## Update PROGRESS.md

After the audit, append an entry to `PROGRESS.md` in the repo root:

```markdown
### [date] — Drift Check
- **Triggered by:** manual `/drift-check`
- **Result:** [X] PASS / [Y] DRIFT / [Z] SKIP
- **Drift items:** [list any DRIFT items, or "none"]
- **Fixes applied:** [list fixes, or "none"]
```

If PROGRESS.md does not exist, create it with a header first.
