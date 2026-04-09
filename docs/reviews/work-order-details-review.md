# Review: Work Order Details — Product Run Drill-Down

## Implementation Status

- Phase 1 (AnalysisContext — selectedWorkOrder): **complete**
- Phase 2 (ProductRunPage — RunAnalysisTable): **complete**
- Phase 3 (MainContent — routing): **complete**
- Phase 4 (WorkOrderDetailsPage — header + tool breakdown): **complete**
- Phase 5 (WorkOrderDetailsPage — state timeline): **complete**
- Phase 6 (WorkOrderDetailsPage — split-pane analysis): **complete**

## Automated Verification Results

- Tests: N/A — no test framework configured
- Coverage: N/A

---

## Findings

### Matches Plan

- **Phase 1:** `selectedWorkOrder` state declared at `AnalysisContext.jsx:222`, exposed at line 311, reset in `runAnalysis()` at line 276 before `setIsRunning(true)` — exact ordering matches plan
- **Phase 2:** `RunAnalysisTable` in `ProductRunPage.jsx:34` is a non-exported co-located function with identical 18-column `COLUMNS` array as `OverviewAnalysisPage.jsx`; `onRowClick` prop wired to `setSelectedWorkOrder` at line 116
- **Phase 2:** Row hover uses `.trClickable` + `.trOdd` compound class at `ProductRunPage.jsx:54`; CSS confirms `cursor: pointer` and `background: var(--color-surface-2)` on hover
- **Phase 3:** Routing in `MainContent.jsx:11–24` checks onboarding first, then `selectedWorkOrder`, then `ProductRunPage` — correct priority order
- **Phase 4:** Header grid at `WorkOrderDetailsPage.jsx:351–369` renders all 6 required fields; `MOCK_WO_DESCRIPTIONS` covers WO-10021 through WO-10026
- **Phase 4:** `ToolBreakdownTable` at line 169 shows all 7 tools; `lifeClass` at line 153 correctly maps ≥80 → `.lifeHigh` (red), ≥50 → `.lifeMid` (yellow), else → `.lifeLow` (green)
- **Phase 5:** `buildMockStates` at line 106 uses 9-state `STATE_SEQUENCE` (within the 8–12 plan target); segment widths computed as `(durationMs / totalMs) * 100` at line 204; tooltip shown via CSS `display:none` → `display:block` on `.timelineSegment:hover .tooltip`; downtime reason rendered at lines 218–222
- **Phase 5:** `STATE_COLORS` includes hex fallbacks (`#16a34a`, `#ca8a04`, `#dc2626`, `#9ca3af`) — defensive against undefined CSS variables
- **Phase 6:** `SplitPane` at line 285 uses `isDragging` ref + always-attached `useEffect` listeners; clamped 20–80% at line 295; left panel `width` prop, right panel `flex:1` inline — correct
- **Phase 6:** `AnalysisPanel` at line 241 has fully local `activeTab` state; two `<AnalysisPanel />` instances at lines 387–388 are independent (no shared state)
- **Phase 6:** Notes tab renders `MOCK_OPERATOR_NOTES` as a read-only feed (post-plan correction per user feedback) — 4 operator notes with author, timestamp, and text

### Deviations

- **Phase 6 Notes tab:** Plan specified `<textarea>` with local state. Changed to a read-only operator notes feed (`MOCK_OPERATOR_NOTES`) per user clarification that Notes shows pre-submitted operator entries, not a text input. Impact: **low** — this is the correct behaviour. Accept.

- **Phase 6 `panelId` prop removed:** Plan specified `AnalysisPanel` receives `panelId` prop for labeling. Removed since it was unused in the implementation. Impact: **low** — no labeling is needed in the current UI. Accept.

- **Phase 5/6 STATE_COLORS use CSS variable fallbacks:** Plan specified bare CSS variables (e.g., `var(--color-success)`). Implementation adds hex fallbacks (e.g., `var(--color-success, #16a34a)`). Impact: **low** — strictly additive and defensive. Accept.

- **Phase 3 routing guard:** Plan showed onboarding check inline. Implementation restructures to check onboarding first (if `!isRunning && !analysisResults`), then `selectedWorkOrder`, then `ProductRunPage` — this is the correct and intended logic. Accept.

### Risks

1. **`clearAll()` does not reset `selectedWorkOrder`** (`AnalysisContext.jsx:260–271`) — Low risk in practice: `clearAll` resets `analysisType` to `''`, so `MainContent` never reaches the `selectedWorkOrder` check. However, if the user is viewing WO Details and clicks Clear All, the stale selection persists in context until the next `runAnalysis()`. Recommend adding `setSelectedWorkOrder(null)` to `clearAll()` for defensive correctness.

2. **`MOCK_OPERATOR_NOTES` are static** (`WorkOrderDetailsPage.jsx:61–86`) — Same 4 notes appear regardless of which WO or line is selected. Fine for a mock; should be noted when real API integration is planned.

3. **`buildMockStates` with short duration WOs** — If a WO has a duration under ~7h, the `STATE_SEQUENCE` loop exits before all 9 states are consumed and the timeline bar won't fill 100% visually. The `widthPct` calculation divides by `totalMs` (actual states generated, not planned duration), so the bar will always fill correctly. No visual bug.

4. **Split pane resize on narrow viewports** — The plan explicitly marks mobile-responsive split pane as out of scope, but at narrow widths the 600px-height container with two panels may cause layout issues. No action needed now.

---

## Recommendation

**Ready for commit.** All 6 phases fully implemented. One low-risk gap worth a quick fix before committing:

**Fix before commit:** Add `setSelectedWorkOrder(null)` to `clearAll()` in `AnalysisContext.jsx:260–271`.

```js
function clearAll() {
  // ... existing resets ...
  setSelectedWorkOrder(null)   // add this line
}
```
