# Work Order Filter & Description Implementation Plan

## Overview

Three connected improvements to Work Order behavior: (1) make the WO filter field actually restrict results, (2) add a Work Order Description column to both analysis tables, and (3) surface the WO description in the WorkOrderDetailsPage header.

**Research findings:**
- `filterWorkOrder` state exists in context and gates `canRun`, but `runAnalysis()` and `buildMockRows()` never use it — filtering is a no-op today.
- `MOCK_FILTER_WOS` entries carry a `label` field (`"WO-10021 — Black PE Pipe 1.25\" OD"`) that contains the description after the em dash, but rows have no `workOrderDescription` field.
- Both `ProductRunPage.jsx` and `OverviewAnalysisPage.jsx` define an identical `COLUMNS` array (18 cols) — neither includes a description column.
- `WorkOrderDetailsPage` receives the selected row object via context and renders `workOrder.groupedOption` in the header; no description field is available there today.

## Current State

- `src/context/AnalysisContext.jsx:33-40` — `MOCK_FILTER_WOS` entries: `{ id, label, startTime, endTime }`. No `description` field.
- `src/context/AnalysisContext.jsx:141-179` — `buildMockRows()` takes `(groupBy, selectedLines, startDate, endDate)`. Ignores work order state entirely.
- `src/context/AnalysisContext.jsx:284-301` — `runAnalysis()` snapshots state but does not include `filterWorkOrder` in the snapshot and never filters rows.
- `src/pages/ProductRunPage.jsx:7-26` — `COLUMNS` array, 18 entries, no description column.
- `src/pages/OverviewAnalysisPage.jsx:7-26` — identical `COLUMNS` array, no description column.
- `src/pages/WorkOrderDetailsPage.jsx` — header shows `workOrder.groupedOption`; no description rendered.

## Out of Scope

- Real API/database integration (all data remains mocked)
- Filtering within Overview Analysis when groupBy is not "Run"
- Pagination or virtualization of table rows

---

## Phase 1: Data Layer — Filter + Description in Context

**Goal:** Wire `filterWorkOrder` into `runAnalysis`, and add `workOrderDescription` to each row when `groupBy === 'run'`.

**Completed:** 2026-04-09 — `src/context/AnalysisContext.jsx`

### Changes Required

- **`src/context/AnalysisContext.jsx:33-40`** — Add a `description` field to each `MOCK_FILTER_WOS` entry by extracting the text after ` — ` in the existing `label`. Example: `"WO-10021 — Black PE Pipe 1.25\" OD"` → `description: "Black PE Pipe 1.25\" OD"`.

- **`src/context/AnalysisContext.jsx:33` (after MOCK_FILTER_WOS)** — Add a lookup map `WO_DESCRIPTIONS` that maps `id → description` so `buildMockRows` can look up descriptions without iterating the array each time.

- **`src/context/AnalysisContext.jsx:141-179` (`buildMockRows`)** — Add an optional fifth parameter `filterWorkOrder`. When provided (truthy), filter the generated rows to only those whose `groupedOption` matches `filterWorkOrder.id` (or the WO label). Also, when `groupBy === 'run'`, populate a `workOrderDescription` field on each row by looking up `WO_DESCRIPTIONS[row.groupedOption]`. For other groupBy values, set `workOrderDescription: null`.

- **`src/context/AnalysisContext.jsx:284-301` (`runAnalysis`)** — Include `filterWorkOrder` in the state snapshot alongside `groupBy`, `selectedLines`, etc. Pass it as the fifth argument to `buildMockRows`.

### Success Criteria

- [x] Entering a Work Order in the filter and running analysis returns only rows matching that WO.
- [x] Running without a WO filter returns all rows (unchanged behavior).
- [x] Each row produced when `groupBy === 'run'` has a `workOrderDescription` field with the correct description string.
- [x] Rows for other groupBy values have `workOrderDescription: null` (no breakage).

---

## Phase 2: Work Order Description Column in Tables

**Goal:** Add a "Work Order Description" column to both analysis tables, visible when `groupBy === 'run'`.

**Completed:** 2026-04-09 — `src/pages/ProductRunPage.jsx`, `src/pages/OverviewAnalysisPage.jsx`

### Changes Required

- **`src/pages/ProductRunPage.jsx:7-26` (`COLUMNS` array)** — Insert a new column entry after the `groupedOption` entry:
  ```js
  { key: 'workOrderDescription', label: 'WO Description' }
  ```
  In the `RunAnalysisTable` component, conditionally render this column: show the cell only when `groupBy === 'run'` (same pattern as the dynamic `groupedOption` header). If `row.workOrderDescription` is null/undefined, render `—`.

- **`src/pages/OverviewAnalysisPage.jsx:7-26` (`COLUMNS` array)** — Same insertion, same conditional rendering logic. The OverviewAnalysisPage table does not have row click handlers, so no interaction changes needed.

### Success Criteria

- [x] "WO Description" column appears in Product Run Analysis table when `groupBy === 'run'`.
- [x] "WO Description" column appears in Overview Analysis table when `groupBy === 'run'`.
- [x] Column does not appear for other `groupBy` values (Color, Line, etc.).
- [x] Column displays the correct description for each WO row.
- [x] Cells where description is unavailable show `—` rather than blank/undefined.

---

## Phase 3: Work Order Description in Details Page Header

**Goal:** Display the WO description prominently in the `WorkOrderDetailsPage` header.

**Completed:** 2026-04-09 — `src/pages/WorkOrderDetailsPage.jsx`, `src/pages/WorkOrderDetailsPage.module.css`

### Changes Required

- **`src/pages/WorkOrderDetailsPage.jsx`** — In the page header section (where `workOrder.groupedOption` is currently rendered), add the `workOrder.workOrderDescription` below or adjacent to the WO number. Display it as a subtitle or secondary heading. If `workOrderDescription` is falsy, render nothing extra (graceful degradation).

### Success Criteria

- [x] Navigating to WorkOrderDetailsPage from ProductRunPage shows the WO description beneath/beside the WO number in the header.
- [x] If no description is available (e.g., `groupBy !== 'run'` scenario), the header renders cleanly without an empty subtitle.

---

## Rollback

All changes are confined to three files and are purely additive (new field, new column, new header text). To revert:
- Remove the `description` field from `MOCK_FILTER_WOS` entries and the `WO_DESCRIPTIONS` map.
- Remove `filterWorkOrder` from the `runAnalysis` snapshot and `buildMockRows` call.
- Remove the `workOrderDescription` column from both `COLUMNS` arrays.
- Remove the description subtitle from `WorkOrderDetailsPage` header.

No schema migrations, no API changes, no routing changes required.
