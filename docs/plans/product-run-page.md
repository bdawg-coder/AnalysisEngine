# Product Run Page Implementation Plan

## Overview
Add a `ProductRunPage` that mirrors `ColorAnalysisPage` in structure, layout, and mock behavior. To avoid duplicating the `KpiCard`/`KpiCardSkeleton` components (which will now be used by two pages), extract them to a shared component first. Then wire `ProductRunPage` into routing and move Product Run before Color Analysis in the dropdown.

## Current State
- `src/pages/ColorAnalysisPage.jsx:4` — page component with inline `KpiCard`, `KpiCardSkeleton`, `kpiValueColorClass`
- `src/pages/ColorAnalysisPage.module.css:50-145` — KPI card styles mixed with page-level styles
- `src/components/layout/MainContent.jsx:8` — routes `color_analysis` → `ColorAnalysisPage`; all other types fall through to placeholder
- `src/context/AnalysisContext.jsx:8-11` — `ANALYSIS_TYPES` has Color Analysis first, Product Run second
- `src/context/AnalysisContext.jsx:34-68` — `MOCK_RESULTS` shape: `{ totalColors, totalLines, kpis: { oee, availability, performance, quality } }`

## Out of Scope
- Real API integration
- Product Run-specific filters in SideNav
- Any changes to `MOCK_RESULTS` shape or `runAnalysis` logic

---

## Phase 1: Extract KpiCard to a shared component

Extract the three helpers that will be shared across both pages.

### Changes Required

- **New file:** `src/components/KpiCard.jsx` — export `KpiCard` and `KpiCardSkeleton`; keep `kpiValueColorClass` as module-private helper
  - Move `kpiValueColorClass` from `src/pages/ColorAnalysisPage.jsx:47-51`
  - Move `KpiCard` from `src/pages/ColorAnalysisPage.jsx:53-77`
  - Move `KpiCardSkeleton` from `src/pages/ColorAnalysisPage.jsx:79-90`
  - Add `import styles from './KpiCard.module.css'` at top
  - Export `KpiCard` and `KpiCardSkeleton` (add `export` keyword); `kpiValueColorClass` stays unexported

- **New file:** `src/components/KpiCard.module.css` — move KPI card + skeleton styles from `src/pages/ColorAnalysisPage.module.css:48-146` (lines starting at `/* ── KPI Card ──` through EOF, including `@keyframes shimmer`)

- **Edit:** `src/pages/ColorAnalysisPage.module.css:48-146` — delete lines 48–146 (KPI card, breakdown, and skeleton blocks); retain only lines 1–46 (`.page`, `.header`, `.title`, `.subtitle`, `.kpiGrid` + media queries)

- **Edit:** `src/pages/ColorAnalysisPage.jsx:1-2` — replace the two import lines with:
  ```js
  import styles from './ColorAnalysisPage.module.css'
  import { useAnalysis, SHIFTS } from '../context/AnalysisContext'
  import { KpiCard, KpiCardSkeleton } from '../components/KpiCard'
  ```
- **Edit:** `src/pages/ColorAnalysisPage.jsx:47-90` — delete the three inline function definitions (`kpiValueColorClass`, `KpiCard`, `KpiCardSkeleton`) now that they live in the shared component

**Completed:** 2026-04-08 — `src/components/KpiCard.jsx`, `src/components/KpiCard.module.css`, `src/pages/ColorAnalysisPage.jsx`, `src/pages/ColorAnalysisPage.module.css`

### Success Criteria
- [x] `ColorAnalysisPage` renders identically to before (KPI cards, skeleton, header)
- [x] No CSS regressions on KPI card appearance

---

## Phase 2: Create ProductRunPage

### Changes Required

- **New file:** `src/pages/ProductRunPage.jsx` — model on `src/pages/ColorAnalysisPage.jsx:1-44`; exact differences:
  - `src/pages/ColorAnalysisPage.jsx:19` → change title string to `"Product Run Analysis – Plant Overview"`
  - `src/pages/ColorAnalysisPage.jsx:22` → replace `` `· ${analysisResults.totalColors} Colors · ${analysisResults.totalLines} Lines` `` with `` `· ${analysisResults.totalLines} Lines` `` (product run has no color count)
  - Imports: `styles` from `'./ProductRunPage.module.css'`; `KpiCard`/`KpiCardSkeleton` from `'../components/KpiCard'` (no inline definitions)

- **New file:** `src/pages/ProductRunPage.module.css` — identical content to `src/pages/ColorAnalysisPage.module.css:1-46` (page, header, grid styles only — KPI card styles live in `src/components/KpiCard.module.css`)

**Completed:** 2026-04-08 — `src/pages/ProductRunPage.jsx`, `src/pages/ProductRunPage.module.css`

### Success Criteria
- [x] `ProductRunPage` renders with correct title "Product Run Analysis – Plant Overview"
- [x] KPI grid shows 4 skeleton cards while `isRunning`, then real data after `runAnalysis()`
- [x] Subtitle reflects current filter state

---

## Phase 3: Wire ProductRunPage into MainContent + reorder dropdown

### Changes Required

- **Edit:** `src/components/layout/MainContent.jsx:3` — add import:
  ```js
  import ProductRunPage from '../../pages/ProductRunPage'
  ```

- **Edit:** `src/components/layout/MainContent.jsx:8` — add routing for product_run before the color_analysis check:
  ```js
  if (analysisType === 'product_run')   return <ProductRunPage />
  if (analysisType === 'color_analysis') return <ColorAnalysisPage />
  ```

- **Edit:** `src/context/AnalysisContext.jsx:8-11` — swap order so Product Run appears first in the dropdown:
  ```js
  export const ANALYSIS_TYPES = [
    { value: 'product_run',    label: 'Product Run' },
    { value: 'color_analysis', label: 'Color Analysis' },
  ]
  ```

**Completed:** 2026-04-08 — `src/components/layout/MainContent.jsx`, `src/context/AnalysisContext.jsx`

### Success Criteria
- [x] Selecting "Product Run" in dropdown renders `ProductRunPage`
- [x] Selecting "Color Analysis" in dropdown still renders `ColorAnalysisPage`
- [x] "Product Run" is the first option in the Analysis Type dropdown
- [x] "Color Analysis" is the second option

---

## Rollback
All changes are additive except the `ANALYSIS_TYPES` reorder and the `MainContent` routing addition. To revert:
- Delete `src/pages/ProductRunPage.jsx` and `ProductRunPage.module.css`
- Delete `src/components/KpiCard.jsx` and `KpiCard.module.css`
- Restore `ColorAnalysisPage.jsx` and `ColorAnalysisPage.module.css` from git
- Restore `AnalysisContext.jsx` and `MainContent.jsx` from git
