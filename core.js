/*!
 * FREQ core — pure, dependency-free helpers shared by the app, the service
 * worker tooling and the test-suite. Made by Mobin.A.
 *
 * Works both as a classic browser script (window.FreqCore) and as a CommonJS
 * module (require("./core.js")) so it can be unit-tested with node:test.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FreqCore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const LIMITS = {
    uuid: 80,
    name: 180,
    tags: 480,
    country: 80,
    countrycode: 2,
    language: 160,
    codec: 32,
    url: 2048,
    image: 4096,
    text: 240,
  };

  const ORDERS = ["clickcount", "votes", "name", "bitrate", "clicktrend", "random"];
  const SORTS = { popular: "clickcount", votes: "votes", az: "name", bitrate: "bitrate" };
  const WAVES = ["am", "fm", "sw"];

  /* ---------------------------------------------------------------- strings */

  /** Coerce to a bounded, trimmed string. */
  function text(value, max) {
    if (value === null || value === undefined) return "";
    let out;
    if (typeof value === "string") out = value;
    else if (typeof value === "number" || typeof value === "boolean") out = String(value);
    else return "";
    out = out.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    if (max && out.length > max) out = out.slice(0, max).trim();
    return out;
  }

  /** HTML-escape for text nodes and quoted attributes. */
  function esc(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** Clamp a number to an inclusive range (falls back to `min`). */
  function clamp(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  /** Resolve an injected clock for tests without treating 0 as "missing". */
  function timeOr(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : Date.now();
  }

  /** Round a numeric API field to a non-negative safe integer. */
  function count(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(2 ** 31, Math.round(n));
  }

  /* -------------------------------------------------------------------- url */

  /**
   * Sanitize an untrusted URL coming from the radio directory.
   * @param {*} raw
   * @param {"stream"|"image"|"link"|"any"} [kind]
   * @returns {string} safe absolute URL or "" when rejected
   */
  function safeUrl(raw, kind) {
    const s = text(raw, kind === "image" ? LIMITS.image : LIMITS.url);
    if (!s) return "";
    if (kind === "image") {
      if (/^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(s) && s.length < 200000) {
        return s.replace(/\s+/g, "");
      }
      if (!/^https?:\/\//i.test(s) && !/^\/\//.test(s)) return "";
    }
    let url;
    try {
      url = new URL(/^\/\//.test(s) ? "https:" + s : s, "https://freq.invalid/");
    } catch (_) {
      return "";
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (kind === "stream" && /\.(?:m3u8?|pls|txt)$/i.test(url.pathname)) {
      // Playlist files are still playable by some browsers; keep them.
    }
    return url.href;
  }

  /** True when the URL is a plain http(s) link that can be opened. */
  function isWebUrl(raw) {
    return !!safeUrl(raw, "any");
  }

  /* --------------------------------------------------------------- stations */

  /**
   * Normalize one station from the Radio Browser API, dropping anything that
   * is unsafe or not playable. Returns null for invalid rows.
   */
  function normalizeStation(raw) {
    if (!raw || typeof raw !== "object") return null;
    const stationuuid = text(raw.stationuuid || raw.id, LIMITS.uuid);
    if (!stationuuid) return null;
    const url = safeUrl(raw.url, "stream");
    let url_resolved = safeUrl(raw.url_resolved, "stream") || url;
    // Prefer a secure stream when both variants exist (avoids mixed content).
    if (url_resolved && url && /^https:/i.test(url) && !/^https:/i.test(url_resolved)) {
      url_resolved = url;
    }
    if (!url_resolved) return null;
    const lat = Number(raw.geo_lat);
    const lon = Number(raw.geo_long);
    const cc = text(raw.countrycode, LIMITS.countrycode).toUpperCase();
    return {
      stationuuid: stationuuid,
      name: text(raw.name, LIMITS.name) || "—",
      url: url,
      url_resolved: url_resolved,
      homepage: safeUrl(raw.homepage, "link"),
      favicon: upgradeToHttps(raw.favicon),
      tags: text(raw.tags, LIMITS.tags),
      country: text(raw.country, LIMITS.country),
      countrycode: /^[A-Z]{2}$/.test(cc) ? cc : "",
      city: text(raw.state, 80),
      language: text(raw.language, LIMITS.language),
      codec: text(raw.codec, LIMITS.codec),
      bitrate: count(raw.bitrate),
      votes: count(raw.votes),
      clickcount: count(raw.clickcount),
      geo_lat: Number.isFinite(lat) && Math.abs(lat) <= 90 ? lat : null,
      geo_long: Number.isFinite(lon) && Math.abs(lon) <= 180 ? lon : null,
      hls: raw.hls === true || raw.hls === 1 || raw.hls === "1",
      lastcheckok: raw.lastcheckok === undefined ? 1 : count(raw.lastcheckok),
    };
  }

  /** Normalize + de-duplicate a list of stations, preserving order. */
  function normalizeStations(list) {
    if (!Array.isArray(list)) return [];
    const seen = Object.create(null);
    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const s = normalizeStation(list[i]);
      if (!s || seen[s.stationuuid]) continue;
      seen[s.stationuuid] = 1;
      out.push(s);
    }
    return out;
  }

  /** Stable key used by DOM diffing. */
  function stationKey(station) {
    return station && station.stationuuid ? String(station.stationuuid) : "";
  }

  /** Build the Radio Browser search querystring from app state. */
  function buildStationsQuery(filter, pageSize) {
    const f = filter || {};
    const limit = clamp(f.limit || pageSize || 120, 1, 500);
    const offset = clamp(f.offset || 0, 0, 1e7);
    const order = ORDERS.indexOf(f.order) >= 0 ? f.order : "clickcount";
    const p = new URLSearchParams();
    p.set("hidebroken", "true");
    p.set("is_https", "true");
    p.set("limit", String(limit));
    p.set("offset", String(offset));
    p.set("order", order);
    p.set("reverse", order === "name" || order === "random" ? "false" : "true");
    const cc = text(f.cc, 2).toUpperCase();
    if (/^[A-Z]{2}$/.test(cc)) p.set("countrycode", cc);
    const city = text(f.city, 80);
    if (city) p.set("state", city);
    const tag = text(f.tag, 48);
    if (tag) p.set("tag", tag);
    else if (f.wave === "am") p.set("tag", "news");
    else if (f.wave === "sw") p.set("tag", "world");
    const lang = text(f.language, 48);
    if (lang) p.set("language", lang);
    const q = text(f.q, 90);
    if (q) p.set("name", q);
    if (f.hd) p.set("bitrateMin", "128");
    // `hls:"skip"` (playable-only) drops streams the <audio> element cannot
    // decode; `hls:"only"` is offered for testing. Anything else: no filter.
    if (f.hls === "skip" || f.hls === false) p.set("hls", "false");
    else if (f.hls === "only" || f.hls === true) p.set("hls", "true");
    return p.toString();
  }

  /** Same query but searching tags instead of names (search fallback). */
  function buildTagFallbackQuery(filter, pageSize) {
    return buildAltSearchQuery(filter, pageSize, { tag: text((filter || {}).q, 90) });
  }

  /**
   * Second-pass query for a free-text search: instead of giving up when no
   * station is *called* "Berlin", look for stations *broadcasting from*
   * Berlin (country / state / language / tag are separate directory fields).
   */
  function buildAltSearchQuery(filter, pageSize, fields) {
    const f = filter || {};
    const p = new URLSearchParams(buildStationsQuery(f, pageSize));
    p.delete("name");
    p.delete("tag");
    const wanted = fields || {};
    const allowed = ["country", "countrycode", "state", "language", "tag"];
    let used = false;
    for (let i = 0; i < allowed.length; i += 1) {
      const key = allowed[i];
      const value = text(wanted[key], key === "countrycode" ? 2 : 90);
      if (!value) continue;
      p.set(key, key === "countrycode" ? value.toUpperCase() : value);
      used = true;
    }
    if (!used) p.set("tag", text(f.q, 90));
    return p.toString();
  }

  /** Fold Persian/Arabic spelling differences so "Germany" == "آلمان". */
  function normalizeQuery(value) {
    return text(value, 120)
      .toLowerCase()
      .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
      .replace(/\u200c/g, "")
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[۰-۹]/g, function (d) { return String(d.charCodeAt(0) - 0x06f0); })
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Which directory field should a free-text query hit? A two-letter code is a
   * country, a known country/language/tag name is promoted to its own field,
   * everything else is treated as a station name.
   *
   * @param {string} q
   * @param {{countries?:Array<{cc?:string,en?:string,fa?:string,name?:string}>,
   *          langs?:Array<{id?:string,en?:string,fa?:string}>,
   *          tags?:Array<string|{tag?:string}>}} [dict]
   */
  function smartFilters(q, dict) {
    const out = { name: "", country: "", countrycode: "", state: "", language: "", tag: "" };
    const query = normalizeQuery(q);
    if (!query) return out;
    const d = dict || {};
    if (/^[a-z]{2}$/.test(query)) {
      out.countrycode = query.toUpperCase();
      return out;
    }
    const find = function (list, pick) {
      const arr = Array.isArray(list) ? list : [];
      for (let i = 0; i < arr.length; i += 1) {
        const item = arr[i] || {};
        const aliases = (pick(item) || []).filter(Boolean).map(normalizeQuery);
        if (aliases.indexOf(query) >= 0) return item;
      }
      return null;
    };
    const country = find(d.countries, function (c) {
      return [c.en, c.fa, c.name, c.country, c.countryName];
    });
    if (country) {
      const cc = text(country.cc || country.iso_3166_1, 2).toUpperCase();
      if (/^[A-Z]{2}$/.test(cc)) out.countrycode = cc;
      else out.country = text(country.name || country.en || country.text, 80);
      return out;
    }
    const lang = find(d.langs, function (l) {
      return [l.id, l.en, l.fa, l.name];
    });
    if (lang) {
      out.language = text(lang.id || lang.name, 48).toLowerCase();
      return out;
    }
    const tag = find(d.tags, function (t0) {
      return [typeof t0 === "string" ? t0 : t0.tag, t0 && t0.en, t0 && t0.fa];
    });
    if (tag) {
      out.tag = text(typeof tag === "string" ? tag : tag.tag, 48).toLowerCase();
      return out;
    }
    out.name = text(q, 90);
    return out;
  }

  /* --------------------------------------------------------------- filters */

  /** Parse a URLSearchParams-like object into a safe filter patch. */
  function parseFilters(params) {
    const get = (key) => (params && typeof params.get === "function" ? params.get(key) : null);
    const out = {};
    const view = text(get("view"), 12);
    if (view === "fav" || view === "recent") out.view = view;
    if (get("random") === "1" || get("random") === "true") out.random = true;
    const cc = text(get("cc"), 2).toUpperCase();
    if (/^[A-Z]{2}$/.test(cc)) out.cc = cc;
    const tag = text(get("tag") || get("genre"), 48);
    if (tag) out.tag = tag;
    const city = text(get("city"), 60);
    if (city && /^[\p{L}\p{N}'’().,\- ]{2,60}$/u.test(city)) out.city = city;
    const language = text(get("lang"), 48);
    if (language) out.language = language;
    const q = text(get("q") || get("search"), 90);
    if (q) out.q = q;
    const sort = text(get("sort"), 12);
    if (sort && (Object.prototype.hasOwnProperty.call(SORTS, sort) || ORDERS.indexOf(sort) >= 0)) {
      out.sort = Object.prototype.hasOwnProperty.call(SORTS, sort) ? SORTS[sort] : sort;
    }
    const wave = text(get("wave"), 2);
    if (WAVES.indexOf(wave) >= 0) out.wave = wave;
    const station = text(get("s") || get("station"), LIMITS.uuid);
    if (station) out.station = station;
    return out;
  }

  /** Serialize app state into a clean shareable querystring. */
  function filtersToQuery(state) {
    const s = state || {};
    const p = new URLSearchParams();
    if (s.mode === "fav") p.set("view", "fav");
    else if (s.mode === "recent") p.set("view", "recent");
    if (s.cc) p.set("cc", s.cc);
    if (s.tag) p.set("tag", s.tag);
    if (s.city) p.set("city", s.city);
    if (s.langFilter) p.set("lang", s.langFilter);
    if (s.q && String(s.q).trim()) p.set("q", String(s.q).trim());
    if (s.sort && s.sort !== "clickcount" && ORDERS.indexOf(s.sort) >= 0) p.set("sort", s.sort);
    if (s.wave && s.wave !== "fm") p.set("wave", s.wave);
    if (s.stationId) p.set("s", s.stationId);
    return p.toString();
  }

  /* --------------------------------------------------------------------- fx
     An equalizer and loudness normalisation need a WebAudio graph, and a
     graph can only tap a *same-origin or CORS-clean* media element: a
     cross-origin stream without Access-Control-Allow-Origin is silently
     muted once it is wired into an AudioContext. So the app keeps two audio
     elements and picks one per station — see app.js (audioEl/fxWanted).
     Everything below is pure so it can be unit-tested without a browser.
  -------------------------------------------------------------------------- */

  /** Six shelving/peaking bands; `type` matches BiquadFilterNode. */
  const EQ_BANDS = [
    { id: "sub", hz: 60, type: "lowshelf", fa: "بم", en: "Sub" },
    { id: "bass", hz: 170, type: "peaking", fa: "بیس", en: "Bass" },
    { id: "lowmid", hz: 350, type: "peaking", fa: "تن", en: "Low mid" },
    { id: "mid", hz: 1400, type: "peaking", fa: "وسط", en: "Mids" },
    { id: "presence", hz: 4000, type: "peaking", fa: "حضور", en: "Presence" },
    { id: "air", hz: 11000, type: "highshelf", fa: "زیر", en: "Air" },
  ];

  const EQ_LIMITS = { min: -12, max: 12, bandCount: 6 };

  /**
   * Gain presets in dB, one value per EQ_BANDS entry. Values are ordered
   * low → high so the UI and the graph agree.
   */
  const EQ_PRESETS = {
    flat: [0, 0, 0, 0, 0, 0],
    bass: [7, 5, 1, 0, -1, -2],
    dance: [5, 3, 0, -1, 2, 4],
    vocal: [-4, -2, 2, 5, 4, 1],
    talk: [-8, -4, 3, 5, 3, -1],
    night: [-3, -1, 2, 2, 0, -4],
    lofi: [-2, 2, 3, 1, -3, -7],
    acoustic: [2, 3, 2, 1, 2, 3],
  };

  /** Clamp one dB value into the legal range (0 when junk). */
  function clampDb(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.round(Math.min(EQ_LIMITS.max, Math.max(EQ_LIMITS.min, n)) * 10) / 10;
  }

  /** Accept only a 6-slot numeric array of dB gains. */
  function sanitizeEq(input) {
    const out = new Array(EQ_LIMITS.bandCount).fill(0);
    const list = Array.isArray(input) ? input : null;
    if (!list) return out;
    for (let i = 0; i < EQ_LIMITS.bandCount; i += 1) out[i] = clampDb(list[i]);
    return out;
  }

  function isFlatEq(eq) {
    return sanitizeEq(eq).every(function (v) { return v === 0; });
  }

  /** EQ gain values for a named preset (falls back to flat). */
  function eqPreset(name) {
    const key = text(name, 20).toLowerCase();
    return sanitizeEq(EQ_PRESETS[key] || EQ_PRESETS.flat);
  }

  function eqPresetNames() {
    return Object.keys(EQ_PRESETS);
  }

  /**
   * Compressor settings for loudness normalisation. `strength` is 0..1;
   * higher means a lower threshold, more ratio and more makeup gain, so the
   * quiet stations come up and the loud ones stop punching.
   */
  function compressorSettings(strength) {
    const s = Number(strength);
    const k = Number.isFinite(s) ? Math.min(1, Math.max(0, s)) : 0.55;
    return {
      threshold: Math.round((-8 - 24 * k) * 10) / 10,
      knee: Math.round((4 + 18 * (1 - k)) * 10) / 10,
      ratio: Math.round((2 + 14 * k) * 10) / 10,
      attack: 0.004,
      release: Math.round((0.25 - 0.15 * k) * 1000) / 1000,
      makeup: Math.round((1 + 0.55 * k) * 100) / 100,
    };
  }

  /**
   * Final element volume. `trim` is the per-station multiplier (0.5–1.5),
   * `master` the global one; the result must stay inside [0,1] because the
   * element clamps silently and a 1.4 would read as "broken volume slider".
   */
  function effectiveVolume(userVol, master, trim) {
    const u = Number(userVol);
    const base = Number.isFinite(u) ? Math.min(1, Math.max(0, u)) : 0.85;
    const m = Number(master);
    const t = Number(trim);
    const factor =
      (Number.isFinite(m) ? Math.min(1.5, Math.max(0, m)) : 1) *
      (Number.isFinite(t) ? Math.min(1.5, Math.max(0, t)) : 1);
    const out = base * factor;
    if (!(out > 0)) return 0;
    return Math.round(Math.min(1, out) * 1000) / 1000;
  }

  const TRIM_MIN = 0.4;
  const TRIM_MAX = 1.5;

  /** Keep the per-station trim map small and free of junk keys. */
  function sanitizeTrims(input, max) {
    const limit = Number(max) > 0 ? Number(max) : 120;
    const src = input && typeof input === "object" ? input : {};
    const out = {};
    const keys = Object.keys(src);
    for (let i = 0; i < keys.length && i < limit * 2; i += 1) {
      const id = text(keys[i], 80);
      const value = Number(src[keys[i]]);
      if (!id || !Number.isFinite(value)) continue;
      if (Math.abs(value - 1) < 0.001) continue;
      out[id] = Math.round(Math.min(TRIM_MAX, Math.max(TRIM_MIN, value)) * 100) / 100;
      if (Object.keys(out).length >= limit) break;
    }
    return out;
  }

  /**
   * Slider position for a trim multiplier. The slider carries the trim as a
   * percentage (40..150), so the thumb reading and the label never disagree and
   * unity is exactly 100 — no "why is the middle 55%" for the user.
   */
  function trimToSlider(trim) {
    const t = Number(trim);
    const v = Number.isFinite(t) ? Math.min(TRIM_MAX, Math.max(TRIM_MIN, t)) : 1;
    return Math.round(v * 100);
  }
  function sliderToTrim(percent) {
    const p = Number(percent);
    if (!Number.isFinite(p)) return 1;
    return Math.round(Math.min(TRIM_MAX * 100, Math.max(TRIM_MIN * 100, p))) / 100;
  }

  /* -------------------------------------------------------------- transport */

  /**
   * A failed directory request is NOT the same thing as "you are offline".
   * Turning one into the other is what produced the misleading
   * "You're offline — showing what we saved for you." banner while the
   * station list silently stayed empty. Classify the failure instead.
   *
   * @param {{status?:number, online?:boolean, aborted?:boolean,
   *          retryAfter?:number, empty?:boolean}} [info]
   */
  function classifyFailure(info) {
    const i = info || {};
    const status = Number(i.status) || 0;
    if (i.aborted) return { kind: "timeout", i18n: "netTimeout", retryMs: 6000, mirror: true, hard: false };
    if (i.online === false) return { kind: "offline", i18n: "offlineBody", retryMs: 0, mirror: false, hard: true };
    if (status === 429) {
      const wait = clamp(Number(i.retryAfter) || 15, 5, 300) * 1000;
      return { kind: "rate", i18n: "netRate", retryMs: wait, mirror: false, hard: false };
    }
    if (status === 401 || status === 403) {
      return { kind: "blocked", i18n: "netBlocked", retryMs: 120000, mirror: false, hard: false };
    }
    if (status === 404 || status === 400 || status === 405) {
      return { kind: "api", i18n: "netApi", retryMs: 300000, mirror: false, hard: true };
    }
    if (status >= 500) return { kind: "server", i18n: "netServer", retryMs: 10000, mirror: true, hard: false };
    if (i.empty) return { kind: "empty", i18n: "netEmpty", retryMs: 12000, mirror: true, hard: false };
    return { kind: "network", i18n: "netUnreachable", retryMs: 8000, mirror: true, hard: false };
  }

  /** Exponential backoff with a ceiling (used for retries and mirror cooldowns). */
  function backoff(attempt, baseMs, maxMs) {
    const base = Number(baseMs) > 0 ? Number(baseMs) : 4000;
    const cap = Number(maxMs) > 0 ? Number(maxMs) : 60000;
    return Math.min(cap, Math.round(base * Math.pow(2, clamp(Number(attempt) || 0, 0, 8))));
  }

  /**
   * Order mirrors for one attempt: preferred first, then healthy ones, and
   * anything still in cooldown last (never dropped, so a recovering mirror can
   * still be re-probed). This is what stops one dead server from stalling the
   * whole first paint.
   */
  function mirrorPlan(hosts, health, now, preferred) {
    const t = timeOr(now);
    const h = health || {};
    const list = (Array.isArray(hosts) ? hosts : []).filter(Boolean);
    const fresh = [];
    const cooling = [];
    for (let i = 0; i < list.length; i += 1) {
      const host = list[i];
      const rec = h[host];
      if (rec && Number(rec.until) > t) cooling.push(host);
      else fresh.push(host);
    }
    const pref = text(preferred, 200);
    if (pref) {
      const at = fresh.indexOf(pref);
      if (at > 0) {
        fresh.splice(at, 1);
        fresh.unshift(pref);
      }
    }
    return fresh.concat(cooling);
  }

  /** Record a mirror result; failures get an escalating cooldown. */
  function noteMirror(health, host, ok, now, opts) {
    const t = timeOr(now);
    const o = opts || {};
    const base = Number(o.baseMs) > 0 ? Number(o.baseMs) : 30000;
    const cap = Number(o.maxMs) > 0 ? Number(o.maxMs) : 600000;
    const next = Object.assign({}, health || {});
    const key = text(host, 200);
    if (!key) return next;
    const prev = next[key] || {};
    if (ok) next[key] = { fails: 0, until: 0, okAt: t };
    else {
      const fails = clamp(prev.fails, 0, 8) + 1;
      next[key] = { fails: fails, until: t + backoff(fails - 1, base, cap), failAt: t };
    }
    return next;
  }

  /** Drop entries older than `ttl` so localStorage cannot grow forever. */
  function pruneMap(map, now, ttl, maxEntries) {
    const t = timeOr(now);
    const life = Number(ttl) > 0 ? Number(ttl) : 30 * 60 * 1000;
    const limit = Number(maxEntries) > 0 ? Number(maxEntries) : 60;
    const keys = Object.keys(map || {}).sort(function (a, b) {
      return Number((map[b] || {}).at || 0) - Number((map[a] || {}).at || 0);
    });
    const out = {};
    for (let i = 0; i < keys.length && i < limit; i += 1) {
      const rec = (map || {})[keys[i]] || {};
      if (t - Number(rec.at || 0) > life) continue;
      out[keys[i]] = rec;
    }
    return out;
  }

  /** Is this station's stream in "we just tried it and it died" quarantine? */
  function streamCooling(health, uuid, now) {
    const t = timeOr(now);
    const rec = health && health[text(uuid, 80)];
    return !!(rec && Number(rec.until) > t);
  }

  /** Mark a station stream as failing (or working) for auto-advance decisions. */
  function noteStream(health, uuid, ok, now, opts) {
    const t = timeOr(now);
    const o = opts || {};
    const key = text(uuid, 80);
    const next = Object.assign({}, health || {});
    if (!key) return next;
    const prev = next[key] || {};
    if (ok) delete next[key];
    else {
      const fails = clamp(prev.fails, 0, 6) + 1;
      next[key] = {
        fails: fails,
        at: t,
        until: t + backoff(fails - 1, o.baseMs || 5 * 60 * 1000, o.maxMs || 6 * 60 * 60 * 1000),
      };
    }
    return pruneMap(next, t, o.ttl || 24 * 60 * 60 * 1000, o.max || 80);
  }

  /* ------------------------------------------------------------- stream I/O */

  const HLS_RE = /\.(m3u8?|m3u)([?#]|$)/i;
  const DASH_RE = /\.mpd([?#]|$)/i;
  const STREAM_EXT = {
    mp3: "audio/mpeg",
    aac: "audio/aac",
    m4a: "audio/mp4",
    mp4: "audio/mp4",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    opus: "audio/ogg;codecs=opus",
    flac: "audio/flac",
    wav: "audio/wav",
    webm: "audio/webm",
  };

  /**
   * Describe a stream URL: is it HLS/DASH, is it encrypted, what is the
   * extension-based MIME guess. Used to fail fast with a clear message
   * instead of a 15-second watchdog and a shrug.
   */
  function streamFormat(raw) {
    const href = safeUrl(raw, "stream");
    if (!href) return { ok: false, kind: "invalid", mime: "", secure: false, ext: "", url: "" };
    let url;
    try {
      url = new URL(href);
    } catch (_) {
      return { ok: false, kind: "invalid", mime: "", secure: false, ext: "", url: "" };
    }
    const path = url.pathname.toLowerCase();
    const ext = (path.match(/\.([a-z0-9]{2,5})$/) || [])[1] || "";
    let kind = "radio";
    if (HLS_RE.test(path)) kind = "hls";
    else if (DASH_RE.test(path)) kind = "dash";
    else if (STREAM_EXT[ext]) kind = "file";
    return {
      ok: true,
      kind: kind,
      ext: ext,
      mime: STREAM_EXT[ext] || "",
      secure: url.protocol === "https:",
      url: href,
    };
  }

  /**
   * Can this browser even try this URL?
   * @param {{kind:string,secure:boolean}} fmt result of streamFormat()
   * @param {{pageSecure?:boolean,hlsOk?:boolean,dashOk?:boolean}} support
   */
  function canPlayStream(fmt, support) {
    const f = fmt || {};
    const s = support || {};
    if (!f.ok) return { playable: false, reason: "invalid" };
    if (f.secure) {
      /* https is always fine to attempt */
    } else if (s.pageSecure) {
      return { playable: false, reason: "insecure" };
    }
    if (f.kind === "hls" && !s.hlsOk) return { playable: false, reason: "hls" };
    if (f.kind === "dash" && !s.dashOk) return { playable: false, reason: "dash" };
    return { playable: true, reason: "" };
  }

  /** Upgrade an insecure asset URL (favicons, streams) when worth trying. */
  function upgradeToHttps(raw, kind) {
    const href = safeUrl(raw, kind === "stream" ? "stream" : "image");
    if (!href || /^https:/i.test(href)) return href;
    return href.replace(/^http:/i, "https:");
  }

  /** MediaError code → human reason, so "قطع شد" becomes an actual diagnosis. */
  const MEDIA_ERRORS = {
    1: { i18n: "errAborted", retry: false },
    2: { i18n: "errNetwork", retry: true },
    3: { i18n: "errDecode", retry: false },
    4: { i18n: "errFormat", retry: false },
  };
  function mediaErrorInfo(err) {
    const code = Number(err && err.code) || 0;
    const info = MEDIA_ERRORS[code] || { i18n: "errUnknown", retry: true };
    return { code: code, i18n: info.i18n, retry: !!info.retry };
  }

  /* ------------------------------------------------------------------ misc */

  function hashHue(value) {
    let h = 0;
    for (const ch of String(value || "F")) h = (h * 33 + ch.charCodeAt(0)) % 360;
    return h;
  }

  /** Deterministic "dial" frequency used purely as a visual metaphor. */
  function fakeFreq(station) {
    let n = 0;
    const seed = (station && (station.stationuuid || station.name)) || "F";
    for (const ch of String(seed)) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
    return (88 + (n % 199) / 10).toFixed(1);
  }

  function initials(name) {
    const cleaned = String(name || "F")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const first = parts[0] ? Array.from(parts[0])[0] : "F";
    const second = parts[1] ? Array.from(parts[1])[0] : "";
    return (first + second).toUpperCase().slice(0, 2) || "F";
  }

  function fmtTime(ms) {
    const total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
    const hh = String(Math.floor(total / 3600)).padStart(2, "0");
    const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const ss = String(total % 60).padStart(2, "0");
    return hh + ":" + mm + ":" + ss;
  }

  function padPresets(arr, length) {
    const size = clamp(length || 6, 1, 12);
    const out = Array.isArray(arr) ? arr.slice(0, size) : [];
    while (out.length < size) out.push(null);
    return out;
  }

  function hexRgb(hex, fallback) {
    let h = String(hex || "").replace("#", "").trim();
    if (h.length === 3 && /^[0-9a-f]{3}$/i.test(h)) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    if (!/^[0-9a-f]{6}$/i.test(h)) return fallback || "255,77,46";
    const n = parseInt(h, 16);
    return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255);
  }

  /** Gregorian → Jalali (Persian) calendar string, YYYY/MM/DD. */
  function toJalali(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (!d || Number.isNaN(d.getTime())) return "";
    const gy = d.getFullYear();
    const gm = d.getMonth() + 1;
    const gd = d.getDate();
    const gDaysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    const gy2 = gy <= 1600 ? gy - 621 : gy - 1600;
    const leapBase = gm > 2 ? gy2 + 1 : gy2;
    let days =
      365 * gy2 +
      Math.floor((leapBase + 3) / 4) -
      Math.floor((leapBase + 99) / 100) +
      Math.floor((leapBase + 399) / 400) -
      80 +
      gd +
      gDaysInMonth[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return jy + "/" + String(jm).padStart(2, "0") + "/" + String(jd).padStart(2, "0");
  }

  /** Locale-aware number formatting with a safe fallback. */
  function formatNumber(value, locale) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "0";
    try {
      return new Intl.NumberFormat(locale || "en-US").format(n);
    } catch (_) {
      return String(n);
    }
  }

  /** Pick a stable "station of the day" index. */
  function dayIndex(length, date) {
    if (!length) return -1;
    const d = date instanceof Date ? date : new Date();
    const key = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
    return key % length;
  }

  /**
   * Weighted tag ranking used for recommendations and listening stats.
   * @param {Array<{tags:string, weight?:number}>} items
   * @param {number} limit
   */
  function topTags(items, limit) {
    const bag = Object.create(null);
    (items || []).forEach(function (item) {
      if (!item || !item.tags) return;
      const weight = Number(item.weight) > 0 ? Number(item.weight) : 1;
      String(item.tags)
        .split(",")
        .forEach(function (raw) {
          const tag = raw.trim().toLowerCase();
          if (!tag || tag.length > 32) return;
          bag[tag] = (bag[tag] || 0) + weight;
        });
    });
    return Object.keys(bag)
      .map(function (tag) {
        return { tag: tag, weight: bag[tag] };
      })
      .sort(function (a, b) {
        return b.weight - a.weight || a.tag.localeCompare(b.tag);
      })
      .slice(0, limit || 8);
  }

  /** Remove duplicate stations by uuid, keeping the first occurrence. */
  function uniqueStations(list) {
    const seen = Object.create(null);
    const out = [];
    (Array.isArray(list) ? list : []).forEach(function (s) {
      if (!s || !s.stationuuid || seen[s.stationuuid]) return;
      seen[s.stationuuid] = 1;
      out.push(s);
    });
    return out;
  }

  function sameStation(a, b) {
    return !!(a && b && a.stationuuid === b.stationuuid);
  }

  return {
    LIMITS: LIMITS,
    ORDERS: ORDERS,
    SORTS: SORTS,
    WAVES: WAVES,
    text: text,
    timeOr: timeOr,
    esc: esc,
    clamp: clamp,
    count: count,
    safeUrl: safeUrl,
    isWebUrl: isWebUrl,
    normalizeStation: normalizeStation,
    normalizeStations: normalizeStations,
    stationKey: stationKey,
    buildStationsQuery: buildStationsQuery,
    buildTagFallbackQuery: buildTagFallbackQuery,
    buildAltSearchQuery: buildAltSearchQuery,
    normalizeQuery: normalizeQuery,
    smartFilters: smartFilters,
    parseFilters: parseFilters,
    filtersToQuery: filtersToQuery,
    EQ_BANDS: EQ_BANDS,
    EQ_PRESETS: EQ_PRESETS,
    EQ_LIMITS: EQ_LIMITS,
    clampDb: clampDb,
    sanitizeEq: sanitizeEq,
    isFlatEq: isFlatEq,
    eqPreset: eqPreset,
    eqPresetNames: eqPresetNames,
    compressorSettings: compressorSettings,
    effectiveVolume: effectiveVolume,
    sanitizeTrims: sanitizeTrims,
    trimToSlider: trimToSlider,
    sliderToTrim: sliderToTrim,
    classifyFailure: classifyFailure,
    backoff: backoff,
    mirrorPlan: mirrorPlan,
    noteMirror: noteMirror,
    noteStream: noteStream,
    pruneMap: pruneMap,
    streamCooling: streamCooling,
    streamFormat: streamFormat,
    canPlayStream: canPlayStream,
    upgradeToHttps: upgradeToHttps,
    mediaErrorInfo: mediaErrorInfo,
    hashHue: hashHue,
    fakeFreq: fakeFreq,
    initials: initials,
    fmtTime: fmtTime,
    padPresets: padPresets,
    hexRgb: hexRgb,
    toJalali: toJalali,
    formatNumber: formatNumber,
    dayIndex: dayIndex,
    topTags: topTags,
    uniqueStations: uniqueStations,
    sameStation: sameStation,
  };
});
