"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Core = require("../core.js");

test("safeUrl keeps https streams and rejects javascript/data tricks", () => {
  assert.equal(Core.safeUrl("https://stream.example/live.mp3", "stream"), "https://stream.example/live.mp3");
  assert.equal(Core.safeUrl("http://stream.example/live.mp3", "stream"), "http://stream.example/live.mp3");
  assert.equal(Core.safeUrl("javascript:alert(1)", "stream"), "");
  assert.equal(Core.safeUrl("data:text/html,<script>", "link"), "");
  assert.equal(Core.safeUrl("https://cdn.example/icon.png", "image"), "https://cdn.example/icon.png");
  assert.equal(Core.safeUrl("blob:https://evil.test/x", "image"), "");
  assert.equal(Core.safeUrl("", "stream"), "");
});

test("normalizeStation bounds and sanitizes untrusted fields", () => {
  const s = Core.normalizeStation({
    stationuuid: "  abc-123  ",
    name: "  Radio   One  ",
    url: "https://a.example/live",
    url_resolved: "http://b.example/live",
    favicon: "javascript:alert(1)",
    tags: "jazz, chill, ",
    countrycode: "ir",
    bitrate: "128",
    votes: -4,
    geo_lat: "200",
    geo_long: "51.4",
    hls: 1,
  });
  assert.equal(s.stationuuid, "abc-123");
  assert.equal(s.name, "Radio   One");
  assert.equal(s.url_resolved, "https://a.example/live");
  assert.equal(s.favicon, "");
  assert.equal(s.countrycode, "IR");
  assert.equal(s.bitrate, 128);
  assert.equal(s.votes, 0);
  assert.equal(s.geo_lat, null);
  assert.equal(s.geo_long, 51.4);
  assert.equal(s.hls, true);
});

test("normalizeStation rejects records without a playable url", () => {
  assert.equal(Core.normalizeStation({ stationuuid: "x", url: "file:///etc/passwd" }), null);
  assert.equal(Core.normalizeStation(null), null);
  assert.equal(Core.normalizeStation({ stationuuid: "" }), null);
});

test("normalizeStations de-duplicates while preserving order", () => {
  const list = Core.normalizeStations([
    { stationuuid: "a", url: "https://a.test" },
    { stationuuid: "a", url: "https://a.test" },
    { stationuuid: "b", url: "https://b.test" },
  ]);
  assert.deepEqual(list.map((s) => s.stationuuid), ["a", "b"]);
});

test("buildStationsQuery clamps and encodes filters", () => {
  const qs = Core.buildStationsQuery(
    { cc: "de", tag: "hip hop", q: "radio one & two", wave: "am", hd: true, order: "bitrate", offset: -5, limit: 9999 },
    120
  );
  const p = new URLSearchParams(qs);
  assert.equal(p.get("countrycode"), "DE");
  assert.equal(p.get("tag"), "hip hop");
  assert.equal(p.get("name"), "radio one & two");
  assert.equal(p.get("bitrateMin"), "128");
  assert.equal(p.get("order"), "bitrate");
  assert.equal(p.get("limit"), "500");
  assert.equal(p.get("offset"), "0");
  assert.equal(p.get("reverse"), "true");
});

test("buildTagFallbackQuery swaps the name filter for a tag filter", () => {
  const p = new URLSearchParams(Core.buildTagFallbackQuery({ q: "lofi beats" }, 30));
  assert.equal(p.get("name"), null);
  assert.equal(p.get("tag"), "lofi beats");
  assert.equal(p.get("limit"), "30");
});

test("parseFilters accepts only known keys and normalizes values", () => {
  const parsed = Core.parseFilters(
    new URLSearchParams("view=fav&cc=ir&tag=Jazz&lang=persian&q=hello&sort=popular&wave=sw&s=uuid-1&random=1&evil=1")
  );
  assert.deepEqual(parsed, {
    view: "fav",
    random: true,
    cc: "IR",
    tag: "Jazz",
    language: "persian",
    q: "hello",
    sort: "clickcount",
    wave: "sw",
    station: "uuid-1",
  });
  assert.deepEqual(Core.parseFilters(new URLSearchParams("cc=!&view=wat&sort=nope")), {});
});

test("filtersToQuery round-trips through parseFilters", () => {
  const url = Core.filtersToQuery({ mode: "recent", cc: "FR", tag: "jazz", langFilter: "french", q: " nuit ", sort: "votes", wave: "am" });
  const back = Core.parseFilters(new URLSearchParams(url));
  assert.equal(back.view, "recent");
  assert.equal(back.cc, "FR");
  assert.equal(back.tag, "jazz");
  assert.equal(back.language, "french");
  assert.equal(back.q, "nuit");
  assert.equal(back.sort, "votes");
  assert.equal(back.wave, "am");
});

test("text and count never emit hostile or negative values", () => {
  assert.equal(Core.text(" a\u0000b\n"), "a b");
  assert.equal(Core.text("x".repeat(50), 10).length, 10);
  assert.equal(Core.text({}), "");
  assert.equal(Core.count(-12), 0);
  assert.equal(Core.count("12.6"), 13);
  assert.equal(Core.count(Infinity), 0);
});

test("initials handles Persian and Latin names", () => {
  assert.equal(Core.initials("Radio One"), "RO");
  assert.equal(Core.initials("رادیو جوان"), "رج");
  assert.equal(Core.initials("  "), "F");
  assert.equal(Core.initials("!"), "F");
});

test("toJalali converts known dates", () => {
  assert.equal(Core.toJalali(new Date(2026, 9, 19)), "1405/07/27");
  assert.equal(Core.toJalali(new Date(2024, 2, 20)), "1403/01/01");
  assert.equal(Core.toJalali(new Date(2025, 2, 21)), "1404/01/01");
});

test("formatNumber falls back safely", () => {
  assert.equal(Core.formatNumber(1234567, "en-US"), "1,234,567");
  assert.equal(Core.formatNumber("nope"), "0");
});

test("topTags ranks by weight and respects limits", () => {
  const tags = Core.topTags(
    [
      { tags: "jazz, chill", weight: 3 },
      { tags: "jazz", weight: 1 },
      { tags: "rock", weight: 2 },
    ],
    2
  );
  assert.deepEqual(tags, [
    { tag: "jazz", weight: 4 },
    { tag: "chill", weight: 3 },
  ]);
});

test("dayIndex is stable within a day and in range", () => {
  const d = new Date(2026, 9, 19);
  const a = Core.dayIndex(10, d);
  const b = Core.dayIndex(10, new Date(2026, 9, 19, 23, 59));
  assert.equal(a, b);
  assert.ok(a >= 0 && a < 10);
  assert.equal(Core.dayIndex(0), -1);
});

test("esc escapes text and attribute quotes", () => {
  assert.equal(Core.esc('<b class="x">A&B\'</b>'), "&lt;b class=&quot;x&quot;&gt;A&amp;B&#39;&lt;/b&gt;");
});

/* ------------------------------------------------ transport + playability */

test("classifyFailure separates an outage from being offline", () => {
  assert.equal(Core.classifyFailure({ online: false }).kind, "offline");
  assert.equal(Core.classifyFailure({}).kind, "network");
  assert.equal(Core.classifyFailure({}).i18n, "netUnreachable");
  assert.equal(Core.classifyFailure({ status: 429 }).kind, "rate");
  assert.equal(Core.classifyFailure({ status: 429, retryAfter: 42 }).retryMs, 42000);
  assert.equal(Core.classifyFailure({ status: 503 }).mirror, true);
  assert.equal(Core.classifyFailure({ status: 403 }).kind, "blocked");
  assert.equal(Core.classifyFailure({ status: 404 }).hard, true);
  assert.equal(Core.classifyFailure({ aborted: true }).kind, "timeout");
  assert.equal(Core.classifyFailure({ empty: true }).kind, "empty");
  // Offline is the one case with no automatic retry timer.
  assert.equal(Core.classifyFailure({ online: false }).retryMs, 0);
});

test("backoff grows and is capped", () => {
  assert.equal(Core.backoff(0, 1000, 60000), 1000);
  assert.equal(Core.backoff(3, 1000, 60000), 8000);
  assert.equal(Core.backoff(40, 1000, 60000), 60000);
});

test("mirrorPlan parks cooling mirrors at the back and prefers the healthy one", () => {
  const now = 1000000;
  const hosts = ["a", "b", "c", "d"];
  const health = { b: { fails: 2, until: now + 30000 } };
  assert.deepEqual(Core.mirrorPlan(hosts, health, now, "d"), ["d", "a", "c", "b"]);
  assert.deepEqual(Core.mirrorPlan(hosts, {}, now), hosts);
  // Expired cooldowns are probed again — a recovering mirror must come back.
  assert.deepEqual(Core.mirrorPlan(hosts, { b: { until: now - 1 } }, now), hosts);
});

test("noteMirror escalates a cooldown and clears it on success", () => {
  const now = 1000;
  let h = Core.noteMirror({}, "x", false, now, { baseMs: 1000, maxMs: 8000 });
  assert.equal(h.x.fails, 1);
  assert.equal(h.x.until, 2000);
  h = Core.noteMirror(h, "x", false, now, { baseMs: 1000, maxMs: 8000 });
  assert.equal(h.x.fails, 2);
  assert.equal(h.x.until, 3000);
  h = Core.noteMirror(h, "x", true, now, {});
  assert.deepEqual(h.x, { fails: 0, until: 0, okAt: now });
});

test("stream quarantine expires and is pruned", () => {
  const now = 1000;
  let h = Core.noteStream({}, "u1", false, now, { baseMs: 1000, ttl: 5000, max: 10 });
  assert.equal(Core.streamCooling(h, "u1", now), true);
  assert.equal(Core.streamCooling(h, "u1", now + 5000), false);
  assert.equal(Core.streamCooling(h, "other", now), false);
  h = Core.noteStream(h, "u1", true, now + 10);
  assert.equal(h.u1, undefined, "a good stream clears its own quarantine");
  const old = Core.noteStream({}, "u2", false, 0, { baseMs: 10, ttl: 1000, max: 5 });
  assert.deepEqual(Core.pruneMap(old, 100000, 1000, 5), {});
});

test("streamFormat recognises HLS, DASH, files and junk", () => {
  assert.equal(Core.streamFormat("https://x.example/live/index.m3u8?token=1").kind, "hls");
  assert.equal(Core.streamFormat("https://x.example/a.mpd").kind, "dash");
  assert.equal(Core.streamFormat("https://x.example/a.mp3").kind, "file");
  assert.equal(Core.streamFormat("https://x.example/stream").kind, "radio");
  assert.equal(Core.streamFormat("javascript:alert(1)").ok, false);
  assert.equal(Core.streamFormat("http://x.example/a.mp3").secure, false);
  assert.equal(Core.streamFormat("https://x.example/a.mp3").mime, "audio/mpeg");
});

test("canPlayStream blocks what the browser truly cannot play", () => {
  const secure = { pageSecure: true, hlsOk: false, dashOk: false };
  assert.equal(Core.canPlayStream(Core.streamFormat("https://x/a.mp3"), secure).playable, true);
  assert.equal(Core.canPlayStream(Core.streamFormat("https://x/a.m3u8"), secure).reason, "hls");
  assert.equal(Core.canPlayStream(Core.streamFormat("https://x/a.m3u8"), { pageSecure: true, hlsOk: true }).playable, true);
  assert.equal(Core.canPlayStream(Core.streamFormat("http://x/a.mp3"), secure).reason, "insecure");
  // On a plain http page an http stream is allowed (no mixed content to block).
  assert.equal(Core.canPlayStream(Core.streamFormat("http://x/a.mp3"), { pageSecure: false }).playable, true);
});

test("upgradeToHttps rewrites assets but never leaves the scheme whitelist", () => {
  assert.equal(Core.upgradeToHttps("http://x/logo.png"), "https://x/logo.png");
  assert.equal(Core.upgradeToHttps("https://x/logo.png"), "https://x/logo.png");
  assert.equal(Core.upgradeToHttps("javascript:alert(1)"), "");
});

test("mediaErrorInfo maps MediaError codes to copy", () => {
  assert.equal(Core.mediaErrorInfo({ code: 4 }).i18n, "errFormat");
  assert.equal(Core.mediaErrorInfo({ code: 3 }).retry, false);
  assert.equal(Core.mediaErrorInfo({ code: 2 }).retry, true, "network errors deserve a reconnect");
  assert.equal(Core.mediaErrorInfo(null).i18n, "errUnknown");
});

test("smartFilters promotes countries, languages and tags out of the name field", () => {
  const dict = {
    countries: [{ cc: "DE", fa: "آلمان", en: "Germany" }, { cc: "IR", fa: "ایران", en: "Iran" }],
    langs: [{ id: "persian", fa: "فارسی", en: "Persian" }],
    tags: [{ tag: "lofi", fa: "لوفای", en: "Lo-fi" }],
  };
  assert.deepEqual(Core.smartFilters("germany", dict), {
    name: "", country: "", countrycode: "DE", state: "", language: "", tag: "",
  });
  assert.equal(Core.smartFilters("آلمان", dict).countrycode, "DE");
  assert.equal(Core.smartFilters("ایران", dict).countrycode, "IR");
  assert.equal(Core.smartFilters("ir", dict).countrycode, "IR");
  assert.equal(Core.smartFilters("persian", dict).language, "persian");
  assert.equal(Core.smartFilters("لوفای", dict).tag, "lofi");
  assert.equal(Core.smartFilters("radio paradise", dict).name, "radio paradise");
  assert.deepEqual(Core.smartFilters("   "), {
    name: "", country: "", countrycode: "", state: "", language: "", tag: "",
  });
});

test("normalizeQuery folds ZWNJ, digits and Arabic/Persian letters", () => {
  assert.equal(Core.normalizeQuery("رادیو  جوان"), "رادیو جوان");
  assert.equal(Core.normalizeQuery("رادیو\u200cجوان"), "رادیوجوان");
  assert.equal(Core.normalizeQuery("Radio 1۲"), "radio 12");
  assert.equal(Core.normalizeQuery("موسيقي"), "موسیقی");
});

test("buildAltSearchQuery searches where the words actually live", () => {
  const base = { q: "berlin", cc: "", language: "", wave: "", hd: false, order: "clickcount", offset: 0, limit: 120 };
  const p = new URLSearchParams(Core.buildAltSearchQuery(base, 120, { state: "berlin" }));
  assert.equal(p.get("state"), "berlin");
  assert.equal(p.get("name"), null, "the name filter must not survive into the fallback");
  const tagless = new URLSearchParams(Core.buildAltSearchQuery(base, 120, {}));
  assert.equal(tagless.get("tag"), "berlin", "unknown words still fall back to tags");
});

test("stations query can exclude unplayable formats and a city", () => {
  const p = new URLSearchParams(Core.buildStationsQuery({ city: "Tehran", hls: "skip", cc: "IR" }, 120));
  assert.equal(p.get("state"), "Tehran");
  assert.equal(p.get("hls"), "false");
  assert.equal(new URLSearchParams(Core.buildStationsQuery({ hls: "only" }, 120)).get("hls"), "true");
  assert.equal(new URLSearchParams(Core.buildStationsQuery({}, 120)).get("hls"), null);
});

test("city round-trips through the shareable URL", () => {
  const qs = Core.filtersToQuery({ mode: "browse", city: "Berlin" });
  assert.equal(new URLSearchParams(qs).get("city"), "Berlin");
  assert.equal(Core.parseFilters(new URLSearchParams(qs)).city, "Berlin");
  assert.equal(Core.parseFilters(new URLSearchParams("city=!bad")).city, undefined);
});

test("normalizeStation keeps the city from the raw state field", () => {
  const s = Core.normalizeStation({
    stationuuid: "u", name: "X", url: "https://x/a.mp3", state: "  Berlin ", country: "Germany",
  });
  assert.equal(s.city, "Berlin");
});

/* ------------------------------------------------------------------ equalizer */

test("EQ band table is a usable shelf-peaking-shelf ladder", () => {
  const bands = Core.EQ_BANDS;
  assert.equal(bands.length, Core.EQ_LIMITS.bandCount);
  assert.equal(bands[0].type, "lowshelf");
  assert.equal(bands[bands.length - 1].type, "highshelf");
  assert.ok(bands.slice(1, -1).every((b) => b.type === "peaking"));
  bands.reduce((prev, b) => {
    assert.ok(b.hz > prev, "frequencies must ascend");
    return b.hz;
  }, 0);
  assert.equal(new Set(bands.map((b) => b.id)).size, bands.length, "ids are unique (they become DOM ids)");
  bands.forEach((b) => {
    assert.ok(b.fa && b.en, "every band is labelled in both languages");
    assert.ok(b.hz >= 20 && b.hz <= 22000, "inside the audible range");
  });
});

test("clampDb keeps a slider value legal", () => {
  assert.equal(Core.clampDb(3), 3);
  assert.equal(Core.clampDb(-99), Core.EQ_LIMITS.min);
  assert.equal(Core.clampDb(99), Core.EQ_LIMITS.max);
  assert.equal(Core.clampDb(2.27), 2.3, "quantised to a tenth of a dB");
  assert.equal(Core.clampDb(""), 0);
  assert.equal(Core.clampDb(undefined), 0);
  assert.equal(Core.clampDb(Infinity), 0, "never poison the graph with Infinity");
});

test("sanitizeEq always returns exactly bandCount slots", () => {
  assert.deepEqual(Core.sanitizeEq(null), [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(Core.sanitizeEq([3]), [3, 0, 0, 0, 0, 0]);
  assert.deepEqual(Core.sanitizeEq([1, 2, 3, 4, 5, 6, 7, 8]), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(Core.sanitizeEq("nonsense"), [0, 0, 0, 0, 0, 0]);
  assert.ok(Core.isFlatEq(Core.sanitizeEq([0.01, 0, 0, 0, 0, 0])), "0.01 dB rounds away");
  assert.equal(Core.isFlatEq(Core.sanitizeEq([0.1, 0, 0, 0, 0, 0])), false);
});

test("presets are complete arrays and never hand out the table itself", () => {
  const names = Core.eqPresetNames();
  assert.ok(names.length >= 6);
  names.forEach((name) => {
    assert.equal(Core.eqPreset(name).length, Core.EQ_LIMITS.bandCount, name + " must fill every band");
  });
  assert.deepEqual(Core.eqPreset("flat"), [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(Core.eqPreset("does-not-exist"), Core.eqPreset("flat"));
  const got = Core.eqPreset("bass");
  got[0] = 0;
  assert.notEqual(Core.eqPreset("bass")[0], 0, "callers cannot corrupt the preset table");
  /* Every preset must stay inside the slider range or the UI would lie. */
  names.forEach((name) => {
    Core.EQ_PRESETS[name].forEach((v) => {
      assert.ok(v >= Core.EQ_LIMITS.min && v <= Core.EQ_LIMITS.max, name + " out of range");
    });
  });
});

test("normalisation strength trades loudness for dynamics monotonically", () => {
  const soft = Core.compressorSettings(0.2);
  const hard = Core.compressorSettings(1);
  assert.ok(hard.threshold < soft.threshold, "more strength pulls the threshold down");
  assert.ok(hard.ratio > soft.ratio, "more strength squeezes harder");
  assert.ok(hard.makeup > soft.makeup, "more strength lifts the makeup gain");
  assert.ok(hard.knee < soft.knee, "a harder setting uses a tighter knee");
  const junk = Core.compressorSettings("loud");
  assert.deepEqual(junk, Core.compressorSettings(0.55), "junk falls back to the middle");
  assert.ok(hard.makeup <= 2, "never a runaway gain");
});

test("effective volume composes and clamps instead of silently saturating", () => {
  assert.equal(Core.effectiveVolume(0.5, 1, 1), 0.5);
  assert.equal(Core.effectiveVolume(0.5, 1.25, 1.28), 0.8);
  assert.equal(Core.effectiveVolume(0.9, 1.5, 1.5), 1, "clamped to what the element can do");
  assert.equal(Core.effectiveVolume(0, 1.5, 1.5), 0);
  assert.equal(Core.effectiveVolume(-4, 1, 1), 0);
  assert.equal(Core.effectiveVolume(0.5), 0.5, "missing trims count as unity");
  assert.equal(Core.effectiveVolume(0.5, NaN, Infinity), 0.5);
});

test("per-station trims survive only if they are useful", () => {
  const out = Core.sanitizeTrims({ a: 1.4, b: 1, c: 99, d: -5, "": 2, e: "x" });
  assert.deepEqual(out, { a: 1.4, c: 1.5, d: 0.4 }, "identity, junk and empty keys are dropped");
  assert.deepEqual(Core.sanitizeTrims(null), {});
  assert.deepEqual(Core.sanitizeTrims("nope"), {});
  const many = {};
  for (let i = 0; i < 500; i += 1) many["u" + i] = 1.2;
  assert.ok(Object.keys(Core.sanitizeTrims(many)).length <= 120, "localStorage stays bounded");
});

test("trim slider speaks the same language as the label", () => {
  assert.equal(Core.trimToSlider(1), 100, "unity is 100%");
  assert.equal(Core.sliderToTrim(100), 1);
  assert.equal(Core.sliderToTrim(150), 1.5);
  assert.equal(Core.sliderToTrim(40), 0.4);
  assert.equal(Core.sliderToTrim(0), 0.4, "clamped into the legal band");
  assert.equal(Core.sliderToTrim(999), 1.5);
  assert.equal(Core.sliderToTrim("loud"), 1, "junk means unity, not silence");
  assert.equal(Core.trimToSlider(NaN), 100);
  [0.4, 0.7, 1, 1.2, 1.5].forEach((trim) => {
    assert.equal(Core.sliderToTrim(Core.trimToSlider(trim)), trim, trim + " must round-trip");
  });
});
