# Changelog

All notable changes to FREQ are documented here. The site has no build step, so
versions are tagged in `package.json` and `APP_VERSION` in `app.js`.

## 2.1.1 — 2026-10-19

A P0 pass on the things that actually stopped the app from working: the fake
offline message, stations that never loaded, and playback failures that gave no
reason. Status of every checklist item: `docs/CHECKLIST-STATUS.md`.

### Fixed
- **The service worker no longer answers a failed directory lookup with an empty
  `200 []`.** That fake success suppressed mirror failover, locked the empty
  answer into the 45s API cache and left the list blank — it is the main reason
  stations did not load. A `504` is returned now, and the SW timeout no longer
  races the page timeout.
- **A directory outage is no longer reported as “You’re offline”.** Network
  state is classified (`offline / network / timeout / server / rate / blocked /
  api / empty`) into an honest banner tone, retry countdown and per-reason copy;
  the saved snapshot and favourites stay on screen behind it.
- **Zero-result lists were stuck on skeletons.** The loading flags are cleared
  before rendering and are now part of the render key.
- **Dead mirrors stalled every first paint.** Only `de1`/`de2`/`all` answer
  today, so the mirror list was fixed and per-host failures get an escalating
  cooldown (`freq-mirrors`) with a 15s total budget instead of 4×9s.
- **An empty answer for an unfiltered browse is treated as an outage** (retry +
  snapshot) instead of “no stations exist”, while a genuinely empty search still
  shows the normal empty state.
- Empty API results are no longer cached, so “Retry” actually re-requests.
- Station logos are upgraded to `https:` to stop mixed-content blocks on GitHub
  Pages.

### Added
- **Stream capability detection**: HLS/DASH/http-only streams fail fast with an
  explicit reason (`whyHls`, `whyInsecure`, …) and a “Next” action instead of a
  15s watchdog; an http-only stream is retried over `https` first.
- **“Playable only” filter** (`hls=false`), auto-enabled on browsers without
  native HLS and auto-disabled on Safari/iOS; persisted and covered by
  backup/export.
- **Reconnect with backoff** (up to 3 attempts on the same stream) plus `stalled`
  handling and `MediaError.code` → message mapping.
- **Per-station stream health**: a station that dies is quarantined locally
  (exponential, 5min–6h) and skipped by next/prev/scan; the new
  **“Report broken”** action also flags it in the directory (`?broken=true`) and
  hides it with an undo.
- **Search by country, city, genre and language**: `smartFilters` promotes a
  query that names a country/language/genre to its own directory field
  (Persian-aware normalisation), city filters round-trip through `?city=`, and
  the station sheet gained “More from <city>”.
- **Autoplay recovery**: `needsGesture` state, a toast and a one-shot
  pointer/key listener that resumes the same station.
- Hidden, unsupported mic button; `data-i18n-title` tooltips; 44px touch
  targets for player/header controls; a real bilingual offline page in the SW.
- 25 new unit tests + 10 new behaviour tests (58 total).

### Changed
- `scripts/check.mjs` now scans `app.js` templates for `data-act`, so dead
  buttons fail CI instead of being excused by an allow-list.
- Mirrors list reordered with live health; cache-busting `?v=34`,
  `freq-v2.1.1` service-worker cache.

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
