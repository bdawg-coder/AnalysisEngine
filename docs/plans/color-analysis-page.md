# Color Analysis Page Implementation Plan

## Overview
Build the Color Analysis page: a header with filter summary + metric badges, four KPI cards (OEE, Availability, Performance, Quality), and mock "Run Analysis" execution. The page reads filter state from `AnalysisContext` and displays results from a new `analysisResults` state also in context. The SideNav's existing "Run Analysis" button (wired to `runAnalysis()` in context) triggers mock data population.

## Current State
- `src/context/AnalysisContext.jsx:93-106` — `runAnalysis()` is a no-op that only `console.log`s a payload; no results state exists
- `src/context/AnalysisContext.jsx:82-91` — `clearAll()` resets filter state but has no results to clear yet
- `src/context/AnalysisContext.jsx:108-128` — context value object; `analysisResults` and `isRunning` are not yet exposed
- `src/components/layout/MainContent.jsx:1-29` — `MainContent({ activeSection })` renders a static placeholder card; imports no context, renders no real pages
- `src/components/layout/SideNav.jsx:121-127` — Run Analysis button: `onClick={runAnalysis}`, `disabled={!canRun}` from `useAnalysis()`
- `src/pages/ColorAnalysisPage.jsx` — does not exist yet

## Out of Scope
- Real API calls / backend integration
- Other analysis type pages (Production, Quality, Downtime)
- Drill-down charts or data tables below the KPI section

---

## Phase 1: Extend AnalysisContext with mock results state

**Completed:** 2026-04-08 — `src/context/AnalysisContext.jsx`

### Changes Required
- **`src/context/AnalysisContext.jsx:36`** — after the last existing `useState` call (line 44), add two new state declarations:
  ```js
  const [analysisResults, setAnalysisResults] = useState(null)
  const [isRunning,       setIsRunning]       = useState(false)
  ```
- **`src/context/AnalysisContext.jsx:1`** — add a `MOCK_RESULTS` constant (place after the `COLORS` array, around line 33):
  ```js
  const MOCK_RESULTS = {
    totalColors: 7,
    totalLines: 6,
    kpis: {
      oee:          { value: 82.3, vsPrev: +1.5 },
      availability: { value: 87.4, vsPrev: +2.1 },
      performance:  { value: 91.2, vsPrev: -0.8 },
      quality:      { value: 94.7, vsPrev: +1.3 },
    },
  }
  ```
- **`src/context/AnalysisContext.jsx:93-106`** — replace the `runAnalysis` body (currently `console.log`) with:
  ```js
  function runAnalysis() {
    if (!canRun) return
    setIsRunning(true)
    setAnalysisResults(null)
    setTimeout(() => {
      setAnalysisResults(MOCK_RESULTS)
      setIsRunning(false)
    }, 600)
  }
  ```
- **`src/context/AnalysisContext.jsx:82-91`** — inside `clearAll()`, add `setAnalysisResults(null)` and `setIsRunning(false)` after the existing resets (before the closing `}` at line 91)
- **`src/context/AnalysisContext.jsx:108-128`** — add `analysisResults` and `isRunning` to the context value object alongside the existing keys

### Success Criteria
- [x] `useAnalysis()` returns `analysisResults` (null or mock object) and `isRunning` (boolean)
- [x] Clicking Run Analysis sets `isRunning` true for ~600 ms, then sets `analysisResults` to mock data
- [x] Clicking Clear resets `analysisResults` to null

---

## Phase 2: Build ColorAnalysisPage component

**Completed:** 2026-04-08 — `src/pages/ColorAnalysisPage.jsx`, `src/pages/ColorAnalysisPage.module.css`

Pattern to follow: `src/pages/LoginPage.jsx:5` (default export, context hook at top, all styles from co-located CSS Module) and `src/pages/LoginPage.module.css:10-19` (card shape: `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: 8px`, `padding`, CSS custom properties for theming).

### Changes Required
- **New file: `src/pages/ColorAnalysisPage.jsx`** — modeled on `src/pages/LoginPage.jsx:1-5` (import pattern: CSS Module first, then context hook; default export function):
  - Line 1-3: imports — `useAnalysis` from context, `styles` from co-located CSS Module (same pattern as `LoginPage.jsx:2-3`)
  - Line 5: `export default function ColorAnalysisPage()` (same export style as `LoginPage.jsx:5`)
  - Import `useAnalysis` from `../../context/AnalysisContext`
  - Destructure: `startDate`, `endDate`, `shift`, `selectedLines`, `analysisResults`, `isRunning`
  - **Header** (`<section className={styles.header}>`):
    - Left side: `<h1 className={styles.title}>Color Analysis – Plant Overview</h1>` + `<p className={styles.subtitle}>{startDate} – {endDate} · Shift: {shiftLabel} · Lines: {selectedLines.size} selected</p>`
    - Right side: two `<span className={styles.badge}>` pills — `"{analysisResults?.totalColors ?? '–'} Colors"` and `"{analysisResults?.totalLines ?? '–'} Lines Active"`
  - **KPI grid** (`<section className={styles.kpiGrid}>`): 4 `<KpiCard>` components (defined in same file or as inner component):
    - Props: `label`, `value`, `vsPrev`; value/vsPrev come from `analysisResults?.kpis[key]` or null
    - When `isRunning`: render cards with `className={styles.loading}`
    - When value is null: display `–` in place of the number and delta

- **New file: `src/pages/ColorAnalysisPage.module.css`** — modeled on `src/pages/LoginPage.module.css:10-19` (card pattern: `var(--color-surface)`, `var(--color-border)`, `border-radius: 8px`) and `src/pages/LoginPage.module.css:26-38` (title/subtitle text styles using `var(--color-text-primary)` / `var(--color-text-muted)`):
  - `.page` — `padding: 2rem; display: flex; flex-direction: column; gap: 2rem`
  - `.header` — `display: flex; justify-content: space-between; align-items: flex-start`
  - `.title` — `font-size: 1.6rem; font-weight: 700; color: var(--color-text-primary); margin: 0` (mirrors `LoginPage.module.css:26-31`)
  - `.subtitle` — `font-size: 0.85rem; color: var(--color-text-muted); margin: 0.25rem 0 0` (mirrors `LoginPage.module.css:33-39`)
  - `.headerRight` — `display: flex; gap: 0.5rem; align-items: center`
  - `.badge` — pill: `padding: 0.25rem 0.75rem; border-radius: 999px; background: var(--color-surface-raised); border: 1px solid var(--color-border); font-size: 0.8rem; font-weight: 600` (uses same CSS vars as `LoginPage.module.css:13-14`)
  - `.kpiGrid` — `display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem`
  - `.kpiCard` — card shape matching `LoginPage.module.css:10-19`: `background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem`
  - `.kpiLabel` — `font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted)` (mirrors `LoginPage.module.css:36-38`)
  - `.kpiValue` — `font-size: 2.5rem; font-weight: 700; line-height: 1; color: var(--color-text-primary)`
  - `.kpiDelta` — `font-size: 0.8rem`; `.positive { color: #16a34a }`, `.negative { color: #dc2626 }`
  - `.loading` — `opacity: 0.5; pointer-events: none`

### Success Criteria
- [x] Page renders with `–` placeholders in header badges and KPI values before Run Analysis is clicked
- [x] After run completes, header shows `7 Colors` / `6 Lines Active` badges
- [x] All 4 KPI cards display values with correctly colored `+/-` delta lines
- [x] Layout matches reference image: header row at top, card grid below
- [x] All styles use CSS Modules — no inline styles, no global class names

---

## Phase 3: Wire MainContent to render ColorAnalysisPage

**Completed:** 2026-04-08 — `src/components/layout/MainContent.jsx`

### Changes Required
- **`src/components/layout/MainContent.jsx:1`** — add two imports at the top of the file (after the existing `styles` import):
  ```js
  import { useAnalysis } from '../../context/AnalysisContext'
  import ColorAnalysisPage from '../../pages/ColorAnalysisPage'
  ```
- **`src/components/layout/MainContent.jsx:3`** — change the function signature from `MainContent({ activeSection })` to `MainContent()` (the component will read `analysisType` from context instead of a prop)
- **`src/components/layout/MainContent.jsx:3-19`** — add context consumption and conditional rendering at the top of the function body:
  ```jsx
  const { analysisType } = useAnalysis()
  if (analysisType === 'color_analysis') return <ColorAnalysisPage />
  ```
  Keep the existing `<main>` placeholder JSX for all other cases (lines 4-18 unchanged in structure)

### Success Criteria
- [x] Selecting "Color Analysis" in the SideNav Analysis Type dropdown renders `ColorAnalysisPage` in the main content area
- [x] Selecting any other analysis type (or clearing selection) shows the existing placeholder
- [x] No prop drilling — `ColorAnalysisPage` reads its own state from `useAnalysis()`

---

## Rollback
All changes are additive or isolated:
- Phase 1: revert `src/context/AnalysisContext.jsx` — remove `analysisResults`/`isRunning` state, restore original `runAnalysis` body (`console.log` only), remove `MOCK_RESULTS` constant, remove new keys from context value object
- Phase 2: delete `src/pages/ColorAnalysisPage.jsx` and `src/pages/ColorAnalysisPage.module.css`
- Phase 3: revert `src/components/layout/MainContent.jsx` — remove the two new imports, restore `{ activeSection }` prop, remove the `useAnalysis()` call and conditional render

No database, no shared infrastructure, no other components touched.
