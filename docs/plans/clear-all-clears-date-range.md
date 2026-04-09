# Clear All Clears Date Range Fields Implementation Plan

## Overview
The "Clear All" button in SideNav resets `startDate` and `endDate` to hardcoded defaults
(`'2025-01-01'` / `'2025-03-31'`) instead of empty strings. The user expects clicking
"Clear All" to visually empty the Date Range fields, consistent with what a clear operation implies.

## Current State
- **`src/context/AnalysisContext.jsx:279–280`** — `clearAll()` calls `setStartDate('2025-01-01')` and
  `setEndDate('2025-03-31')`, resetting to stale hardcoded dates.
- **`src/components/layout/SideNav.jsx:143,150`** — Date inputs are controlled by `startDate` /
  `endDate` from context. They will show whatever the context holds.
- **`src/context/AnalysisContext.jsx:252–255`** — `canRun` already checks `startDate !== '' && endDate !== ''`,
  so empty strings disable Execute correctly — no extra guard needed.

## Out of Scope
- Changing the initial/default values set when the app first loads
- Adding date validation beyond what already exists
- Clearing `woSearch` local state in SideNav (not part of this request)

## Phase 1: Reset Dates to Empty in clearAll
### Changes Required
- **[`src/context/AnalysisContext.jsx:279`](src/context/AnalysisContext.jsx#L279)** — Change `setStartDate('2025-01-01')` → `setStartDate('')`
- **[`src/context/AnalysisContext.jsx:280`](src/context/AnalysisContext.jsx#L280)** — Change `setEndDate('2025-03-31')` → `setEndDate('')`

Both lines are inside `clearAll()` which begins at line 275. Setting empty strings causes the controlled date inputs in `SideNav.jsx:143` and `SideNav.jsx:150` to visually clear, and `canRun` at line 252–255 already guards against empty strings so Execute disables correctly.

**Completed:** 2026-04-09 — `src/context/AnalysisContext.jsx`

### Success Criteria
- [x] Clicking "Clear All" empties both Date Range input fields
- [x] The Execute button becomes disabled after clearing (since `canRun` requires non-empty dates)
- [x] Entering new dates after clearing re-enables Execute
- [x] Date error message does not appear after clearing (both fields empty → no comparison)

## Rollback
Revert `setStartDate('')` → `setStartDate('2025-01-01')` and `setEndDate('')` →
`setEndDate('2025-03-31')` in `src/context/AnalysisContext.jsx:279–280`.
