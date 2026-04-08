---
name: fb-plan
description: Research the codebase and create an implementation plan for a task.
argument-hint: "<task description or ticket path>"
allowed-tools: Read Write Edit Grep Glob Bash Agent
---

# Research & Plan

Research the codebase for a task, then produce a phased implementation plan.

## Workflow

1. **Understand the task** — Read any referenced ticket/doc. If none, clarify intent with the user.
2. **Research** — Make targeted research calls (see below). Do not make a single open-ended call.
3. **Synthesize** — Identify what needs to change, what patterns to follow, and what constraints apply.
4. **Plan** — Write a phased implementation plan to `docs/plans/`.
5. **Optionally write a ticket** — If the user wants a ticket artifact, write it to `docs/tickets/`.

## Research Strategy

Break research into **separate, focused calls** to the `research` agent. Each call should ask one specific question. Do not combine questions.

### Required Calls (in order)

**Call 1 — Locate:** "Find the files that handle [feature/area]. Return file paths only."
- This scopes everything else. If you don't know where the code lives, nothing else matters.

**Call 2 — Contracts:** "In [files from Call 1], what are the function signatures, model schemas, and API contracts? Return signatures and types only, no implementation."
- This tells you what you can't break.

**Call 3 — Patterns:** "Find one existing example in the codebase of [the type of change needed — e.g., adding a new endpoint, adding a new model field, adding a new React component]. Return the file path and the pattern with file:line refs."
- This tells you how to write the new code consistently.

### Optional Calls (when relevant)

**Call 4 — Tests:** "What tests exist for [files from Call 1]? Return test file paths and what they cover."
- Only needed if the plan involves changing existing behavior.

**Call 5 — Docs/History:** "Check docs/plans/ and docs/reviews/ for any previous work on [feature/area]. Summarize decisions and open questions."
- Only needed if the feature has been attempted before or has known constraints.

### Rules for Research Calls

- **Maximum 5 calls per plan.** If you need more, the task is too big — ask the user to split it.
- Each call should return in **under 20 lines of output.** If the research agent returns more, the question was too broad.
- Do not re-read files the research agent already summarized. Trust its output.

## Plan Template

Write plan to `docs/plans/[descriptive-name].md`.

```markdown
# [Task Name] Implementation Plan

## Overview
[What is changing and why — reference research findings]

## Current State
[What exists now — specific files with file:line refs from research]

## Out of Scope
- [Item]

## Phase 1: [Name]
### Changes Required
- **File:** `path/to/file:line` — [what and why]

### Success Criteria
- [ ] [Specific testable outcome]
- [ ] Tests pass for changed modules

## Phase N: Tests
### Changes Required
- **File:** `tests/test_new.py` — [new tests, modeled on pattern from research Call 3]

### Success Criteria
- [ ] New tests pass
- [ ] Coverage maintained

## Rollback
[How to safely revert]
```

**Every `### Changes Required` must include at least one `file:line` reference.** If you cannot be that specific, you need another research call.

## Completion

```text
Plan: [Title]
Location: docs/plans/[filename]
Phases: [count]
Files affected: [list]
Research calls made: [count]

NEXT: /fb-execute docs/plans/[filename]
```
