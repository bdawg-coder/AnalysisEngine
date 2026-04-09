# Product Run UX Enhancements Plan

## Overview

Five targeted improvements to the Product Run Analysis experience:

1. **Tab bar scroll fix** — remove horizontal scroll from WorkOrderDetailsPage's analysis panel header
2. **Clear filter fix** — `clearAll` must preserve `analysisType` and stay on current page
3. **WO filter in SideNav** — optional Work Order selector that disables date range when set
4. **Trend tab overhaul** — side-by-side tag+chart layout, independent time controls bounded by WO
5. **Trend hover tooltips** — tooltip on SVG hover showing timestamp, tag name, and value

## Current State

- `src/pages/WorkOrderDetailsPage.module.css:255` — `.tabBar` has `overflow-x: auto`; `.tabBtn:266` has `white-space: nowrap` — these two rules together cause the tab header to scroll
- `src/context/AnalysisContext.jsx:260–273` — `clearAll` calls `setAnalysisType('')` which triggers navigation away from Product Run
- `src/context/AnalysisContext.jsx:213,302–322` — no `filterWorkOrder` state; context value exposes `startDate`/`endDate` but no WO filter
- `src/components/layout/SideNav.jsx:85–102` — date range inputs have no `disabled` condition; no WO search section exists
- `src/pages/WorkOrderDetailsPage.jsx:580–627` — `AnalysisPanel` renders TagSelector above TrendChart in a vertical flex column; no trend-specific time range state; TrendChart uses `workOrder.startTime/endTime` directly for X axis
- `src/pages/WorkOrderDetailsPage.jsx:272` — `TrendChart` signature: `{ workOrder, selectedTags, selectedTimestamp, onTimestampSelect }` — no hover or range props

## Out of Scope

- Real API integration for WO lookup
- Per-panel WO selection in WorkOrderDetailsPage
- Changing the Notes or Raw Material tabs
- Mobile layout

---

## Phase 1: Tab Bar Scroll Fix

**Completed:** 2026-04-09 — `src/pages/WorkOrderDetailsPage.module.css`

Removes horizontal scroll from the analysis panel tab header.

### Changes Required

- **File:** `src/pages/WorkOrderDetailsPage.module.css:255` — in `.tabBar`, remove `overflow-x: auto` and add `flex-wrap: wrap` so tabs wrap to a second line instead of scrolling. This is the minimal change; the `white-space: nowrap` on `.tabBtn` can stay since wrapping is now at the `.tabBar` level.

```css
.tabBar {
  display: flex;
  flex-wrap: wrap;               /* new — tabs wrap instead of scroll */
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-1);
  flex-shrink: 0;
  /* overflow-x: auto removed */
}
```

### Success Criteria

- [x] All four tabs (Trending, Realtime, Notes, Raw Material) are fully visible without horizontal scrolling
- [x] Tabs wrap to a second line if the panel is very narrow rather than overflowing
- [x] No other layout changes to the analysis panel

---

## Phase 2: AnalysisContext — Clear Fix + WO Filter State

**Completed:** 2026-04-09 — `src/context/AnalysisContext.jsx`

Two changes to `AnalysisContext.jsx` in one phase since they are in the same file and both needed before the SideNav UI can reference them.

### Changes Required

**Fix 1 — `clearAll` preserves `analysisType`:**

- **File:** `src/context/AnalysisContext.jsx:262` — remove the `setAnalysisType('')` line from `clearAll`. Keep all other resets. Add `setFilterWorkOrder(null)` to the reset block (after adding the state below).

**Fix 2 — Add `filterWorkOrder` state:**

- **File:** `src/context/AnalysisContext.jsx` — after the `selectedWorkOrder` state line (~line 222), add:

```js
const [filterWorkOrder, setFilterWorkOrder] = useState(null)
```

- **File:** `src/context/AnalysisContext.jsx` — add a `MOCK_FILTER_WOS` constant near the top of the file (after the existing `COLORS` / `LINES` constants), listing the searchable work orders:

```js
const MOCK_FILTER_WOS = [
  { id: 'WO-10021', label: 'WO-10021 — Black PE Pipe 1.25" OD',    startTime: '2025-01-06T06:00', endTime: '2025-01-06T14:30' },
  { id: 'WO-10022', label: 'WO-10022 — Red HDPE Conduit 2.0" OD',  startTime: '2025-01-06T14:30', endTime: '2025-01-06T23:00' },
  { id: 'WO-10023', label: 'WO-10023 — White PVC Tube 0.75" OD',   startTime: '2025-01-07T06:00', endTime: '2025-01-07T15:15' },
  { id: 'WO-10024', label: 'WO-10024 — Gray PVC Conduit 3.0" OD',  startTime: '2025-01-07T15:15', endTime: '2025-01-08T00:00' },
  { id: 'WO-10025', label: 'WO-10025 — White HDPE Pipe 0.5" OD',   startTime: '2025-01-08T06:00', endTime: '2025-01-08T13:45' },
  { id: 'WO-10026', label: 'WO-10026 — Black PE Tube 1.0" OD',     startTime: '2025-01-08T13:45', endTime: '2025-01-08T22:30' },
]
```

- **File:** `src/context/AnalysisContext.jsx` — expose `MOCK_FILTER_WOS`, `filterWorkOrder`, and `setFilterWorkOrder` in the context value object and in the `export` list (alongside `ANALYSIS_TYPES`, `LINES`, etc.).

Updated `clearAll`:
```js
function clearAll() {
  setPlant('all')
  setArea('All')
  // analysisType intentionally NOT reset — user stays on current analysis page
  setStartDate('')
  setEndDate('')
  setGroupBy('')
  setSelectedLines(new Set(LINES))
  setSelectedFamilies(new Set())
  setSelectedColors(new Set(COLORS.map(c => c.id)))
  setAnalysisResults(null)
  setIsRunning(false)
  setSelectedWorkOrder(null)
  setFilterWorkOrder(null)
}
```

### Success Criteria

- [x] Clicking "Clear all" on the Product Run page stays on Product Run (does not navigate to Overview)
- [x] `filterWorkOrder` and `setFilterWorkOrder` are accessible via `useAnalysis()`
- [x] `MOCK_FILTER_WOS` is exported from AnalysisContext
- [x] `clearAll` resets `filterWorkOrder` to null

---

## Phase 3: WO Filter SideNav UI

**Completed:** 2026-04-09 — `src/components/layout/SideNav.jsx`, `src/components/layout/SideNav.module.css`

Adds a Work Order selector section to SideNav between the Analysis Type and Date Range sections. When a WO is selected, the date range inputs are disabled.

### Changes Required

- **File:** `src/components/layout/SideNav.jsx:8` — add `filterWorkOrder`, `setFilterWorkOrder`, and `MOCK_FILTER_WOS` to the `useAnalysis()` destructure.

- **File:** `src/components/layout/SideNav.jsx:83` — insert a new `<div className={styles.section}>` block between the Analysis Type section (ends ~line 82) and the Date Range section (starts ~line 85):

```jsx
{/* Work Order filter — optional; disables date range when set */}
<div className={styles.section}>
  <label className={styles.label}>Work Order</label>
  <select
    className={styles.select}
    value={filterWorkOrder?.id ?? ''}
    onChange={e => {
      const wo = MOCK_FILTER_WOS.find(w => w.id === e.target.value) ?? null
      setFilterWorkOrder(wo)
    }}
  >
    <option value="">— All Work Orders —</option>
    {MOCK_FILTER_WOS.map(wo => (
      <option key={wo.id} value={wo.id}>{wo.label}</option>
    ))}
  </select>
  {filterWorkOrder && (
    <span className={styles.woTimeHint}>
      {filterWorkOrder.startTime} → {filterWorkOrder.endTime}
    </span>
  )}
</div>
```

- **File:** `src/components/layout/SideNav.jsx:89,95` — add `disabled={!!filterWorkOrder}` to both date `<input>` elements. Also add `className` append for a muted style:

```jsx
<input
  type="date"
  className={`${styles.dateInput}${filterWorkOrder ? ` ${styles.dateInputDisabled}` : ''}${dateError ? ` ${styles.inputError}` : ''}`}
  disabled={!!filterWorkOrder}
  value={filterWorkOrder ? filterWorkOrder.startTime.slice(0, 10) : startDate}
  onChange={e => setStartDate(e.target.value)}
/>
```

Do the same for the end date input, using `filterWorkOrder.endTime.slice(0, 10)` as the display value when locked.

- **File:** `src/components/layout/SideNav.module.css` — append two new classes:

```css
.woTimeHint {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
  display: block;
}

.dateInputDisabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Success Criteria

- [x] "Work Order" select appears between Analysis Type and Date Range in SideNav
- [x] Selecting a WO disables both date inputs and shows them with muted appearance
- [x] The WO's start→end times are shown as a hint below the select
- [x] Selecting "— All Work Orders —" re-enables the date inputs
- [x] Clear all resets the WO select back to "— All Work Orders —"

---

## Phase 4: Trend Tab Layout + Time Controls

**Completed:** 2026-04-09 — `src/pages/WorkOrderDetailsPage.jsx`, `src/pages/WorkOrderDetailsPage.module.css`

Restructures the Trending tab to show the tag selector on the left of the chart, and adds an independent time range control (bounded by WO start/end).

### Changes Required

**New state in `AnalysisPanel`:**

- **File:** `src/pages/WorkOrderDetailsPage.jsx:584` — after the existing `matRangeEnd` state, add two new state variables:

```js
const [trendStart, setTrendStart] = useState(workOrder?.startTime ?? '')
const [trendEnd,   setTrendEnd]   = useState(workOrder?.endTime   ?? '')
```

**TrendChart signature update:**

- **File:** `src/pages/WorkOrderDetailsPage.jsx:272` — expand `TrendChart` props to accept `rangeStart` and `rangeEnd` (both ISO strings). When provided, use them for the SVG X axis domain instead of `workOrder.startTime/endTime`:

```js
function TrendChart({ workOrder, selectedTags, selectedTimestamp, onTimestampSelect, rangeStart, rangeEnd }) {
  // ...
  const t0 = rangeStart ? new Date(rangeStart).getTime()
           : workOrder?.startTime ? new Date(workOrder.startTime).getTime() : 0
  const t1 = rangeEnd   ? new Date(rangeEnd).getTime()
           : workOrder?.endTime   ? new Date(workOrder.endTime).getTime()   : t0 + 3600000
  // rest unchanged
}
```

**Trending tab layout — replace vertical stack with side-by-side:**

- **File:** `src/pages/WorkOrderDetailsPage.jsx:602–627` — replace the `<div className={styles.trendingTab}>` block content:

```jsx
{activeTab === 'trending' && (
  <div className={styles.trendingTab}>
    {/* Left: tag selector */}
    <TagSelector
      selectedTags={selectedTags}
      onToggle={id => setSelectedTags(prev => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })}
      onGroupToggle={(group, allSelected) => {
        const ids = MOCK_TAGS.filter(t => t.group === group).map(t => t.id)
        setSelectedTags(prev => {
          const next = new Set(prev)
          if (allSelected) ids.forEach(id => next.delete(id))
          else ids.forEach(id => next.add(id))
          return next
        })
      }}
    />
    {/* Right: time controls + chart */}
    <div className={styles.trendChartPane}>
      <div className={styles.trendRangeRow}>
        {(() => {
          function toInputVal(iso) {
            const d = new Date(iso)
            if (isNaN(d.getTime())) return ''
            const pad = n => String(n).padStart(2, '0')
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
          }
          const minVal = toInputVal(workOrder?.startTime ?? '')
          const maxVal = toInputVal(workOrder?.endTime   ?? '')
          return (
            <>
              <label className={styles.trendRangeLabel}>From</label>
              <input type="datetime-local" className={styles.trendRangeInput}
                value={toInputVal(trendStart)} min={minVal} max={maxVal}
                onChange={e => setTrendStart(e.target.value)} />
              <label className={styles.trendRangeLabel}>To</label>
              <input type="datetime-local" className={styles.trendRangeInput}
                value={toInputVal(trendEnd)} min={minVal} max={maxVal}
                onChange={e => setTrendEnd(e.target.value)} />
            </>
          )
        })()}
      </div>
      <TrendChart
        workOrder={workOrder}
        selectedTags={MOCK_TAGS.filter(t => selectedTags.has(t.id))}
        selectedTimestamp={selectedTimestamp}
        onTimestampSelect={setSelectedTimestamp}
        rangeStart={trendStart}
        rangeEnd={trendEnd}
      />
    </div>
  </div>
)}
```

**CSS layout changes:**

- **File:** `src/pages/WorkOrderDetailsPage.module.css:335` — update `.trendingTab` from `flex-direction: column` to `flex-direction: row` with a gap:

```css
.trendingTab {
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  align-items: flex-start;
  min-height: 0;
}
```

- **File:** `src/pages/WorkOrderDetailsPage.module.css:341` — update `.tagSelector` to be a fixed-width left column:

```css
.tagSelector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 180px;
  flex-shrink: 0;
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface-1);
}
```

- **File:** `src/pages/WorkOrderDetailsPage.module.css` — append new classes:

```css
.trendChartPane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.trendRangeRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.trendRangeLabel {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.trendRangeInput {
  font-size: 0.82rem;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background: var(--color-surface-1);
  color: var(--color-text-primary);
}
```

### Success Criteria

- [x] Tag selector appears on the left, chart on the right, as a horizontal row
- [x] Two datetime-local inputs appear above the chart, pre-filled with WO start/end
- [x] Inputs are clamped to WO bounds (min/max attributes)
- [x] Adjusting time range narrows or widens the chart's visible X axis
- [x] Two panels have independent trend time ranges
- [x] Chart still renders correctly with no tags selected (empty state message)

---

## Phase 5: Trend Chart Hover Tooltips

**Completed:** 2026-04-09 — `src/pages/WorkOrderDetailsPage.jsx`

Adds a hover tooltip to TrendChart showing timestamp, tag name, and value for each selected tag at the hover position.

### Changes Required

- **File:** `src/pages/WorkOrderDetailsPage.jsx:272` — add `hoverInfo` state inside `TrendChart` (not in `AnalysisPanel` — this is chart-internal UI):

```js
const [hoverInfo, setHoverInfo] = useState(null)
// hoverInfo: { x, y, ts, points: [{ tag, actual, setpoint }] } | null
```

- **File:** `src/pages/WorkOrderDetailsPage.jsx:298` — replace the existing `handleClick` SVG handler. Add an `handleMouseMove` and `handleMouseLeave` on the SVG:

```js
function handleMouseMove(e) {
  const svg    = e.currentTarget
  const rect   = svg.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top
  const svgX   = (clickX / rect.width)  * W
  const svgY   = (clickY / rect.height) * H
  const ratio  = Math.max(0, Math.min(1, (svgX - PAD.left) / plotW))
  const ts     = new Date(t0 + ratio * (t1 - t0))
  const tMs    = ts.getTime()

  const points = seriesData.map((series, i) => {
    // find nearest point by time
    let nearest = series[0]
    let minDist = Infinity
    series.forEach(p => {
      const d = Math.abs(p.ts.getTime() - tMs)
      if (d < minDist) { minDist = d; nearest = p }
    })
    return { tag: selectedTags[i], actual: nearest.actual, setpoint: nearest.setpoint }
  })

  setHoverInfo({ x: svgX, y: svgY, ts, points })
}

function handleMouseLeave() {
  setHoverInfo(null)
}
```

Keep `handleClick` for the timestamp cursor: clicking sets `selectedTimestamp`; moving just sets hover.

- **File:** `src/pages/WorkOrderDetailsPage.jsx` — in the SVG element, add `onMouseMove={handleMouseMove}` and `onMouseLeave={handleMouseLeave}` alongside the existing `onClick={handleClick}`.

- **File:** `src/pages/WorkOrderDetailsPage.jsx` — inside the SVG, after the cursor line block, add the hover vertical line and tooltip `<g>`:

```jsx
{/* Hover indicator */}
{hoverInfo && (
  <g>
    <line
      x1={hoverInfo.x} x2={hoverInfo.x}
      y1={PAD.top} y2={PAD.top + plotH}
      stroke="var(--color-text-muted, #9ca3af)"
      strokeWidth="1"
      strokeDasharray="2 2"
    />
    {/* Tooltip box — flip to left side if near right edge */}
    {(() => {
      const tipX = hoverInfo.x + 8 > W - 160 ? hoverInfo.x - 168 : hoverInfo.x + 8
      const tipY = Math.max(PAD.top, Math.min(hoverInfo.y - 10, H - (20 + hoverInfo.points.length * 16)))
      const label = hoverInfo.ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      return (
        <g>
          <rect
            x={tipX} y={tipY}
            width={160} height={18 + hoverInfo.points.length * 16}
            rx={3} ry={3}
            fill="var(--color-surface-1, #fff)"
            stroke="var(--color-border, #e5e7eb)"
            strokeWidth="1"
          />
          <text x={tipX + 6} y={tipY + 12} fontSize="9" fontWeight="600" fill="var(--color-text-muted, #6b7280)">
            {label}
          </text>
          {hoverInfo.points.map((pt, i) => (
            <text key={pt.tag.id} x={tipX + 6} y={tipY + 12 + (i + 1) * 16} fontSize="9" fill={TAG_COLORS[i % TAG_COLORS.length]}>
              {pt.tag.label}: {pt.actual.toFixed(1)}
            </text>
          ))}
        </g>
      )
    })()}
  </g>
)}
```

No new CSS classes needed — tooltip is pure SVG.

### Success Criteria

- [x] Hovering over the chart shows a dashed vertical line at the mouse position
- [x] A tooltip box appears near the cursor showing the timestamp and value for each selected tag
- [x] Tooltip flips to left side when near the right edge of the chart
- [x] Mouse leaving the chart hides the tooltip
- [x] Click still sets the `selectedTimestamp` cursor (cursor line and hover line coexist)
- [x] No tooltip shown when no tags are selected

---

## Deviations

_None yet._

## Rollback

All changes are confined to:
- `src/context/AnalysisContext.jsx`
- `src/components/layout/SideNav.jsx` + `.module.css`
- `src/pages/WorkOrderDetailsPage.jsx` + `.module.css`

To revert: restore `setAnalysisType('')` in `clearAll`; remove `filterWorkOrder` state and export; remove WO section from SideNav; restore `.tabBar` overflow; restore `.trendingTab` to column layout; revert `TrendChart` signature.
