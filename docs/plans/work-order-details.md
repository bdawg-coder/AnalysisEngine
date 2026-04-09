# Work Order Details — Product Run Drill-Down Plan

## Overview

Extend `ProductRunPage` to mirror `OverviewAnalysisPage`'s table behavior (matching layout/columns when `groupBy === 'run'`), then add row-click navigation to a new `WorkOrderDetailsPage`. The details page has four sections: summary header, tool usage breakdown, state timeline visualization, and a resizable split-pane analysis area with independent per-panel tab state.

## Current State

- `src/pages/ProductRunPage.jsx` — KPI grid only; no table (`OverviewAnalysisPage.jsx` has the full `RunAnalysisTable`)
- `src/pages/OverviewAnalysisPage.jsx:1–115` — `RunAnalysisTable` co-located component at lines ~34–68; all 16 columns defined there
- `src/context/AnalysisContext.jsx:216–220` — state fields: `analysisType`, `groupBy`, `selectedLines`; `analysisResults.rows[]` shape well-defined
- `src/context/AnalysisContext.jsx:280–284` — `analysisResults` set on run; no `selectedWorkOrder` state exists
- `src/components/layout/MainContent.jsx:10–23` — `product_run` branch renders `<ProductRunPage />` unconditionally (no sub-page routing)
- No `WorkOrderDetailsPage.jsx` exists yet

## Out of Scope

- Real API integration (all data remains mock)
- Actual chart/graph implementations in Trending and Realtime tabs (placeholder UI only)
- Notes persistence (local state only)
- Export / print of details page
- Mobile-responsive layout for split pane

---

## Phase 1: AnalysisContext — Add `selectedWorkOrder` State
**Completed:** 2026-04-09
**Files changed:** `src/context/AnalysisContext.jsx`

Wire up the navigation state that drives drill-down routing.

### Changes Required

- **File:** `src/context/AnalysisContext.jsx:220` — Add new state field after existing fields:
  ```js
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null)
  ```
  `selectedWorkOrder` is `null` or one row object from `analysisResults.rows[]`
  (`{ line, groupedOption, startTime, endTime, duration, runTime, unplannedDT, plannedDT, oee, availability, performance, quality, infeed, outfeed, scrap, scrapPct, targetRate, actualRate }`)

- **File:** `src/context/AnalysisContext.jsx` — Expose both `selectedWorkOrder` and `setSelectedWorkOrder` through the context value object (same pattern used for `setGroupBy`, `setSelectedLines`, etc.)

- **File:** `src/context/AnalysisContext.jsx` — In `runAnalysis()`, reset `selectedWorkOrder` to `null` when a new run starts (before the `setIsRunning(true)` call), so a stale selection is cleared when the user re-runs

### Success Criteria

- [x] `useAnalysis()` consumers can destructure `selectedWorkOrder` and `setSelectedWorkOrder`
- [x] `selectedWorkOrder` starts as `null`
- [x] Calling `setSelectedWorkOrder(row)` with a row object updates the value
- [x] Running analysis resets `selectedWorkOrder` to `null`

---

## Phase 2: ProductRunPage — Add RunAnalysisTable with Row Navigation
**Completed:** 2026-04-09
**Files changed:** `src/pages/ProductRunPage.jsx`, `src/pages/ProductRunPage.module.css`

Mirror `OverviewAnalysisPage`'s table exactly, add row click to navigate.

### Changes Required

- **File:** `src/pages/ProductRunPage.jsx` — Copy the `RunAnalysisTable` co-located component from `src/pages/OverviewAnalysisPage.jsx:~34–68` into `ProductRunPage.jsx` as a non-exported function. Exact same columns and structure; the only addition is an `onRowClick` prop handler:
  - `RunAnalysisTable` receives `{ rows, groupBy, onRowClick }`
  - Each `<tr>` gets `onClick={() => onRowClick(row)}` and a `.trClickable` CSS class (pointer cursor, hover highlight)
  - Pass `onRowClick` through from `ProductRunPage` → calls `setSelectedWorkOrder(row)`

- **File:** `src/pages/ProductRunPage.jsx` — Destructure `groupBy`, `analysisResults`, `isRunning`, `setSelectedWorkOrder` from `useAnalysis()`. Render `<RunAnalysisTable>` below the KPI grid when `analysisResults?.rows` exists (same conditional as `OverviewAnalysisPage`):
  ```jsx
  {analysisResults?.rows?.length > 0 && (
    <RunAnalysisTable
      rows={analysisResults.rows}
      groupBy={analysisResults.groupBy}
      onRowClick={setSelectedWorkOrder}
    />
  )}
  ```

- **File:** `src/pages/ProductRunPage.module.css` — Add table styles (`.tableSection`, `.tableWrapper`, `.table`, `.th`, `.td`, `.trEven`, `.trClickable`) — copy from `src/pages/OverviewAnalysisPage.module.css` and add `.trClickable { cursor: pointer; } .trClickable:hover { background: var(--color-surface-2); }`

### Success Criteria

- [x] Table renders below KPI grid after Run Analysis completes
- [x] Table columns, headers, and formatting match `OverviewAnalysisPage` exactly
- [x] Clicking a row calls `setSelectedWorkOrder` with the row data
- [x] Hovering a row shows pointer cursor and highlight

---

## Phase 3: MainContent — Route to WorkOrderDetailsPage
**Completed:** 2026-04-09
**Files changed:** `src/components/layout/MainContent.jsx`, `src/pages/WorkOrderDetailsPage.jsx` (stub), `src/pages/WorkOrderDetailsPage.module.css` (stub)

### Changes Required

- **File:** `src/components/layout/MainContent.jsx:3` — Add import:
  ```js
  import WorkOrderDetailsPage from '../../pages/WorkOrderDetailsPage'
  ```

- **File:** `src/components/layout/MainContent.jsx:8` — Destructure `selectedWorkOrder` from `useAnalysis()` alongside existing destructured values

- **File:** `src/components/layout/MainContent.jsx:10–23` — Modify the `product_run` branch: when `selectedWorkOrder` is set, render `WorkOrderDetailsPage` instead of `ProductRunPage`:
  ```js
  if (analysisType === 'product_run') {
    if (!isRunning && !analysisResults) return <OnboardingScreen ... />
    if (selectedWorkOrder) return <WorkOrderDetailsPage />
    return <ProductRunPage />
  }
  ```

### Success Criteria

- [x] Clicking a row in `ProductRunPage` transitions the view to `WorkOrderDetailsPage`
- [x] `ProductRunPage` and `ColorAnalysisPage` still render correctly when `selectedWorkOrder` is null
- [x] Clearing `selectedWorkOrder` (via back button in Phase 4) returns to `ProductRunPage`

---

## Phase 4: WorkOrderDetailsPage — Header + Tool Breakdown + Back Navigation
**Completed:** 2026-04-09
**Files changed:** `src/pages/WorkOrderDetailsPage.jsx`, `src/pages/WorkOrderDetailsPage.module.css`

Create the page shell, header summary, and tool usage section.

### Changes Required

- **New file:** `src/pages/WorkOrderDetailsPage.jsx` — Component reads `selectedWorkOrder` and `setSelectedWorkOrder` from `useAnalysis()`.

  **Back button:** `<button onClick={() => setSelectedWorkOrder(null)}>← Back to Product Run</button>` — renders at top of page

  **Header section** — display these fields from `selectedWorkOrder`:
  | Label | Field |
  |---|---|
  | Line | `row.line` |
  | Work Order | `row.groupedOption` (WO number when groupBy=run) |
  | Description | mock: `MOCK_WO_DESCRIPTIONS[row.groupedOption]` |
  | Start Time | `row.startTime` |
  | End Time | `row.endTime` |
  | Total Duration | `row.duration` |

  **Mock WO descriptions** — co-located constant object in the file:
  ```js
  const MOCK_WO_DESCRIPTIONS = {
    'WO-10021': 'Black PE Pipe 1.25" OD',
    'WO-10022': 'Red HDPE Conduit 2.0" OD',
    'WO-10023': 'White PVC Tube 0.75" OD',
  }
  ```

  **Tool breakdown section** — co-located `ToolBreakdownTable` function component:
  - Receives `tools` array (generated by `buildMockTools(workOrder)` co-located helper function)
  - Columns: Tool | Material Consumed | Max Capacity | % Tool Life Used
  - Tools to display: Die, Extruder Screw, Extruder Barrel, Co-Extruder Screw S1, Co-Extruder Screw S2, Co-Extruder Barrel S1, Co-Extruder Barrel S2

  **`buildMockTools(workOrder)` co-located helper** — returns 7 tool objects:
  ```js
  { toolName, materialConsumed, maxCapacity, pctLifeUsed }
  // e.g. { toolName: 'Die', materialConsumed: '842 lbs', maxCapacity: '50,000 lbs', pctLifeUsed: 12.4 }
  ```
  Vary values by `workOrder.groupedOption` for realism. `pctLifeUsed` color-coded: ≥80% = red warning, ≥50% = yellow, else green (use CSS classes `.lifeLow`, `.lifeMid`, `.lifeHigh`).

- **New file:** `src/pages/WorkOrderDetailsPage.module.css` — styles for `.page`, `.backBtn`, `.header`, `.headerGrid` (CSS grid of label/value pairs), `.section`, `.sectionTitle`, `.toolTable`, `.th`, `.td`, `.lifeLow`, `.lifeMid`, `.lifeHigh`

### Success Criteria

- [x] Back button navigates back to `ProductRunPage` (clears `selectedWorkOrder`)
- [x] Header shows correct line, WO number, description, start/end, duration
- [x] Tool breakdown table shows all 7 tools with material, capacity, and life % columns
- [x] `pctLifeUsed` cells are color-coded (green/yellow/red)

---

## Phase 5: WorkOrderDetailsPage — State Timeline Visualization
**Completed:** 2026-04-09
**Files changed:** `src/pages/WorkOrderDetailsPage.jsx`, `src/pages/WorkOrderDetailsPage.module.css`

Add a horizontal timeline bar chart showing machine states during the run.

### Changes Required

- **File:** `src/pages/WorkOrderDetailsPage.jsx` — Add co-located `StateTimeline` function component:
  - Receives `states` array from `buildMockStates(workOrder)` co-located helper
  - Renders a `<div>` with horizontally-proportional colored segments
  - Each segment width = `(state.durationMs / totalDurationMs) * 100 + '%'`
  - Colors per state type (co-located constant `STATE_COLORS`):
    ```js
    const STATE_COLORS = {
      Running: 'var(--color-success)',
      'Planned DT': 'var(--color-warning)',
      'Unplanned DT': 'var(--color-danger)',
      Idle: 'var(--color-text-muted)',
    }
    ```
  - Hover tooltip (CSS `:hover` + sibling div, no JS state needed for basic impl):
    - On hover, show: state name, duration (formatted), start time, end time
    - If `state.downtimeReason` exists, show parent/child reason

  **`buildMockStates(workOrder)` helper** — returns array of state objects:
  ```js
  { stateName, startTime, endTime, durationMs, downtimeReason }
  // downtimeReason is null or { parent: 'Equipment', child: 'Die Jam' }
  ```
  Generate ~8–12 states covering the full run window. Vary by `workOrder.groupedOption`.

- **File:** `src/pages/WorkOrderDetailsPage.module.css` — Add `.timeline`, `.timelineBar`, `.timelineSegment`, `.tooltip` (position absolute, hidden by default; shown on `.timelineSegment:hover .tooltip`)

### Success Criteria

- [x] Timeline renders as a full-width horizontal bar divided into colored segments
- [x] Segment widths are proportional to their duration
- [x] Hovering a segment shows a tooltip with state name, duration, start/end times
- [x] Downtime segments show parent/child reason in tooltip
- [x] State colors match the type (green=running, yellow=planned DT, red=unplanned DT, gray=idle)

---

## Phase 6: WorkOrderDetailsPage — Split-Pane Analysis Section
**Completed:** 2026-04-09
**Files changed:** `src/pages/WorkOrderDetailsPage.jsx`, `src/pages/WorkOrderDetailsPage.module.css`

The primary feature. Two independent panels, each with its own tab system, with a drag-to-resize divider.

### Changes Required

- **File:** `src/pages/WorkOrderDetailsPage.jsx` — Add co-located components:

  **`SplitPane` component:**
  - Renders two child panels with a draggable divider between them
  - Uses `useState` for `leftWidthPct` (default: 50)
  - Divider `onMouseDown` sets a ref flag; `document` `mousemove`/`mouseup` listeners (added/removed in a `useEffect`) update `leftWidthPct` as user drags
  - Left panel: `width: leftWidthPct + '%'`; right panel: `width: (100 - leftWidthPct) + '%'`
  - Min width per panel: 20% (clamped in mousemove handler)
  - Props: `leftPanel` (ReactNode), `rightPanel` (ReactNode)

  **`AnalysisPanel` component:**
  - Receives `panelId` ('left' | 'right') — used only for labeling
  - Local `useState` for `activeTab` (default: `'trending'`)
  - Tab options: `[{ id: 'trending', label: 'Trending' }, { id: 'realtime', label: 'Realtime' }, { id: 'notes', label: 'Notes' }, { id: 'raw_material', label: 'Raw Material' }]`
  - Renders a tab bar + content area; tab state is fully local (no context, no props for tab state)
  - Tab content is placeholder UI for all tabs (e.g., `<p>Trending chart will appear here.</p>`)
  - Notes tab: `<textarea>` with local state for text — no persistence needed yet

  **Integration into `WorkOrderDetailsPage`:**
  ```jsx
  <section className={styles.splitSection}>
    <h2 className={styles.sectionTitle}>Analysis</h2>
    <SplitPane
      leftPanel={<AnalysisPanel panelId="left" />}
      rightPanel={<AnalysisPanel panelId="right" />}
    />
  </section>
  ```

- **File:** `src/pages/WorkOrderDetailsPage.module.css` — Add styles:
  - `.splitSection` — section wrapper
  - `.splitContainer` — `display: flex; height: 600px; overflow: hidden`
  - `.splitPanel` — `overflow-y: auto; padding: 1rem`
  - `.divider` — `width: 5px; background: var(--color-border); cursor: col-resize; flex-shrink: 0; transition: background 0.15s` + hover: `var(--color-accent)`
  - `.tabBar` — flex row of tab buttons
  - `.tabBtn` — base tab style; `.tabBtnActive` — active highlight with border-bottom in accent color
  - `.tabContent` — content area below tabs

### Success Criteria

- [x] Two panels render side-by-side taking full width of the page
- [x] Dragging the divider resizes both panels proportionally
- [x] Each panel has its own Trending / Realtime / Notes / Raw Material tab bar
- [x] Switching tabs in the left panel does NOT change the right panel's active tab
- [x] Both panels can show different tabs simultaneously
- [x] Notes tab shows a textarea; typing in left Notes does not affect right Notes
- [x] Panels respect a minimum width of ~20%

---

## Rollback

All changes are additive. To revert:
- Delete `src/pages/WorkOrderDetailsPage.jsx` and `WorkOrderDetailsPage.module.css`
- Restore `src/context/AnalysisContext.jsx`, `src/pages/ProductRunPage.jsx`, `src/pages/ProductRunPage.module.css`, `src/components/layout/MainContent.jsx` from git (`git checkout HEAD -- <file>`)
