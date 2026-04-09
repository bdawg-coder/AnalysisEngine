# Review: Work Order Trending, Tags & Raw Material

## Implementation Status
- Phase 1: complete — data layer + AnalysisPanel contract
- Phase 2: complete — Trending tab (TagSelector + TrendChart)
- Phase 3: complete — Snapshot table (moved to Realtime tab, approved deviation)
- Phase 4: complete — Raw Material tab

## Automated Verification Results
- Tests: N/A — no test framework configured
- Coverage: N/A

## Findings

### Matches Plan

**Phase 1**
- `MOCK_TAGS` (23 tags, 2 groups), `TAG_COLORS`, `buildMockTagSeries`, `MOCK_MATERIALS` (6 entries), `buildMockMaterials` all present at `WorkOrderDetailsPage.jsx:151–216`
- `AnalysisPanel` accepts `workOrder` prop (`jsx:580`); local state: `selectedTags` (Set), `selectedTimestamp`, `matRangeStart`, `matRangeEnd` (`jsx:581–586`)
- `SplitPane` call site passes `workOrder={wo}` to both panels (`jsx:796–799`)

**Phase 2**
- `TagSelector` groups `MOCK_TAGS` by group, renders per-group "Select All / Clear" buttons (`jsx:236–270`)
- `TrendChart` renders SVG with Y-axis auto-scale, one `<polyline>` per selected tag in `TAG_COLORS` order, click handler fires `onTimestampSelect`, vertical dashed cursor line when `selectedTimestamp` set, empty-state message when no tags (`jsx:272–381`)
- Trending tab wraps both in `styles.trendingTab` flex column (`jsx:602–627`)
- All CSS classes present: `.trendingTab`, `.tagSelector`, `.tagGroup`, `.tagGroupHeader`, `.tagGroupBtn`, `.tagRow`, `.trendChart`, `.trendEmpty` (`css:333–429`)

**Phase 3 (approved deviation)**
- `SnapshotTable` component at `jsx:455–519`: returns `null` when `timestamp` is null or `selectedTags` empty; interpolates actual from `buildMockTagSeries`; groups by `group`; Zone | Setpoint | Actual columns; timestamp label above table
- Moved to Realtime tab (`jsx:629–673`) with independent `datetime-local` input clamped to WO range, shows all `MOCK_TAGS` — per approved deviation 2026-04-09
- CSS classes: `.snapshotTimestamp`, `.snapshotTable`, `.snapshotTd`, `.snapshotTdNum`, `.snapshotGroupHeader` (`css:461–496`)

**Phase 4**
- `RawMaterialPanel` at `jsx:521–578`: calls `buildMockMaterials` with WO bounds and range inputs; two datetime-local inputs with min/max clamped to WO; 2-column table (Material name–id, consumption); bold total row with heavier top border
- Wired into `AnalysisPanel` at `jsx:687–694` with `matRangeStart`/`matRangeEnd` state and `onRangeChange` handler
- CSS classes: `.rawMatPanel`, `.rawMatRangeRow`, `.rawMatLabel`, `.rawMatInput`, `.rawMatTable`, `.rawMatTd`, `.rawMatTdNum`, `.rawMatTotal`, `.rawMatTotalBorder` (`css:498–552`)

### Deviations

- **Phase 2 — SVG viewBox height:** Plan specifies `viewBox="0 0 800 300"` (H=300); implementation uses H=280 (`jsx:275`). Impact: **low** — chart proportions are nearly identical, `preserveAspectRatio="none"` means the SVG fills its container regardless. Accept.

- **Phase 3 — SnapshotTable placement:** Plan placed snapshot in Trending tab; user approved move to Realtime tab with independent timestamp input showing all tags. Recorded in plan's Deviations section. Accept (already approved).

- **Phase 4 — separator character:** Plan example shows `"RCY Pellets - 12279"` (hyphen-minus); implementation renders `"RCY Pellets – 12279"` (en-dash `–`, `jsx:566`). Impact: **low** — cosmetic. Accept.

- **Phase 4 — CSS total row selector pattern:** `.rawMatTotal td` and `.rawMatTotalBorder td` are descendant selectors on a `<tr>` class. The `<td>` children also carry `.rawMatTd` for border/padding. CSS Modules scopes the parent class; the `td` descendant selector applies correctly. No functional issue.

### Risks

- `buildMockTagSeries` is called once per selected tag per chart render (up to 23 tags × 60 points). No memoization. With all tags selected, this is ~1,380 point objects created each render cycle. Acceptable for a mock; would need `useMemo` before real data.
- `realtimeTimestamp` parsed from `<input type="datetime-local">` value which is a local-time string (no timezone). `new Date("2025-01-06T10:00")` is parsed as local time — consistent with the WO startTime/endTime format in context, so no cross-timezone skew risk in this mock.

## Recommendation

Ready for commit. No blocking issues. Two minor cosmetic deviations (viewBox height, separator character) are low impact and accepted.
