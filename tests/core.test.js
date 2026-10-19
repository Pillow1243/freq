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
