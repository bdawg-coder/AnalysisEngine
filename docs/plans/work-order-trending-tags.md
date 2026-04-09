# Work Order Trending, Tags & Raw Material Plan

## Overview

Flesh out the four placeholder tabs in `WorkOrderDetailsPage`'s `AnalysisPanel`:

- **Trending** → Tag multi-select + SVG trend chart (bounded by WO times) + clickable timestamp
- **Snapshot** (within Trending) → Point-in-time table of all selected tag setpoints/actuals, grouped by zone
- **Raw Material** → Filterable consumption table with total row
- **Notes** → unchanged

Both panels in the `SplitPane` operate independently: each owns its own selected tags, timestamp cursor, and raw material time range as local state.

Per-panel WO selection (picking different WOs per panel) is out of scope — both panels share the same `selectedWorkOrder` from context, passed in as a prop.

## Current State

- `src/pages/WorkOrderDetailsPage.jsx:241–283` — `AnalysisPanel` component; `activeTab` only local state; Trending and Raw Material tabs render placeholder `<p>` tags
- `src/pages/WorkOrderDetailsPage.jsx:285–331` — `SplitPane`; renders `<AnalysisPanel />` at lines 386–389 with no props
- `src/pages/WorkOrderDetailsPage.jsx:335` — `WorkOrderDetailsPage`; reads `selectedWorkOrder` from context; passes nothing to panels
- `src/pages/WorkOrderDetailsPage.jsx:54–59` — `TABS` array: `trending`, `realtime`, `notes`, `raw_material`
- No mock tag data, no mock raw material data, no chart components exist yet

## Out of Scope

- Per-panel WO selection (different WO per panel)
- Realtime tab implementation
- Notes tab changes
- External charting library (use inline SVG)
- Mobile-responsive split pane (per prior plan constraint)
- Real API integration

---

## Phase 1: Data Layer + AnalysisPanel Contract

**Completed:** 2026-04-09 — `src/pages/WorkOrderDetailsPage.jsx`

Adds all mock data generators and expands `AnalysisPanel` to hold per-panel state. No visible UI change beyond the panels now knowing their WO.

### Changes Required

**File:** `src/pages/WorkOrderDetailsPage.jsx:86` — after existing mock builder functions, add:

```js
// ── Mock tag definitions ──────────────────────────────────────────────────────
const MOCK_TAGS = [
  { id: 'feed_barrel',  label: 'Feed Barrel Zone',  group: 'Barrel Zones', setpoint: 50  },
  { id: 'barrel_1',    label: 'Barrel Zone 1',      group: 'Barrel Zones', setpoint: 200 },
  { id: 'barrel_2',    label: 'Barrel Zone 2',      group: 'Barrel Zones', setpoint: 200 },
  { id: 'barrel_3',    label: 'Barrel Zone 3',      group: 'Barrel Zones', setpoint: 200 },
  { id: 'barrel_4',    label: 'Barrel Zone 4',      group: 'Barrel Zones', setpoint: 195 },
  { id: 'barrel_5',    label: 'Barrel Zone 5',      group: 'Barrel Zones', setpoint: 195 },
  { id: 'barrel_6',    label: 'Barrel Zone 6',      group: 'Barrel Zones', setpoint: 190 },
  { id: 'barrel_7',    label: 'Barrel Zone 7',      group: 'Barrel Zones', setpoint: 185 },
  { id: 'barrel_8',    label: 'Barrel Zone 8',      group: 'Barrel Zones', setpoint: 180 },
  { id: 'barrel_9',    label: 'Barrel Zone 9',      group: 'Barrel Zones', setpoint: 175 },
  { id: 'barrel_10',   label: 'Barrel Zone 10',     group: 'Barrel Zones', setpoint: 170 },
  { id: 'barrel_11',   label: 'Barrel Zone 11',     group: 'Barrel Zones', setpoint: 165 },
  { id: 'barrel_12',   label: 'Barrel Zone 12',     group: 'Barrel Zones', setpoint: 150 },
  { id: 'aux_adapter', label: 'Aux Adapter Zone',   group: 'Barrel Zones', setpoint: 165 },
  { id: 'aux_die_1',   label: 'Aux Die Zone 1',     group: 'Die Zones',    setpoint: 160 },
  { id: 'aux_die_2',   label: 'Aux Die Zone 2',     group: 'Die Zones',    setpoint: 160 },
  { id: 'aux_die_3',   label: 'Aux Die Zone 3',     group: 'Die Zones',    setpoint: 165 },
  { id: 'aux_die_4',   label: 'Aux Die Zone 4',     group: 'Die Zones',    setpoint: 165 },
  { id: 'aux_die_5',   label: 'Aux Die Zone 5',     group: 'Die Zones',    setpoint: 170 },
  { id: 'aux_die_6',   label: 'Aux Die Zone 6',     group: 'Die Zones',    setpoint: 175 },
  { id: 'aux_die_7',   label: 'Aux Die Zone 7',     group: 'Die Zones',    setpoint: 175 },
  { id: 'aux_die_8',   label: 'Aux Die Zone 8',     group: 'Die Zones',    setpoint: 180 },
  { id: 'aux_die_9',   label: 'Aux Die Zone 9',     group: 'Die Zones',    setpoint: 180 },
]

const TAG_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

// Generates N evenly-spaced {ts, setpoint, actual} samples for one tag over the WO time window
function buildMockTagSeries(tag, startIso, endIso, nPoints = 60) {
  const t0   = new Date(startIso).getTime()
  const t1   = new Date(endIso).getTime()
  const step = (t1 - t0) / (nPoints - 1)
  return Array.from({ length: nPoints }, (_, i) => {
    const ts   = new Date(t0 + i * step)
    const seed = tag.id.charCodeAt(0) * 31 + i
    const noise = ((seed * 7919) % 100) / 100 - 0.5   // -0.5 .. +0.5 normalized
    const actual = Math.round((tag.setpoint + noise * tag.setpoint * 0.04) * 10) / 10
    return { ts, setpoint: tag.setpoint, actual }
  })
}

const MOCK_MATERIALS = [
  { id: '12279', name: 'RCY Pellets',      baseConsumption: 24432 },
  { id: '12288', name: 'Repro Mix',         baseConsumption: 5656  },
  { id: '12289', name: 'Repro Trim',        baseConsumption: 0     },
  { id: '12477', name: 'Coupling Agent',    baseConsumption: 727   },
  { id: '12478', name: 'Liquid Lube',       baseConsumption: 922   },
  { id: '12536', name: 'Wood',              baseConsumption: 39255 },
]

// Returns materials with consumption scaled to the selected time window
function buildMockMaterials(startIso, endIso, rangeStartIso, rangeEndIso) {
  const woDuration   = new Date(endIso).getTime()   - new Date(startIso).getTime()
  const rangeDuration = new Date(rangeEndIso).getTime() - new Date(rangeStartIso).getTime()
  const ratio = woDuration > 0 ? Math.min(1, Math.max(0, rangeDuration / woDuration)) : 1
  return MOCK_MATERIALS.map(m => ({
    ...m,
    consumption: Math.round(m.baseConsumption * ratio),
  }))
}
```

**File:** `src/pages/WorkOrderDetailsPage.jsx:241` — expand `AnalysisPanel` signature and state:

Replace `function AnalysisPanel()` with `function AnalysisPanel({ workOrder })`. Add new local state below `activeTab`:

```js
const [selectedTags,      setSelectedTags]      = useState(new Set())
const [selectedTimestamp, setSelectedTimestamp] = useState(null)
const [matRangeStart,     setMatRangeStart]     = useState(workOrder?.startTime ?? '')
const [matRangeEnd,       setMatRangeEnd]       = useState(workOrder?.endTime   ?? '')
```

**File:** `src/pages/WorkOrderDetailsPage.jsx:386–389` — update both `AnalysisPanel` call sites inside `SplitPane` render to pass `workOrder`:

```jsx
<SplitPane
  leftPanel={<AnalysisPanel  workOrder={wo} />}
  rightPanel={<AnalysisPanel workOrder={wo} />}
/>
```

(where `wo` is the `selectedWorkOrder` already destructured at line 337)

### Success Criteria

- [x] Both panels receive and hold `workOrder` prop
- [x] Each panel has isolated `selectedTags`, `selectedTimestamp`, `matRangeStart`, `matRangeEnd` state
- [x] Page renders without errors; all existing tab content unchanged
- [x] Changing a tag selection in one panel does not affect the other

---

## Phase 2: Trending Tab — Tag Selector + SVG Trend Chart

**Completed:** 2026-04-09 — `src/pages/WorkOrderDetailsPage.jsx`, `src/pages/WorkOrderDetailsPage.module.css`

Replaces the Trending placeholder with a `TagSelector` multi-select and a `TrendChart` SVG component.

### Changes Required

- **File:** `src/pages/WorkOrderDetailsPage.jsx:167` — insert `TagSelector` non-exported component after the `// ── Sub-Components ───` comment, before `ToolBreakdownTable` at line 169. Groups `MOCK_TAGS` by `group` into sections; each tag row has a checkbox toggling id in `selectedTags` Set; "Select All" / "Clear" per group. Props: `selectedTags` (Set), `onToggle(tagId)`, `onGroupToggle(group, allSelected)`.

- **File:** `src/pages/WorkOrderDetailsPage.jsx:167` — insert `TrendChart` non-exported component after `TagSelector`. Renders SVG `viewBox="0 0 800 300"`; X axis maps `workOrder.startTime` → `workOrder.endTime`; Y axis auto-scaled; one `<polyline>` per selected tag using `TAG_COLORS[index % TAG_COLORS.length]`; calls `buildMockTagSeries` per tag; SVG click → `onTimestampSelect(ts)`; vertical `<line>` cursor at `selectedTimestamp`; empty state message when no tags selected. Props: `workOrder`, `selectedTags` (array of tag objects), `selectedTimestamp`, `onTimestampSelect(ts)`.

- **File:** `src/pages/WorkOrderDetailsPage.jsx:258–260` — replace Trending placeholder `<p>` with:
  ```jsx
  <div className={styles.trendingTab}>
    <TagSelector selectedTags={selectedTags} onToggle={…} onGroupToggle={…} />
    <TrendChart workOrder={workOrder} selectedTags={MOCK_TAGS.filter(t => selectedTags.has(t.id))} selectedTimestamp={selectedTimestamp} onTimestampSelect={setSelectedTimestamp} />
  </div>
  ```

- **File:** `src/pages/WorkOrderDetailsPage.module.css` — append new classes: `.trendingTab` (flex column), `.tagSelector` (scrollable, max-height ~200px), `.tagGroup`, `.tagGroupHeader` (flex row, space-between), `.tagRow`, `.trendChart` (full width, min-height 220px), `.trendEmpty` (centered message)

### Success Criteria

- [x] Trending tab shows tag selector grouped by Barrel Zones / Die Zones
- [x] Checking tags renders colored lines on the SVG chart
- [x] Chart X axis spans exactly `workOrder.startTime` → `workOrder.endTime`
- [x] Clicking on chart fires `onTimestampSelect` and shows a vertical cursor line
- [x] Left and right panels show independent tag selections
- [x] Zero tags selected shows "Select tags above to view trends"

---

## Phase 3: Snapshot Table

**Completed:** 2026-04-09 — `src/pages/WorkOrderDetailsPage.jsx`, `src/pages/WorkOrderDetailsPage.module.css`

Adds the point-in-time snapshot table below the trend chart when `selectedTimestamp` is set.

### Changes Required

- **File:** `src/pages/WorkOrderDetailsPage.jsx:167` — insert `SnapshotTable` non-exported component before `AnalysisPanel` at line 241 (after `TrendChart` from Phase 2). Returns `null` when `timestamp` is null. For each selected tag interpolates `actual` at `timestamp` from `buildMockTagSeries`; groups rows by `group`; columns: Zone | Setpoint | Actual (one decimal). Props: `selectedTags` (array of tag objects), `timestamp` (Date|null), `workOrder`.

- **File:** `src/pages/WorkOrderDetailsPage.jsx:258–260` — within the Trending tab `<div className={styles.trendingTab}>` block added in Phase 2, append after `<TrendChart …/>`:
  ```jsx
  <SnapshotTable
    selectedTags={MOCK_TAGS.filter(t => selectedTags.has(t.id))}
    timestamp={selectedTimestamp}
    workOrder={workOrder}
  />
  ```

- **File:** `src/pages/WorkOrderDetailsPage.module.css` — append new classes: `.snapshotTable` (full-width, standard borders), `.snapshotGroupHeader` (colspanned, muted background, bold), `.snapshotTd` (padding; numeric cells `text-align: right`), `.snapshotTimestamp` (small label above table)

### Success Criteria

- [x] No table rendered when `selectedTimestamp` is null
- [x] After clicking chart: snapshot table appears with all selected tags
- [x] Rows grouped under "Barrel Zones" / "Die Zones" sub-headers
- [x] Setpoint and Actual columns display numeric values right-aligned
- [x] Timestamp label shown above table
- [x] Two panels show different snapshots when different timestamps are selected

---

## Phase 4: Raw Material Tab

**Completed:** 2026-04-09 — `src/pages/WorkOrderDetailsPage.jsx`, `src/pages/WorkOrderDetailsPage.module.css`

Replaces the Raw Material placeholder with a filterable consumption table and total row.

### Changes Required

- **File:** `src/pages/WorkOrderDetailsPage.jsx:167` — insert `RawMaterialPanel` non-exported component before `AnalysisPanel` at line 241 (after `SnapshotTable` from Phase 3). Calls `buildMockMaterials(workOrder.startTime, workOrder.endTime, rangeStart, rangeEnd)`. Renders: (1) two `<input type="datetime-local">` pre-filled with `rangeStart`/`rangeEnd`, calling `onRangeChange` on change; (2) two-column table — Material Name with ID suffix (`"RCY Pellets - 12279"`) | Consumption right-aligned comma-formatted; (3) bold total row with top border. Props: `workOrder`, `rangeStart` (string), `rangeEnd` (string), `onRangeChange(start, end)`.

- **File:** `src/pages/WorkOrderDetailsPage.jsx:277–279` — replace Raw Material placeholder `<p className={styles.placeholder}>Raw material consumption will appear here.</p>` with:
  ```jsx
  <RawMaterialPanel
    workOrder={workOrder}
    rangeStart={matRangeStart}
    rangeEnd={matRangeEnd}
    onRangeChange={(s, e) => { setMatRangeStart(s); setMatRangeEnd(e) }}
  />
  ```

- **File:** `src/pages/WorkOrderDetailsPage.module.css` — append new classes: `.rawMatPanel` (flex column gap), `.rawMatRangeRow` (flex row, inputs + labels), `.rawMatTable` (full-width), `.rawMatTd` (padding), `.rawMatTdNum` (`text-align: right; font-variant-numeric: tabular-nums`), `.rawMatTotal` (bold), `.rawMatTotalBorder` (border-top separator)

### Success Criteria

- [x] Raw Material tab shows consumption table with correct material names and IDs
- [x] Numbers are right-aligned and comma-formatted
- [x] Total row is visually distinct (bold) with a separator above it
- [x] Adjusting the time range inputs recalculates and re-renders consumption values
- [x] Two panels show independently adjustable time ranges
- [x] Default range = WO start → end (full run consumption)

---

## Deviations
- **Phase 3:** `SnapshotTable` moved off Trending tab and onto Realtime tab — user clarified snapshot belongs on Realtime with its own independent timestamp input (datetime-local, clamped to WO range) showing all tags. Trending tab retains only TagSelector + TrendChart. `realtimeTimestamp` state added to `AnalysisPanel`. — approved 2026-04-09

## Rollback

All changes are confined to `src/pages/WorkOrderDetailsPage.jsx` and `src/pages/WorkOrderDetailsPage.module.css`. To revert:
1. Remove all new mock constants/functions (MOCK_TAGS, TAG_COLORS, buildMockTagSeries, MOCK_MATERIALS, buildMockMaterials)
2. Revert `AnalysisPanel` signature back to `function AnalysisPanel()`
3. Remove the four new local state lines from `AnalysisPanel`
4. Revert `<SplitPane>` call site back to `<AnalysisPanel />` (no props)
5. Restore the three placeholder `<p>` tags in Trending and Raw Material tab blocks
6. Remove new CSS classes from `.module.css`
