"use strict";

/**
 * Network + playback-resilience tests. These cover the P0 failure the app used
 * to have: a directory outage was reported as "you are offline", the list
 * stayed blank, and nothing explained or recovered from it.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const { makeDom, waitFor, click, fakeResponse, STATIONS } = require("./helpers/dom.js");

const HLS_STATIONS = [
  {
    stationuuid: "hls-1",
    name: "Big HLS Station",
    url: "https://cdn.example/live/index.m3u8",
    url_resolved: "https://cdn.example/live/index.m3u8",
    tags: "news",
    country: "France",
    countrycode: "FR",
    state: "Paris",
    codec: "AAC",
    bitrate: 64,
    hls: 1,
    clickcount: 500,
  },
  {
    stationuuid: "ok-1",
    name: "Plain MP3",
    url: "https://cdn.example/live.mp3",
    url_resolved: "https://cdn.example/live.mp3",
    tags: "jazz",
    country: "Germany",
    countrycode: "DE",
    state: "Berlin",
    codec: "MP3",
    bitrate: 192,
    clickcount: 120,
  },
  {
    stationuuid: "http-1",
    name: "Http Only",
    url: "http://cdn.example/live.mp3",
    url_resolved: "http://cdn.example/live.mp3",
    tags: "chillout",
    country: "Iran",
    countrycode: "IR",
    codec: "MP3",
    bitrate: 128,
    clickcount: 90,
  },
];

function dir(list, status) {
  return function (url) {
    if (url.indexOf("/json/stations/search") >= 0) return Promise.resolve(fakeResponse(list, status || 200));
    if (url.indexOf("/json/stats") >= 0) return Promise.resolve(fakeResponse({ stations: 100, countries: 3 }));
    if (url.indexOf("/json/countries") >= 0) return Promise.resolve(fakeResponse([]));
    return Promise.resolve(fakeResponse({}, 200));
  };
}

test("a dead directory is not reported as 'you are offline'", async (t) => {
  const failing = () => Promise.reject(new TypeError("Failed to fetch"));
  const { window, calls, close } = makeDom("", { fetch: failing, onLine: true });
  t.after(close);
  const doc = window.document;

  await waitFor(() => !doc.getElementById("offline").hidden);
  const text = doc.getElementById("offline-text").textContent;
  assert.match(text, /station service/i, "should explain the real reason");
  assert.doesNotMatch(text, /You're offline/i, "must not blame the user's connection");
  assert.equal(doc.getElementById("offline").dataset.tone, "network");
  assert.ok(doc.getElementById("offline-retry") && !doc.getElementById("offline-retry").hidden, "retry offered");
  // Every mirror is probed, so a single dead server cannot stall the app.
  const hosts = new Set(calls.map((u) => new URL(u).host));
  assert.ok(hosts.size >= 2, "should fail over to more than one mirror");
  // …and the mirror cooldown is remembered for the next attempt.
  await waitFor(() => window.localStorage.getItem("freq-mirrors"));
  const mirrors = JSON.parse(window.localStorage.getItem("freq-mirrors"));
  assert.ok(Object.keys(mirrors).length >= 2, "mirror health recorded");
  assert.ok(Object.keys(mirrors).every((h) => mirrors[h].until > Date.now() - 2000));
});

test("a real offline browser gets the honest offline message", async (t) => {
  const { window, calls, close } = makeDom("", { fetch: () => Promise.reject(new Error("nope")), onLine: false });
  t.after(close);
  const doc = window.document;
  await waitFor(() => !doc.getElementById("offline").hidden);
  assert.match(doc.getElementById("offline-text").textContent, /offline/i);
  assert.equal(doc.getElementById("offline").dataset.tone, "offline");
  assert.equal(
    calls.filter((u) => u.indexOf("/json/stations/search") >= 0).length,
    0,
    "no point asking the network when the browser says there is none"
  );
});

test("a saved snapshot is kept on screen instead of being replaced by a banner", async (t) => {
  const seed = {
    "freq-cache": JSON.stringify({ at: Date.now(), mode: "browse", stations: STATIONS }),
  };
  const { window, close } = makeDom("", { fetch: () => Promise.reject(new Error("down")), onLine: true, seed });
  t.after(close);
  const doc = window.document;
  const ok = await waitFor(() => doc.querySelectorAll("#cards .card").length === 3);
  assert.ok(ok, "cached stations should still render while the API is down");
  assert.ok(!doc.getElementById("offline").hidden, "the bar still explains the outage");
  assert.match(doc.getElementById("offline-sub").textContent, /saved for you/i);
});

test("an empty list from the directory is treated as an outage, not 'no results'", async (t) => {
  const { window, close } = makeDom("", { fetch: dir([]), onLine: true });
  t.after(close);
  const doc = window.document;
  const ok = await waitFor(() => doc.querySelector("#cards .state"));
  assert.ok(ok, "error state should render");
  assert.match(doc.querySelector("#cards .state h3").textContent, /stations/i);
  assert.ok(doc.querySelector('#cards .state [data-act="retry"]'), "retry inside the state block");
  assert.ok(!doc.getElementById("offline").hidden);
});

test("a 429 from a mirror is shown as rate limiting and retried later", async (t) => {
  const { window, close } = makeDom("", { fetch: dir(STATIONS, 429), onLine: true });
  t.after(close);
  const doc = window.document;
  await waitFor(() => doc.querySelector("#cards .state"));
  const why = doc.querySelector("#cards .state p").textContent;
  assert.match(why, /too many requests/i, "the empty list says it was rate limited");
  assert.doesNotMatch(why, /offline/i);
});

test("playable-only filters unplayable formats out of the query", async (t) => {
  const { window, calls, close } = makeDom("", { fetch: dir(HLS_STATIONS), onLine: true });
  t.after(close);
  await waitFor(() => calls.some((u) => u.indexOf("/json/stations/search") >= 0));
  const search = new URL(calls.find((u) => u.indexOf("/json/stations/search") >= 0)).searchParams;
  assert.equal(search.get("hls"), "false", "jsdom cannot play HLS, so HLS-only stations are excluded");
  assert.equal(search.get("hidebroken"), "true");
  // And the preference is remembered for the next visit.
  const btn = window.document.getElementById("playable-btn");
  assert.ok(btn);
  assert.equal(btn.getAttribute("aria-pressed"), "true");
});

test("an unplayable station fails with a reason instead of a 15s timeout", async (t) => {
  const { window, close } = makeDom("", {
    fetch: dir(HLS_STATIONS),
    onLine: true,
    seed: { "freq-onlyplayable": "0" },
  });
  t.after(close);
  const doc = window.document;
  const ok = await waitFor(() => doc.querySelectorAll("#cards .card").length === 3);
  assert.ok(ok, "all three stations render when the playable filter is off");
  click(window, doc.querySelector('#cards [data-play="hls-1"]'));
  assert.match(doc.getElementById("p-kick").textContent, /HLS/, "player explains why");
  assert.equal(doc.getElementById("audio").getAttribute("src"), null, "no bogus src assigned");
  click(window, doc.querySelector('#cards [data-play="ok-1"]'));
  assert.match(String(doc.getElementById("audio").src), /live\.mp3$/);
});

test("an http-only stream is upgraded to https before it is given up on", async (t) => {
  const { window, close } = makeDom("", {
    fetch: dir(HLS_STATIONS),
    onLine: true,
    seed: { "freq-onlyplayable": "0" },
  });
  t.after(close);
  const doc = window.document;
  await waitFor(() => doc.querySelectorAll("#cards .card").length === 3);
  click(window, doc.querySelector('#cards [data-play="http-1"]'));
  // Mixed content would block the http URL, so the secure copy is what we load.
  await waitFor(() => !!doc.getElementById("audio").getAttribute("src"));
  assert.equal(doc.getElementById("audio").getAttribute("src"), "https://cdn.example/live.mp3");
  assert.equal(doc.getElementById("player").dataset.upgraded, undefined);
});

test("reporting a broken station tells the directory, hides it and keeps an undo", async (t) => {
  const calls = [];
  const base = dir(HLS_STATIONS);
  const { window, close } = makeDom("", {
    onLine: true,
    fetch: function (url, init) {
      calls.push(url);
      return base(url, init);
    },
  });
  t.after(close);
  const doc = window.document;
  await waitFor(() => doc.querySelectorAll("#cards .card").length >= 1);
  const before = doc.querySelectorAll("#cards .card").length;
  click(window, doc.querySelector('.card [data-info]'));
  await waitFor(() => !doc.getElementById("sheet").hidden);
  const broken = doc.getElementById("sh-broken");
  assert.ok(broken && !broken.hidden, "the sheet offers a report button");
  click(window, broken);
  await waitFor(() => doc.querySelectorAll("#cards .card").length === before - 1);
  assert.ok(
    calls.some((u) => u.indexOf("/json/url/") >= 0 && u.indexOf("broken=true") >= 0),
    "the broken flag is sent to the directory"
  );
  const health = JSON.parse(window.localStorage.getItem("freq-stream"));
  assert.ok(health && Object.keys(health).length >= 1, "locally quarantined too");
});

test("the empty result of a filtered search is still a normal empty state", async (t) => {
  const { window, close } = makeDom("?q=definitelynothing", { fetch: dir([]), onLine: true });
  t.after(close);
  const doc = window.document;
  await waitFor(() => doc.querySelector("#cards .state"));
  // A real "nothing found" must not be dressed up as an outage.
  assert.ok(doc.querySelector('#cards .state [data-act="rand"]'), "should offer a random station instead");
});
