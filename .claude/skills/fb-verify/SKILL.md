---
name: fb-verify
description: Verify implementation against the plan and produce a review report.
argument-hint: "<plan>"
allowed-tools: Read Write Edit Grep Glob Bash Agent
---

# Verify Implementation

Validate that implementation matches plan intent and project quality standards.

## Workflow

1. Read the plan fully.
2. Inspect actual code changes against each phase's `### Changes Required`.
3. Use the `test-runner` agent to run the full test suite and report results.
4. Check project conventions (see CLAUDE.md files):
   - Tests pass
   - Coverage maintained
   - No secrets committed
   - Conventions followed
   - Model contracts stable
5. Record deviations and risks.
6. Write report to `docs/reviews/[plan-name]-review.md`.
7. Update ticket status to `reviewed` (if a ticket exists).

## Review Report

```markdown
# Review: [Plan Name]

## Implementation Status
- Phase 1: [complete/partial/missing]

## Automated Verification Results
- [test command]: [pass/fail — N tests]
- Coverage: [X%]

## Findings
### Matches Plan
- [confirmed item with file:line evidence]

### Deviations
- [deviation] — Impact: [low/med/high] — [accept/fix]

### Risks
- [gap or concern]

## Recommendation
[Ready for commit / needs fixes]
```

## Convention Feedback Loop

After writing the review, check if any findings represent a new pattern not already covered by CLAUDE.md. If so, propose a specific addition (don't edit directly — present for user approval).

## Update Progress Log

Append to `PROGRESS.md`:

```markdown
### [date] — Verify: [Plan Name]
- **Result:** [ready for commit / needs fixes]
- **Tests:** [pass/fail — count]
- **Coverage:** [X%]
- **Issues:** [count critical, count warnings]
```

## Completion

```text
Verified: [Plan Name]
Tests: [pass/fail]
Coverage: [X%]
Issues: [N critical, N warnings]
Report: docs/reviews/[filename]

NEXT: /fb-git-commit
```

Start a new conversation before committing.
