# Onboarding & Filter Updates Implementation Plan

## Overview
Six related changes: (1) onboarding screen before first run, (2) Area dropdown added as a standard filter, (3) Overview Analysis as the default mode when no type is selected, (4) Shift filter removed, (5) Group Data By filter added for Overview Analysis mode only, (6) Overview Analysis runs produce the same KPI layout as ProductRunPage.

## Current State
- `src/context/AnalysisContext.jsx:8-11` — `ANALYSIS_TYPES` has product_run + color_analysis; empty string `''` means nothing selected
- `src/context/AnalysisContext.jsx:13-17` — `SHIFTS` exported, `shift`/`setShift` state at line 77
- `src/context/AnalysisContext.jsx:95-100` — `canRun` requires `analysisType !== ''`
- `src/context/AnalysisContext.jsx:144-162` — context value includes `shift`, `setShift`
- `src/components/layout/SideNav.jsx:41-52` — Plant `<select>`
- `src/components/layout/SideNav.jsx:55-67` — Analysis Type `<select>`
- `src/components/layout/SideNav.jsx:106-117` — Shift `<select>` (to be removed)
- `src/components/layout/SideNav.jsx:120-176` — Product Family + Colors (gated on `color_analysis`)
- `src/components/layout/MainContent.jsx:9-10` — routes product_run → ProductRunPage, color_analysis → ColorAnalysisPage; fallthrough shows placeholder
- `src/pages/ColorAnalysisPage.jsx:15` — uses `SHIFTS` + `shift` to build `shiftLabel` in subtitle
- `src/pages/ProductRunPage.jsx:15` — same `shiftLabel` pattern

## Out of Scope
- Real API integration
- Area options for plants other than 1NL
- Multi-select for Group Data By
- Any changes to Color Analysis-specific filters (Product Family, Colors)

---

## Phase 1: AnalysisContext — state changes

Add Area + Group Data By state; remove Shift; make Overview Analysis a valid run mode.

### Changes Required

- **`src/context/AnalysisContext.jsx:13-17`** — remove `SHIFTS` export entirely

- **`src/context/AnalysisContext.jsx:8`** — add `AREAS` constant after `ANALYSIS_TYPES`:
  ```js
  export const AREAS = {
    all: ['PE'],
    '1nl': ['PE'],
  }
  ```

- **`src/context/AnalysisContext.jsx:77`** — remove `shift`/`setShift` state; add two new state declarations:
  ```js
  const [area,    setArea]    = useState('PE')
  const [groupBy, setGroupBy] = useState('month')
  ```

- **`src/context/AnalysisContext.jsx:90-100`** — update `dateError` and `canRun`: remove `analysisType !== ''` requirement from `canRun` (empty `analysisType` = Overview Analysis, which is valid):
  ```js
  const canRun =
    startDate !== '' &&
    endDate   !== '' &&
    !dateError &&
    selectedLines.size > 0
  ```

- **`src/context/AnalysisContext.jsx:120-131`** — update `clearAll`: replace `setShift('all')` with `setArea('PE')` and add `setGroupBy('month')`:
  ```js
  function clearAll() {
    setPlant('all')
    setArea('PE')
    setAnalysisType('')
    setStartDate('')
    setEndDate('')
    setGroupBy('month')
    setSelectedLines(new Set(LINES))
    setSelectedFamilies(new Set())
    setSelectedColors(new Set(COLORS.map(c => c.id)))
    setAnalysisResults(null)
    setIsRunning(false)
  }
  ```

- **`src/context/AnalysisContext.jsx:144-162`** — update context value: remove `shift`/`setShift`; add `area`/`setArea`/`groupBy`/`setGroupBy`:
  ```js
  area, setArea,
  groupBy, setGroupBy,
  ```

**Completed:** 2026-04-08 — `src/context/AnalysisContext.jsx`

### Success Criteria
- [x] `SHIFTS` export removed; `AREAS` export added
- [x] Context no longer exposes `shift`/`setShift`
- [x] Context exposes `area`, `setArea`, `groupBy`, `setGroupBy`
- [x] `canRun` is `true` when dates are valid and lines are selected, regardless of `analysisType`

---

## Phase 2: SideNav — filter UI changes

Remove Shift; add Area; add Group Data By (Overview Analysis only).

### Changes Required

- **`src/components/layout/SideNav.jsx:3`** — update the AnalysisContext import: remove `SHIFTS`; add `AREAS`

- **`src/components/layout/SideNav.jsx` (useAnalysis destructure, ~line 20)** — remove `shift`, `setShift`; add `area`, `setArea`, `groupBy`, `setGroupBy`

- **`src/components/layout/SideNav.jsx:52`** — insert Area `<select>` section immediately after the closing `</div>` of the Plant section (line 52), before the Analysis Type section at line 55:
  ```jsx
  <div className={styles.section}>
    <label className={styles.sectionLabel}>Area</label>
    <select
      className={styles.select}
      value={area}
      onChange={e => setArea(e.target.value)}
    >
      {AREAS[plant]?.map(a => (
        <option key={a} value={a}>{a}</option>
      ))}
    </select>
  </div>
  ```

- **`src/components/layout/SideNav.jsx:106-117`** — delete the entire Shift `<select>` section (the `<div className={styles.section}>` block containing the shift label and select element)

- **`src/components/layout/SideNav.jsx:103`** — insert Group Data By `<select>` immediately after the Lines section closing `</div>` (line 103), before the Shift block being removed; gate on `analysisType === ''`:
  ```jsx
  {analysisType === '' && (
    <div className={styles.section}>
      <label className={styles.sectionLabel}>Group Data By</label>
      <select
        className={styles.select}
        value={groupBy}
        onChange={e => setGroupBy(e.target.value)}
      >
        <option value="month">Month</option>
        <option value="week">Week</option>
        <option value="day">Day</option>
        <option value="shift">Shift</option>
        <option value="run">Run</option>
      </select>
    </div>
  )}
  ```

- **`src/components/layout/SideNav.module.css`** — no new classes needed; existing `.select`, `.section`, `.sectionLabel` classes at their current definitions cover all new elements

**Completed:** 2026-04-08 — `src/components/layout/SideNav.jsx`

### Success Criteria
- [x] Area dropdown appears below Plant, shows "PE" for both plants
- [x] Shift dropdown is gone from the nav
- [x] "Group Data By" appears below Lines only when no Analysis Type is selected
- [x] "Group Data By" is hidden when product_run or color_analysis is selected

---

## Phase 3: Pages + Onboarding + MainContent routing

Remove shift references from existing pages; create OverviewAnalysisPage; add onboarding screen to MainContent.

### Changes Required

- **`src/pages/ColorAnalysisPage.jsx:2`** — remove `SHIFTS` from the import line; remove `shift` from `useAnalysis()` destructure; remove `shiftLabel` const; remove `· {shiftLabel}` from the subtitle JSX

- **`src/pages/ProductRunPage.jsx:2`** — same removals as ColorAnalysisPage above

- **New file: `src/pages/OverviewAnalysisPage.jsx`** — same structure as `src/pages/ProductRunPage.jsx:1-46`; only difference is the title string:
  - Title: `"Overview Analysis – Plant Overview"`
  - Subtitle: `{analysisResults && \` · ${analysisResults.totalLines} Lines\``}
  - Imports: `styles` from `'./OverviewAnalysisPage.module.css'`, `KpiCard`/`KpiCardSkeleton` from `'../components/KpiCard'`

- **New file: `src/pages/OverviewAnalysisPage.module.css`** — identical content to `src/pages/ProductRunPage.module.css`

- **`src/components/layout/MainContent.jsx`** — replace the fallthrough placeholder with onboarding + overview routing:
  - Import `OverviewAnalysisPage` from `'../../pages/OverviewAnalysisPage'`
  - Add `analysisResults`, `isRunning` to the `useAnalysis()` destructure
  - Routing logic:
    ```js
    if (analysisType === 'product_run')    return <ProductRunPage />
    if (analysisType === 'color_analysis') return <ColorAnalysisPage />
    if (isRunning || analysisResults)      return <OverviewAnalysisPage />
    return <OnboardingScreen />            // default: no analysis type, no results
    ```
  - Add `OnboardingScreen` as a non-exported function at the bottom of `MainContent.jsx` (per CLAUDE.md co-location convention for single-use components):
    ```jsx
    function OnboardingScreen() {
      return (
        <main className={styles.onboarding}>
          <div className={styles.onboardingCard}>
            <div className={styles.onboardingIcon}>⊞</div>
            <h1 className={styles.onboardingTitle}>Analysis Engine</h1>
            <p className={styles.onboardingSubtitle}>
              Select your filters on the left, then click{' '}
              <span className={styles.onboardingAccent}>Run Analysis</span>
            </p>
            <ol className={styles.onboardingSteps}>
              <li>Select Plant &amp; Area</li>
              <li>Choose Analysis Type <em>(or use Overview Analysis)</em></li>
              <li>Set Date Range &amp; Filters</li>
              <li>Click Run Analysis</li>
            </ol>
          </div>
        </main>
      )
    }
    ```

- **`src/components/layout/MainContent.module.css`** — add onboarding styles:
  ```css
  .onboarding {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  .onboardingCard {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    max-width: 440px;
    text-align: center;
  }
  .onboardingIcon {
    font-size: 2.5rem;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: var(--color-surface-raised);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .onboardingTitle {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }
  .onboardingSubtitle {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin: 0;
  }
  .onboardingAccent {
    color: var(--color-accent, #22c55e);
    font-weight: 600;
  }
  .onboardingSteps {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    text-align: left;
    counter-reset: steps;
  }
  .onboardingSteps li {
    counter-increment: steps;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }
  .onboardingSteps li::before {
    content: counter(steps);
    min-width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    background: var(--color-accent, #22c55e);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  ```
  - Also remove the now-unused `.pageHeader`, `.pageTitle`, `.contentPlaceholder`, `.placeholderCard`, `.placeholderIcon` classes from `MainContent.module.css` (the placeholder JSX is being replaced)

**Completed:** 2026-04-08 — `src/pages/ColorAnalysisPage.jsx`, `src/pages/ProductRunPage.jsx`, `src/pages/OverviewAnalysisPage.jsx` (new), `src/pages/OverviewAnalysisPage.module.css` (new), `src/components/layout/MainContent.jsx`, `src/components/layout/MainContent.module.css`

### Success Criteria
- [x] Color Analysis subtitle no longer shows shift
- [x] Product Run subtitle no longer shows shift
- [x] Before running any analysis, centered onboarding screen appears with 4 steps
- [x] Onboarding disappears as soon as Run Analysis is clicked (skeleton visible)
- [x] Running Overview Analysis (no type selected) shows KPI page titled "Overview Analysis – Plant Overview"
- [x] All three analysis modes (Overview, Product Run, Color Analysis) render their respective pages correctly

---

## Rollback
- Restore `AnalysisContext.jsx` from git (re-adds shift, removes area/groupBy)
- Restore `SideNav.jsx` from git (re-adds shift select, removes area/groupBy)
- Restore `ColorAnalysisPage.jsx` and `ProductRunPage.jsx` from git (re-adds shiftLabel)
- Restore `MainContent.jsx` and `MainContent.module.css` from git (removes onboarding)
- Delete `src/pages/OverviewAnalysisPage.jsx` and `OverviewAnalysisPage.module.css`
