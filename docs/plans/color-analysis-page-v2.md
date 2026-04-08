# Color Analysis Page – Refinements (v2) Implementation Plan

## Overview
Three targeted improvements to the Color Analysis page:
1. **Header cleanup** — remove floating badge pills; fold summary counts into the subtitle line
2. **KPI grid layout** — lock 4 cards to one row with a responsive fallback; add per-card loading skeletons
3. **KPI breakdown** — add sub-metric detail rows beneath each KPI value; requires extending `MOCK_RESULTS`

## Current State
- `src/context/AnalysisContext.jsx:34-43` — `MOCK_RESULTS` kpis have shape `{ value, vsPrev }` only; no `details` sub-metrics
- `src/pages/ColorAnalysisPage.jsx:25-32` — `headerRight` div with two `<span className={styles.badge}>` pills showing "X Colors" / "X Lines Active"
- `src/pages/ColorAnalysisPage.jsx:35` — kpiGrid loading state is a CSS opacity fade (`styles.loading`)
- `src/pages/ColorAnalysisPage.jsx:57-76` — `KpiCard` renders label, value, delta only; no breakdown rows
- `src/pages/ColorAnalysisPage.module.css:52-57` — `.kpiGrid` uses `repeat(auto-fit, minmax(180px, 1fr))` which wraps Quality to a second row on mid-width viewports
- `src/pages/ColorAnalysisPage.module.css:96-99` — `.loading` applies `opacity: 0.5; pointer-events: none` to the whole grid

## Out of Scope
- Real data / API integration
- Drill-down charts or row-level data tables
- Changes to SideNav, AnalysisContext filter state, or other pages

---

## Phase 1: Extend MOCK_RESULTS with sub-metric details

**Completed:** 2026-04-08 — `src/context/AnalysisContext.jsx`

### Changes Required
- **File:** `src/context/AnalysisContext.jsx:34-43` — replace each flat `{ value, vsPrev }` entry with `{ value, vsPrev, details: [...] }`. Current lines 34-43 define `MOCK_RESULTS` with kpis having no `details` field; new shape:

```js
const MOCK_RESULTS = {
  totalColors: 7,
  totalLines: 6,
  kpis: {
    oee: {
      value: 82.3, vsPrev: +1.5,
      details: [
        { label: 'Availability', value: '87.4%' },
        { label: 'Performance', value: '91.2%' },
        { label: 'Quality',     value: '94.7%' },
      ],
    },
    availability: {
      value: 87.4, vsPrev: +2.1,
      details: [
        { label: 'Run Time',  value: '14.2 hrs' },
        { label: 'Down Time', value: '1.8 hrs'  },
      ],
    },
    performance: {
      value: 91.2, vsPrev: -0.8,
      details: [
        { label: 'Actual Rate', value: '94 lbs/hr'  },
        { label: 'Target Rate', value: '103 lbs/hr' },
      ],
    },
    quality: {
      value: 94.7, vsPrev: +1.3,
      details: [
        { label: 'Good Lbs',  value: '1,240' },
        { label: 'Scrap Lbs', value: '87'    },
      ],
    },
  },
}
```

### Success Criteria
- [x] `analysisResults.kpis.oee.details` is an array of `{ label, value }` objects
- [x] All four KPI entries have a non-empty `details` array
- [x] Existing `value` and `vsPrev` fields are unchanged

---

## Phase 2: Refresh ColorAnalysisPage UI

**Completed:** 2026-04-08 — `src/pages/ColorAnalysisPage.jsx`, `src/pages/ColorAnalysisPage.module.css`

### Changes Required

#### 2a — Header cleanup (`src/pages/ColorAnalysisPage.jsx:16-33`)
Remove the `headerRight` div and its two badge `<span>` elements (lines 25-32). Integrate the summary counts into the subtitle `<p>` at line 21-23, appending them after the existing filter text when `analysisResults` is set:

```jsx
<p className={styles.subtitle}>
  {startDate} – {endDate} · {shiftLabel} · Lines: {selectedLines.size} selected
  {analysisResults && ` · ${analysisResults.totalColors} Colors · ${analysisResults.totalLines} Lines`}
</p>
```

Remove the `.headerRight` and `.badge` class usages from the JSX. The `<header>` element becomes a single-column layout (no `justify-content: space-between` needed once the right side is gone).

#### 2b — KPI grid layout (`src/pages/ColorAnalysisPage.module.css:52-57`)
Replace `repeat(auto-fit, minmax(180px, 1fr))` with `repeat(4, 1fr)` so all four cards always share one row. Add responsive breakpoints:

```css
.kpiGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  transition: opacity 0.2s;
}

@media (max-width: 900px) {
  .kpiGrid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 500px) {
  .kpiGrid { grid-template-columns: 1fr; }
}
```

#### 2c — Loading skeleton (`src/pages/ColorAnalysisPage.jsx:35` and `src/pages/ColorAnalysisPage.module.css`)
When `isRunning` is true, render `<KpiCardSkeleton />` in place of each `<KpiCard>`:

```jsx
<div className={styles.kpiGrid}>
  {isRunning ? (
    <>
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
    </>
  ) : (
    <>
      <KpiCard label="OEE"          data={analysisResults?.kpis.oee          ?? null} />
      <KpiCard label="Availability" data={analysisResults?.kpis.availability ?? null} />
      <KpiCard label="Performance"  data={analysisResults?.kpis.performance  ?? null} />
      <KpiCard label="Quality"      data={analysisResults?.kpis.quality      ?? null} />
    </>
  )}
</div>
```

`KpiCardSkeleton` is a non-exported function in the same file (follows co-locate single-use helpers convention from CLAUDE.md):

```jsx
function KpiCardSkeleton() {
  return (
    <div className={`${styles.kpiCard} ${styles.skeleton}`}>
      <div className={`${styles.skeletonBar} ${styles.skeletonLabel}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonValue}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonDelta}`} />
      <div className={styles.skeletonDivider} />
      <div className={`${styles.skeletonBar} ${styles.skeletonDetail}`} />
      <div className={`${styles.skeletonBar} ${styles.skeletonDetail}`} />
    </div>
  )
}
```

New skeleton CSS classes to add to `ColorAnalysisPage.module.css`:

```css
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}

.skeleton {
  pointer-events: none;
}

.skeletonBar {
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--color-surface-raised) 25%,
    var(--color-surface-hover)  50%,
    var(--color-surface-raised) 75%
  );
  background-size: 400px 100%;
  animation: shimmer 1.4s infinite linear;
}

.skeletonLabel  { height: 0.6rem;  width: 40%; }
.skeletonValue  { height: 2.2rem;  width: 70%; margin: 0.2rem 0; }
.skeletonDelta  { height: 0.6rem;  width: 55%; }
.skeletonDivider {
  height: 1px;
  background: var(--color-border);
  margin: 0.75rem 0 0.5rem;
}
.skeletonDetail { height: 0.55rem; width: 80%; margin-bottom: 0.35rem; }
```

Remove the `.loading` class from `ColorAnalysisPage.module.css` (no longer used after switching to skeleton components).

#### 2d — KPI breakdown rows (`src/pages/ColorAnalysisPage.jsx:57-76`)
Update `KpiCard` to render a divider and detail rows when `data.details` is present:

```jsx
function KpiCard({ label, data }) {
  const deltaClass = data
    ? data.vsPrev >= 0 ? styles.positive : styles.negative
    : ''
  const deltaSign = data && data.vsPrev >= 0 ? '+' : ''

  return (
    <div className={styles.kpiCard}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={styles.kpiValue}>
        {data ? `${data.value}%` : '–'}
      </span>
      <span className={`${styles.kpiDelta} ${deltaClass}`}>
        {data ? `${deltaSign}${data.vsPrev}% vs prev. period` : 'No data'}
      </span>
      {data?.details?.length > 0 && (
        <>
          <hr className={styles.kpiDivider} />
          <dl className={styles.kpiDetails}>
            {data.details.map(d => (
              <div key={d.label} className={styles.kpiDetailRow}>
                <dt className={styles.kpiDetailLabel}>{d.label}</dt>
                <dd className={styles.kpiDetailValue}>{d.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  )
}
```

New CSS classes for the breakdown section to add to `ColorAnalysisPage.module.css`:

```css
.kpiDivider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0.75rem 0 0.5rem;
}

.kpiDetails {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
}

.kpiDetailRow {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.kpiDetailLabel {
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.kpiDetailValue {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0;
}
```

Also update `.headerLeft` in `ColorAnalysisPage.module.css` — since the right-side badges are gone, remove `justify-content: space-between` from `.header` and let it default to `flex-start`:

```css
.header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
```

(`.headerLeft` and `.headerRight` classes can be removed from the CSS file as they will no longer be used in the JSX.)

### Success Criteria
- [x] Header shows no badge pills; subtitle line appends "· 7 Colors · 6 Lines" only after Run Analysis completes
- [x] All 4 KPI cards remain on one row at ≥ 901 px viewport; fall to 2×2 at 500–900 px; stack at < 500 px
- [x] Clicking Run Analysis shows skeleton cards (animated shimmer) for ~600 ms before real data appears
- [x] Each KPI card shows a divider and 2-3 labeled detail rows after data loads
- [x] No inline styles; all new styles in `ColorAnalysisPage.module.css` using CSS vars
- [x] `.loading` class removed (replaced by skeleton pattern)

---

## Rollback
- Phase 1: revert `MOCK_RESULTS` in `src/context/AnalysisContext.jsx:34-43` to flat `{ value, vsPrev }` shape
- Phase 2: revert `src/pages/ColorAnalysisPage.jsx` and `src/pages/ColorAnalysisPage.module.css` to the state after the v1 plan
