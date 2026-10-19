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
      favicon: safeUrl(raw.favicon, "image"),
      tags: text(raw.tags, LIMITS.tags),
      country: text(raw.country, LIMITS.country),
      countrycode: /^[A-Z]{2}$/.test(cc) ? cc : "",
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
    const tag = text(f.tag, 48);
    if (tag) p.set("tag", tag);
    else if (f.wave === "am") p.set("tag", "news");
    else if (f.wave === "sw") p.set("tag", "world");
    const lang = text(f.language, 48);
    if (lang) p.set("language", lang);
    const q = text(f.q, 90);
    if (q) p.set("name", q);
    if (f.hd) p.set("bitrateMin", "128");
    return p.toString();
  }

  /** Same query but searching tags instead of names (search fallback). */
  function buildTagFallbackQuery(filter, pageSize) {
    const f = filter || {};
    const p = new URLSearchParams(buildStationsQuery(f, pageSize));
    p.delete("name");
    p.set("tag", text(f.q, 90));
    return p.toString();
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
    if (s.langFilter) p.set("lang", s.langFilter);
    if (s.q && String(s.q).trim()) p.set("q", String(s.q).trim());
    if (s.sort && s.sort !== "clickcount" && ORDERS.indexOf(s.sort) >= 0) p.set("sort", s.sort);
    if (s.wave && s.wave !== "fm") p.set("wave", s.wave);
    if (s.stationId) p.set("s", s.stationId);
    return p.toString();
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
    parseFilters: parseFilters,
    filtersToQuery: filtersToQuery,
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
