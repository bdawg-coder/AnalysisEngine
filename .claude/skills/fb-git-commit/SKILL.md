---
name: fb-git-commit
description: Create clean, logical git commits for session changes.
disable-model-invocation: true
allowed-tools: Read Bash
---

# Commit Changes

Create clean, logical git commits for this session's changes.

## Process

1. Review current state:
   - `git status`
   - `git diff`
   - `git diff --staged`
2. Group files into logical commits based on the project structure.
3. Use commit title format: `{type}: {short description}`.
   - Allowed types: `feat`, `fix`, `refactor`, `docs`, `test`, `build`, `chore`, `revert`, `merge`
4. Present commit plan before executing:
   - files per commit
   - full commit message(s)
   - ask for confirmation
5. After approval:
   - stage exact files only
   - create commit(s)
   - show `git log --oneline -n [N]`

### Typical Commit Groups

**Feature work:**
1. `feat: ...` — backend implementation
2. `feat: ...` — frontend implementation
3. `test: ...` — test additions
4. `docs: ...` — plan updates, review docs

**Bug fix:**
1. `fix: ...` — the fix
2. `test: ...` — regression tests

**Documentation only:**
1. `docs: ...` — all doc changes in one commit

## Best Practices

- Prefer small, traceable commits aligned to logical units.
- Keep docs-only updates in `docs` or `chore` commits unless behavior changed.
- Do not stage unrelated artifacts (logs, runtime data, `__pycache__/`, IDE files).
- Avoid mixing unrelated refactors with feature/bug changes.
- Never commit `.env` files, API keys, or tokens.

## Important

- Do not add co-authors or AI attribution.
- Commit messages should read as user-authored.
