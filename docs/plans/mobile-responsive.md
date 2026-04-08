# Mobile Responsive Implementation Plan

## Overview
Make the Analysis Engine fully usable on mobile devices (≤767px). The primary challenge is the SideNav: it currently collapses by shrinking to `width: 0`, which pushes content — fine on desktop, but on mobile it should be a fixed overlay drawer. Secondary concerns are touch target sizes, font/padding scaling, and the LoginPage card layout.

Viewport meta tag (`width=device-width, initial-scale=1.0`) is already present in `index.html:5` — no change needed.

## Current State
- `src/components/layout/AppLayout.jsx:9` — `menuOpen` defaults to `true` (always open on load)
- `src/components/layout/AppLayout.module.css:1-12` — no media queries; `.body` is a plain flex row
- `src/components/layout/SideNav.module.css:1-246` — `width: 272px`, collapsed via `[data-collapsed='true'] { width: 0 }`, no mobile override
- `src/components/layout/TopBar.module.css:1-100` — `.menuToggle` is 30×30px (below 44px touch target minimum)
- `src/components/layout/MainContent.module.css:1-57` — no responsive padding
- `src/pages/LoginPage.module.css:1-108` — `.card` has `max-width: 380px` with no small-screen padding fallback

## Out of Scope
- Tablet-specific layouts (768px–1024px)
- Touch gestures (swipe to open/close nav)
- Responsive data tables or charts (no data layer yet)

---

## Phase 1: AppLayout — mobile-aware menu state + backdrop

**Completed:** 2026-04-08

### Changes Required
- **File:** `src/components/layout/AppLayout.jsx:9` — Change `menuOpen` initial state from `true` to `window.innerWidth >= 768` so the nav starts closed on mobile.
- **File:** `src/components/layout/AppLayout.jsx` — Add a `backdrop` div inside `.appShell` (sibling to `.body`), rendered when `menuOpen && window.innerWidth < 768`. Clicking it calls `setMenuOpen(false)`. Use a ref or inline handler — no new state needed.
- **File:** `src/components/layout/AppLayout.module.css` — Add `.backdrop` class: `position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 150; display: none`. Add `@media (max-width: 767px) { .backdrop { display: block } }` so it only appears on mobile.

### Success Criteria
- [x] On mobile viewport, app loads with nav closed
- [x] Opening nav on mobile shows a semi-transparent backdrop
- [x] Tapping backdrop closes the nav

---

## Phase 2: SideNav — mobile overlay mode

**Completed:** 2026-04-08

### Changes Required
- **File:** `src/components/layout/SideNav.module.css:3` — `.sideNav` is `width: 272px` with no mobile behavior. Append a `@media (max-width: 767px)` block after line 246 (end of file) that overrides `.sideNav` to:
  ```css
  position: fixed;
  top: var(--topbar-height);
  left: 0;
  height: calc(100% - var(--topbar-height));
  z-index: 200;
  width: 272px;
  transform: translateX(0);
  transition: transform 0.2s ease;
  ```
- **File:** `src/components/layout/SideNav.module.css:14` — `.sideNav[data-collapsed='true']` currently sets `width: 0`. Within the same mobile media query block, override this rule to `transform: translateX(-272px); width: 272px` so it slides out instead of collapsing (keeping `width` prevents a layout jump mid-animation).

### Success Criteria
- [x] On mobile, nav slides in/out from the left as an overlay (does not push content)
- [x] On desktop (≥768px), original width-collapse behavior is unchanged
- [x] Nav is fully visible and scrollable when open on a 375px viewport

---

## Phase 3: TopBar, MainContent, and LoginPage responsive polish

**Completed:** 2026-04-08

### Changes Required
- **File:** `src/components/layout/TopBar.module.css:20` — `.menuToggle` is `width: 30px; height: 30px` (below 44px touch target). Append a `@media (max-width: 767px)` block after line 100 (end of file) overriding `.menuToggle` to `width: 44px; height: 44px`.
- **File:** `src/components/layout/TopBar.module.css:48` — `.brandName` has no overflow handling. In the same mobile media query block, add `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px` to prevent layout overflow on narrow screens.
- **File:** `src/components/layout/MainContent.module.css:9` — `.pageHeader` padding is `1.25rem 1.75rem`. Append a `@media (max-width: 767px)` block after line 57 (end of file) reducing `.pageHeader` padding to `1rem`.
- **File:** `src/components/layout/MainContent.module.css:31` — `.placeholderCard` padding is `2.5rem 3rem`. In the same mobile media query block, reduce to `1.5rem 1rem`.
- **File:** `src/pages/LoginPage.module.css:1` — `.page` uses `align-items: center`. Append a `@media (max-width: 767px)` block after line 108 (end of file) changing `.page` to `align-items: flex-start; padding-top: 2rem`.
- **File:** `src/pages/LoginPage.module.css:10` — `.card` has `max-width: 380px`. In the same mobile media query block, override `.card` to `width: 100%; max-width: 100%; padding: 1.5rem 1rem; border-radius: 0` to fill the screen with safe side padding.

### Success Criteria
- [x] Menu toggle button is at least 44×44px on mobile
- [x] Brand name truncates gracefully instead of wrapping or overflowing
- [x] MainContent has comfortable padding on narrow screens
- [x] LoginPage card fills the screen width on mobile with no horizontal scroll

---

## Rollback
All changes are CSS additions (new `@media` blocks) and a minimal JSX change to initial state + a backdrop div. To revert:
```
git checkout -- src/components/layout/AppLayout.jsx
git checkout -- src/components/layout/AppLayout.module.css
git checkout -- src/components/layout/SideNav.module.css
git checkout -- src/components/layout/TopBar.module.css
git checkout -- src/components/layout/MainContent.module.css
git checkout -- src/pages/LoginPage.module.css
```
