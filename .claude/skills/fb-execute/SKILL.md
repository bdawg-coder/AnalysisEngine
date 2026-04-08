---
name: fb-execute
description: Execute one phase of an approved implementation plan.
argument-hint: "<plan>"
allowed-tools: Read Edit Write Grep Glob Bash Agent
---

# Execute Plan

Implement exactly one phase per invocation, verify it, update the plan, then stop.

## Pre-Flight

Before touching any code:

1. Read the plan fully. Identify the first unchecked phase.
2. Read CLAUDE.md (root + any relevant subdirectory CLAUDE.md files) for conventions.
3. Read **only** the files listed in the current phase's `### Changes Required`. Do not explore.
4. If the phase references files not in the plan, use the `research` agent to locate them — do not search yourself.

**Context budget:** If you have read more than 15 files before your first edit, stop. You are outside the smart zone. Summarize what you know, report back, and let the user decide whether to split the phase.

## Worktree Support

Multiple plans can execute in parallel via `Agent(isolation="worktree", prompt="/fb-execute docs/plans/plan.md")`. Each gets an isolated branch. Plan features to be file-disjoint at planning time.

## Rules

1. Implement only the current phase.
2. Follow conventions in the CLAUDE.md files — do not invent new patterns.
3. Write code in small, testable increments. Save each file after completing a logical unit of change.
4. Do not refactor code outside the current phase's scope, even if you see opportunities.

## Verification

After all changes in the phase are written:

1. Use the `test-runner` agent to run tests scoped to changed files.
2. If tests fail, read the failure output and fix. You get **two fix attempts** per failing test. After two failures on the same test, stop and report — do not loop.
3. If the phase has manual verification steps, list them clearly in the completion summary for the user.

## If Plan Diverges from Code

1. Explain the mismatch (expected vs found, with `file:line` refs).
2. Propose the minimal adjustment that preserves the plan's intent.
3. **Wait for user approval.** Do not proceed.
4. After approval, record the deviation in the plan:

```markdown
## Deviations
- **Phase N:** [what changed and why] — approved [date]
```

## Update Plan

After successful verification:

1. Check off completed items in the phase checklist.
2. Add a `**Completed:**` line under the phase header with files changed.
3. If this is the final phase, update ticket status to `implemented` (if a ticket exists).

## Update Progress Log

Append to `PROGRESS.md`:

```markdown
### [date] — Phase [N] of [Plan Name]
- **Files changed:** [list]
- **Tests:** [pass/fail — count]
- **Deviations:** [any, or "none"]
```

## Completion

```text
Phase [N]: [Name] — complete
Changes: [files changed]
Tests: [pass/fail — N passed, N failed]
Progress: [X/Y] phases
Manual checks: [list any, or "none"]

NEXT: /fb-execute [plan path]
```

When all phases done, recommend `/fb-verify`.

Start a new conversation before running the next phase.
