# Overview Analysis Table Implementation Plan

## Overview
Add a post-run data table to `OverviewAnalysisPage` that appears after the user clicks Run Analysis. The table displays per-line production metrics grouped by the user's selected "Group Data By" value (Month, Week, Day, Shift, Run). Mock data in `AnalysisContext` will be extended to include table rows keyed to the active `groupBy` at run time.

## Current State
- `src/pages/OverviewAnalysisPage.jsx:1–47` — header + KPI grid only, no table
- `src/pages/OverviewAnalysisPage.module.css:1–47` — page/header/kpiGrid styles only
- `src/context/AnalysisContext.jsx:33–67` — `MOCK_RESULTS` contains `totalColors`, `totalLines`, and `kpis`; no row-level data
- `src/context/AnalysisContext.jsx:134–142` — `runAnalysis()` applies a static `MOCK_RESULTS` after 600ms; does not capture current `groupBy`

## Out of Scope
- Real API integration (remains mock)
- Sorting, filtering, or pagination of the table
- Export / print functionality
- Color Analysis page changes

---

## Phase 1: Extend `AnalysisContext` Mock Data with Table Rows
**Completed:** 2026-04-08
**Files changed:** `src/context/AnalysisContext.jsx`

### Changes Required

- **File:** `src/context/AnalysisContext.jsx:33` — Insert `buildMockRows(groupBy)` function **before** the `MOCK_RESULTS` constant (line 33). The function returns an array of row objects — one per line × group-option combination. Each row shape:

  ```js
  {
    line,           // 'L-19' … 'L-22'  (use existing LINES values)
    groupedOption,  // value depends on groupBy (see mapping below)
    duration,       // string, e.g. '8.0 hrs'
    runTime,        // string, e.g. '7.2 hrs'
    unplannedDT,    // string, e.g. '0.5 hrs'
    plannedDT,      // string, e.g. '0.3 hrs'
    oee,            // number (%), e.g. 82.3
    availability,   // number (%), e.g. 87.4
    performance,    // number (%), e.g. 91.2
    quality,        // number (%), e.g. 94.7
    infeed,         // number (units/hr), e.g. 1240
    outfeed,        // number (units/hr), e.g. 1185
    scrap,          // number (units), e.g. 55
    scrapPct,       // number (%), e.g. 4.4
    targetRate,     // number (units/hr), e.g. 1300
    actualRate,     // number (units/hr), e.g. 1185
  }
  ```

  **Group label mapping** (all 5 `groupBy` values must be covered):
  | `groupBy` | `groupedOption` values used |
  |-----------|----------------------------|
  | `month`   | `'Jan'`, `'Feb'`, `'Mar'`  |
  | `week`    | `'Week 1'`, `'Week 2'`, `'Week 3'` |
  | `day`     | `'2025-01-06'`, `'2025-01-07'`, `'2025-01-08'` |
  | `shift`   | `'Day Shift'`, `'Night Shift'`, `'Weekend'` |
  | `run`     | `'WO-10021'`, `'WO-10022'`, `'WO-10023'` |

  Use lines `['L-19', 'L-20', 'L-21', 'L-22']` (subset of `LINES` at `AnalysisContext.jsx:19`). Generate 4 lines × 3 group options = 12 rows. Vary metrics realistically (OEE 75–92, availability 82–95, etc.). Default (unknown `groupBy`) falls back to month labels.

- **File:** `src/context/AnalysisContext.jsx:138–139` — Replace the static `setAnalysisResults(MOCK_RESULTS)` call (currently line 139) with:
  ```js
  setAnalysisResults({ ...MOCK_RESULTS, rows: buildMockRows(groupBy) })
  ```
  `groupBy` is already in scope as a closed-over state variable at the point `runAnalysis` is defined (line 134).

### Success Criteria
- [x] `analysisResults.rows` is an array when `groupBy` is any of the 5 values
- [x] Each row object contains all 16 fields listed above
- [x] Rows change (different `groupedOption` values) when `groupBy` changes between runs

---

## Phase 2: Add Table to `OverviewAnalysisPage`
**Completed:** 2026-04-08
**Files changed:** `src/pages/OverviewAnalysisPage.jsx`, `src/pages/OverviewAnalysisPage.module.css`

### Changes Required

- **File:** `src/pages/OverviewAnalysisPage.jsx:1–47` — After the `.kpiGrid` div, conditionally render a `<RunAnalysisTable>` helper component (co-located, non-exported) when `analysisResults?.rows` exists and is non-empty.

  **Co-located helper** (defined above `OverviewAnalysisPage` in the same file):
  ```jsx
  function RunAnalysisTable({ rows, groupBy }) { ... }
  ```
  - Renders a `<table>` with a sticky header row
  - Column order: Line | Grouped Option | Duration | Run Time | Unplanned DT | Planned DT | OEE | AVA | PER | QUAL | Infeed | Outfeed | Scrap | Scrap % | Target Rate | Actual Rate
  - "Grouped Option" column header label uses the `GROUP_LABELS` map already defined at `OverviewAnalysisPage.jsx:15`
  - OEE/AVA/PER/QUAL cells display the number with a `%` suffix
  - Scrap % cells display with a `%` suffix

- **File:** `src/pages/OverviewAnalysisPage.jsx:15` — Pass `groupBy` down to `RunAnalysisTable` via props (already destructured from `useAnalysis()`)

- **File:** `src/pages/OverviewAnalysisPage.module.css` — Add table styles:
  - `.tableSection` — section wrapper with a subtle heading "Post Run Analysis"
  - `.tableWrapper` — `overflow-x: auto` scroll container
  - `.table` — `width: 100%`, `border-collapse: collapse`, `font-size: 0.82rem`
  - `.th` — sticky header, uses `var(--color-surface-2)` background, `var(--color-text-primary)` text, `padding: 0.5rem 0.75rem`, `text-align: left`, `white-space: nowrap`, border-bottom
  - `.td` — `padding: 0.45rem 0.75rem`, `border-bottom: 1px solid var(--color-border)`, `white-space: nowrap`
  - `.trEven` — subtle alternating row background (`var(--color-surface-1)`)
  - Responsive: `.tableWrapper` handles overflow via horizontal scroll (no column hiding needed)

### Success Criteria
- [x] Table does not render before Run Analysis is clicked (`analysisResults` is null)
- [x] Table renders immediately after `isRunning` transitions to false and `analysisResults.rows` is populated
- [x] "Grouped Option" column header updates to the correct label (Month / Week / Day / Shift / Run) based on `groupBy`
- [x] All 16 columns are visible (horizontal scroll on narrow viewports)
- [x] OEE, AVA, PER, QUAL show `%` suffix
- [x] Styles use CSS Modules and CSS custom properties (no inline styles)

---

## Rollback
Both phases touch only three files (`AnalysisContext.jsx`, `OverviewAnalysisPage.jsx`, `OverviewAnalysisPage.module.css`). To revert: restore each file from the last commit (`git checkout HEAD -- <file>`). No schema or API changes are involved.
