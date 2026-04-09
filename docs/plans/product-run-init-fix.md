# Product Run Analysis — Initialization Fix

## Overview

Product Run Analysis fails to initialize when navigated to directly because:
1. `analysisResults` starts as `null`, causing `MainContent.jsx:12` to show `OnboardingScreen` (no interactive Run button).
2. Even if the user clicks the SideNav "Run Analysis" button, `groupBy` defaults to `''`, which causes `buildMockRows` to fall back to monthly grouping — so row `groupedOption` values become time-period labels ("Jan", "Feb") instead of work order numbers ("WO-10021"). This breaks the `MOCK_WO_DESCRIPTIONS` lookup in `WorkOrderDetailsPage`, which expects WO-format keys.

When Overview Analysis is run first, it works because:
- `analysisResults` gets populated (non-null) → MainContent skips OnboardingScreen → ProductRunPage renders.
- If the user had set `groupBy = 'run'` during Overview Analysis, rows carry WO labels → WorkOrderDetailsPage shows correct data.

## Current State

- `src/context/AnalysisContext.jsx:1` — imports `createContext, useContext, useState, useMemo` (no `useEffect`)
- `src/context/AnalysisContext.jsx:216` — `groupBy` initial state is `''`
- `src/context/AnalysisContext.jsx:235-240` — `canRun` allows `analysisType === 'product_run'` with `groupBy === ''`
- `src/context/AnalysisContext.jsx:275-290` — `runAnalysis()` snapshots `groupBy` as-is; when empty, `buildGroupOptions` falls back to monthly (line 97)
- `src/context/AnalysisContext.jsx:86-95` — `buildGroupOptions('run', ...)` generates `WO-10021..WO-10026` labels (the only groupBy that produces WO numbers)
- `src/components/layout/MainContent.jsx:11-24` — product_run branch: OnboardingScreen when `!isRunning && !analysisResults`; no auto-trigger
- `src/pages/WorkOrderDetailsPage.jsx:339` — `MOCK_WO_DESCRIPTIONS[wo?.groupedOption]` — requires WO-format key

## Out of Scope

- Real API integration (currently all mock data)
- Auto-initialization for `color_analysis` (different UX requirements)
- WorkOrderDetailsPage showing live data for non-WO groupBy options

## Phase 1: Auto-initialize with correct groupBy default

**Completed:** 2026-04-09 — `src/context/AnalysisContext.jsx`

### Changes Required

Two targeted changes to `src/context/AnalysisContext.jsx`:

### Change 1 — Add `useEffect` to import

**File:** `src/context/AnalysisContext.jsx:1`

Add `useEffect` to the existing import:
```js
import { createContext, useContext, useState, useMemo, useEffect } from 'react'
```

### Change 2 — Smart default in `runAnalysis()`

**File:** `src/context/AnalysisContext.jsx:281` (the `const snap` line inside `runAnalysis`)

Replace the snapshot line with one that defaults `groupBy` to `'run'` for product_run (the only groupBy that produces WO-number labels compatible with WorkOrderDetailsPage):

```js
// Before
const snap = { groupBy, selectedLines, startDate, endDate }

// After
const effectiveGroupBy = groupBy || (analysisType === 'product_run' ? 'run' : 'month')
if (!groupBy) setGroupBy(effectiveGroupBy)
const snap = { groupBy: effectiveGroupBy, selectedLines, startDate, endDate }
```

This ensures: (a) the correct mock rows are generated, and (b) the SideNav groupBy selector updates to reflect the actual grouping used.

### Change 3 — Auto-run `useEffect` in `AnalysisContext`

**File:** `src/context/AnalysisContext.jsx` — insert after `runAnalysis()` closes (~line 290), before the `return` statement at line 292

```js
// Auto-initialize Product Run Analysis when navigating to it with no existing results
useEffect(() => {
  if (analysisType === 'product_run' && !analysisResults && !isRunning) {
    runAnalysis()
  }
}, [analysisType]) // eslint-disable-line react-hooks/exhaustive-deps
```

**Why only `[analysisType]` in deps:** The effect should only fire when `analysisType` changes to `'product_run'`, not on every `analysisResults` change (which would re-run after clearing results and cause loops). Stable identity of `runAnalysis` also makes it safe to omit.

### After-fix flow (direct navigation)

1. User sets `analysisType = 'product_run'` → effect fires
2. `runAnalysis()`: `canRun` = true → `setIsRunning(true)` → `effectiveGroupBy = 'run'` → `setGroupBy('run')`
3. During 600ms: `isRunning = true` → `MainContent:12` (`!isRunning`) is false → falls through → `ProductRunPage` renders
4. After 600ms: `analysisResults.rows` have `groupedOption = 'WO-10021...'` → table populated
5. User clicks row → `setSelectedWorkOrder({ line, groupedOption: 'WO-10021', ... })`
6. `MainContent:23`: `selectedWorkOrder` truthy → `WorkOrderDetailsPage` renders
7. `MOCK_WO_DESCRIPTIONS['WO-10021']` = `'Black PE Pipe 1.25" OD'` → data populates correctly

### Success Criteria

- [x] Navigating directly to Product Run Analysis loads the table (no manual Run click required)
- [x] Table rows have work order numbers (WO-10021, etc.) as the groupedOption label
- [x] Clicking a row navigates to WorkOrderDetailsPage
- [x] WorkOrderDetailsPage shows the work order description (not `—`) for mock WO rows
- [x] The SideNav `groupBy` selector reflects `'run'` after auto-initialization
- [x] Running Overview Analysis then switching to Product Run still works (no regression)
- [x] Clicking Back on WorkOrderDetailsPage returns to the ProductRunPage table

## Rollback

Revert three hunks in `src/context/AnalysisContext.jsx`:
1. Remove `useEffect` from import
2. Revert the `snap` line back to `const snap = { groupBy, selectedLines, startDate, endDate }`
3. Remove the auto-run `useEffect`
