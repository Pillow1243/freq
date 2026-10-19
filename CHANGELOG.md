# Changelog

All notable changes to FREQ are documented here. The site has no build step, so
versions are tagged in `package.json` and `APP_VERSION` in `app.js`.

## 2.1.0 — 2026-10-19

A major visual refresh focused on personalisation and a cleaner product identity.

### Added
- 30 additional hand-tuned palettes, bringing the theme library to 50 choices.
- 11 selectable player appearances: Studio, Vinyl, Spectrum, Retro FM, Minimal,
  Glass, Neon, Album Art, Wave, Compact and Terminal.
- Live player-style previews, persistent selection, accessible dialogs and backup
  import/export support for the selected player appearance.

### Changed
- Removed the personal Telegram channel promotion from the app, metadata and README.
- Replaced the settings gear with a centered, symmetric outline icon.
- Updated shell cache-busting to `?v=33` and the service-worker cache to `freq-v2.1.0`.

### Fixed
- Kept the selected player appearance and theme names in sync with Persian/English.

## 2.0.1 — 2026-10-19

A final polish pass on top of 2.0.0.

### Added
- Search history: the last six queries are saved locally and offered through a
  native `<datalist>` suggestion list.
- Bounded service-worker caches (shell, runtime, API) so long sessions cannot
  grow storage without limit.
- Offline and failure guards for infinite scroll/MOSAIC tails, restoring the
  previous language after a backup import, and an `aria-pressed` voice toggle.

### Changed
- Tag/credits polish: country chips render flags, the author credit moved into
  the player dock, and the French/English "tuned" lamp label is now correct.
- `?v=32` cache busting and `freq-v2.0.1` service-worker cache.
- `defer` on all three boot scripts for non-blocking parsing.
- 32 automated tests (core helpers, DOM boot, rendered interactions) and a
  stricter static check suite; ESLint is clean.

### Fixed
- Duplicate `renderCountries`/`renderSleep` calls during library re-render.
- `goHere` now closes the filter drawer before reloading stations.
- Search/voice flows keep the URL and toggle state in sync.

## 2.0.0 — 2026-10-19

A ground-up quality pass over the whole app.

### Added
- `core.js`: a pure, UMD helper module with URL sanitising, station normalisation,
  query builders, filter (de)serialisation, Jalali dates and formatting helpers.
- Real offline support: a caching service worker (precached shell, SWR assets,
  network-first API with cached fallback) plus an in-app update prompt.
- `scripts/dev-server.mjs`, `scripts/check.mjs`, ESLint 9 flat config and a
  `node:test` suite (unit + jsdom integration) wired into `npm run verify`.
- Staged GitHub Pages deploy with a quality gate, CI workflow and Dependabot.
- Accessible layer stack: focus trap, focus restore, Tab handling, Escape and the
  Android back button for all dialogs.
- Playback engine: stream fallback, 15-second watchdog, buffering states, resume,
  auto-skip on dead streams, Media Session handlers and a polite live region.
- Infinite scroll with `IntersectionObserver`, skeleton cards, empty/error states,
  retry action and cached snapshot fallback.
- World map dots for the current results, near-me discovery and a real directory
  station counter.
- Sleep timer dock chip, listening stats with reset, folders, 20 themes, and
  versioned JSON backup import/export.
- SEO: Open Graph/Twitter tags, JSON-LD, canonical URL, `robots.txt`, `sitemap.xml`
  and a styled bilingual 404 page.

### Changed
- Persian is the first-visit default for Persian browsers; English otherwise.
- All user-facing strings live in `i18n.js` with enforced fa/en parity.
- URLs are shareable: filters, view, wave and station deep links round-trip through
  `parseFilters`/`filtersToQuery`.
- Reduced-motion, high-contrast and light-skin styles; canvas FX pause in background
  tabs and respect motion preferences.
- `?v=32` cache busting across the shell.

### Fixed
- Streams without `url_resolved`, insecure favicons and hostile station metadata are
  rejected or sanitised before reaching the DOM.
- Hidden stations stay hidden in favourites/recents/folders and undo restores them.
- A failing stream no longer loops forever; playback is announced and skippable.

## 1.0.0 — 2025

Original single-file radio player by Mobin.A.
