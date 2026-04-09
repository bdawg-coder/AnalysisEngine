# Real-Time Indicators & Right Panel Time Control — Implementation Plan

## Overview

Two UX enhancements for the Work Order Details right panel:

1. **Deviation Indicators** — Visual badges in the Real-Time snapshot table flagging when `actual` deviates from `setpoint` by ≥ 10 units (high = red ▲, low = blue ▼, normal = no badge).
2. **Right Panel Independent Time Range** — A single `start`/`end` datetime selector mounted above all right-panel tabs, replacing the per-tab inline inputs and decoupled from Work Order dates and left-panel filters.

All changes are confined to `WorkOrderDetailsPage.jsx` and `WorkOrderDetailsPage.module.css`.

---

## Current State

| What | Where |
|------|-------|
| `SnapshotTable` renders 3-column rows: label / setpoint / actual | `WorkOrderDetailsPage.jsx:562–583` |
| `SnapshotTable` props: `selectedTags`, `timestamp`, `workOrder` | `WorkOrderDetailsPage.jsx:527` |
| `interpolate(tag)` returns `{ setpoint, actual }` per row | `WorkOrderDetailsPage.jsx:535–548` |
| `AnalysisPanel` state: `trendStart`/`trendEnd` (init from WO dates) | `WorkOrderDetailsPage.jsx:659–660` |
| `AnalysisPanel` state: `matRangeStart`/`matRangeEnd` (init from WO dates) | `WorkOrderDetailsPage.jsx:657–658` |
| Trending tab datetime-local inputs | `WorkOrderDetailsPage.jsx:708–717` |
| Real-Time single-point datetime-local input | `WorkOrderDetailsPage.jsx:754–761` |
| Existing CSS classes for snapshot table | `WorkOrderDetailsPage.module.css` — `snapshotTd`, `snapshotTdNum`, `snapshotGroupHeader` |
| Existing CSS classes for trend time inputs | `WorkOrderDetailsPage.module.css` — `trendRangeRow`, `trendRangeInput`, `trendRangeLabel` |

---

## Out of Scope

- Backend/API changes — all data is currently mocked
- Left panel filter behavior
- Any tab outside the right panel (Trending, Real-Time, Raw Material already covered)
- Persisting time range across page navigations

---

## Phase 1: Real-Time Deviation Indicators

**Completed:** 2026-04-09 — `src/pages/WorkOrderDetailsPage.jsx:562–592`, `src/pages/WorkOrderDetailsPage.module.css`

### Changes Required

**File:** `src/pages/WorkOrderDetailsPage.jsx:562–566` — Add a 4th header cell `"Status"` to the snapshot table header row alongside Zone / Setpoint / Actual.

**File:** `src/pages/WorkOrderDetailsPage.jsx:575–583` — In each row, compute `deviation = actual - setpoint` and render a 4th `<td>` containing a badge:
- `deviation >= 10` → `<span className={styles.deviationHigh}>▲ High</span>`
- `deviation <= -10` → `<span className={styles.deviationLow}>▼ Low</span>`
- otherwise → `<span className={styles.deviationNormal}>—</span>`

No props change needed — `setpoint` and `actual` are already available inside the row loop.

**File:** `src/pages/WorkOrderDetailsPage.module.css` — Add three badge classes:
```css
.deviationHigh  { color: #fff; background: #c0392b; ... }
.deviationLow   { color: #fff; background: #2980b9; ... }
.deviationNormal{ color: #888; }
```
Also add `.snapshotTdStatus` for the 4th column (centered, fixed width).

### Success Criteria

- [x] Rows with `actual ≥ setpoint + 10` show red ▲ High badge
- [x] Rows with `actual ≤ setpoint - 10` show blue ▼ Low badge
- [x] Rows within ±10 show a neutral `—`
- [x] Table header has 4 columns and aligns correctly
- [x] No visual regression on group header rows (they use `colSpan` — bump to `colSpan={4}`)

---

## Phase 2: Right Panel Independent Time Range Selector

**Completed:** 2026-04-09 — `src/pages/WorkOrderDetailsPage.jsx`, `src/pages/WorkOrderDetailsPage.module.css`

### Changes Required

**File:** `src/pages/WorkOrderDetailsPage.jsx:653–660` — Replace the four per-feature time state variables with two shared ones:
```js
// remove: trendStart, trendEnd, matRangeStart, matRangeEnd
const [panelStart, setPanelStart] = useState('');  // free-form, no WO default
const [panelEnd,   setPanelEnd]   = useState('');
```
Initialize to empty strings so the selector is truly independent of the Work Order dates.

**File:** `src/pages/WorkOrderDetailsPage.jsx:651` — Insert a new co-located `PanelTimeRange` component just before `AnalysisPanel` (line 652). Non-exported, single-file use:
```jsx
function PanelTimeRange({ start, end, onStartChange, onEndChange }) {
  // renders two datetime-local inputs + inline validation message
  // shows "End must be ≥ start" when end < start
}
```

**File:** `src/pages/WorkOrderDetailsPage.jsx:662` — Inside `AnalysisPanel`'s return, render `<PanelTimeRange>` immediately before the tab bar (`activeTab` buttons at line 668). Pass `panelStart`, `panelEnd`, `setPanelStart`, `setPanelEnd`.

**File:** `src/pages/WorkOrderDetailsPage.jsx:708–717` — Remove the `<div className={styles.trendRangeRow}>` block (Trending tab inline inputs). Pass `panelStart`/`panelEnd` to `<TrendChart rangeStart={panelStart} rangeEnd={panelEnd}>` at line 720.

**File:** `src/pages/WorkOrderDetailsPage.jsx:789–793` — Remove `matRangeStart`/`matRangeEnd` inline inputs near the Raw Material tab. Pass `panelStart`/`panelEnd` to `<RawMaterialPanel rangeStart={panelStart} rangeEnd={panelEnd}>` at line 790.

**File:** `src/pages/WorkOrderDetailsPage.jsx:754–761` — Keep the Real-Time single-point timestamp picker as-is (it selects a specific moment within the range). The range itself now comes from `panelStart`/`panelEnd`.

**File:** `src/pages/WorkOrderDetailsPage.module.css` — Add `.panelTimeRange` wrapper class (flex row, consistent spacing matching existing `trendRangeRow` style). Reuse or alias `trendRangeInput` / `trendRangeLabel` classes for the new component.

### Validation Logic (inside `PanelTimeRange`)

```js
const isInvalid = start && end && new Date(end) < new Date(start);
```
Show inline warning when `isInvalid` is true. Do not propagate invalid ranges to tabs.

### Success Criteria

- [x] Time range selector appears above all right-panel tabs (Trend, Real-Time, Raw Material)
- [x] Changing `panelStart`/`panelEnd` updates data in the currently active tab immediately
- [x] End < Start shows a validation error and does not update chart/table data
- [x] Selector values are not reset when switching tabs
- [x] Selector values are not affected by Work Order selection or left-panel filter changes
- [x] No duplicate time inputs remain in individual tabs

---

## Rollback

Both phases are isolated to two files. To revert:
- `git checkout src/pages/WorkOrderDetailsPage.jsx`
- `git checkout src/pages/WorkOrderDetailsPage.module.css`
