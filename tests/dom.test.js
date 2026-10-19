"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { makeDom, waitFor, click, STATIONS, html, coreSource, i18nSource, appSource } = require("./helpers/dom.js");
const { JSDOM } = require("jsdom");

test("boot renders the directory, counts and shell", async (t) => {
  const { window, close } = makeDom("");
  t.after(close);
  const doc = window.document;
  const ok = await waitFor(function () {
    return doc.querySelectorAll("#cards .card").length === 3;
  });
  assert.ok(ok, "cards did not render");
  assert.match(doc.getElementById("count-line").textContent, /3/);
  await waitFor(function () {
    return doc.getElementById("live-n").textContent !== "—";
  });
  assert.equal(doc.getElementById("live-n").textContent, "51,234");
  assert.equal(doc.documentElement.getAttribute("data-theme"), "dark");
  assert.equal(doc.getElementById("theme-grid").children.length, 50);
  assert.equal(doc.getElementById("player-style-grid").children.length, 11);
  assert.equal(doc.querySelectorAll("#countries button").length > 3, true);
  assert.equal(doc.querySelectorAll("#genres button").length, 32);
  assert.equal(doc.querySelectorAll("#sorts button").length, 4);
  assert.equal(doc.querySelectorAll("#waves button").length, 3);
});

test("clicking a card starts playback and updates the player", async (t) => {
  const { window, close } = makeDom("");
  t.after(close);
  const doc = window.document;
  await waitFor(function () {
    return doc.querySelectorAll("#cards .card").length === 3;
  });
  const playBtn = doc.querySelector('#cards [data-play="uuid-1"]');
  click(window, playBtn);
  assert.equal(window.document.getElementById("p-name").textContent, "Radio One");
  assert.equal(window.document.getElementById("audio").src, "https://stream.example/one");
  await waitFor(function () {
    return doc.getElementById("player").classList.contains("on");
  });
  assert.ok(doc.getElementById("player").classList.contains("on"));
  assert.ok(doc.querySelectorAll(".fav-btn[aria-pressed]").length >= 1);
  click(window, doc.getElementById("p-fav"));
  assert.equal(doc.getElementById("p-fav").getAttribute("aria-pressed"), "true");
  const favs = JSON.parse(window.localStorage.getItem("freq-favs"));
  assert.equal(favs.length, 1);
  assert.equal(favs[0].stationuuid, "uuid-1");
});

test("filters open, search narrows the query and Escape closes", async (t) => {
  const { window, calls, close } = makeDom("");
  t.after(close);
  const doc = window.document;
  await waitFor(function () {
    return doc.querySelectorAll("#cards .card").length === 3;
  });
  click(window, doc.getElementById("filters-btn"));
  assert.equal(doc.getElementById("filters").hidden, false);
  assert.equal(doc.getElementById("filters-btn").getAttribute("aria-expanded"), "true");
  const input = doc.getElementById("q");
  input.value = "night";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  await new Promise(function (r) {
    setTimeout(r, 500);
  });
  assert.ok(calls.some(function (u) { return /name=night/.test(u); }), "search query not sent: " + calls.join("\n"));
  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(doc.getElementById("filters").hidden, true);
  assert.equal(doc.getElementById("filters-btn").getAttribute("aria-expanded"), "false");
});

test("language switch flips direction, copy and titles", async (t) => {
  const { window, close } = makeDom("");
  t.after(close);
  const doc = window.document;
  await waitFor(function () {
    return doc.querySelectorAll("#cards .card").length === 3;
  });
  click(window, doc.querySelector('[data-lang="en"]'));
  assert.equal(doc.documentElement.lang, "en");
  assert.equal(doc.documentElement.dir, "ltr");
  assert.match(doc.title, /Live radio/);
  click(window, doc.querySelector('[data-lang="fa"]'));
  assert.equal(doc.documentElement.lang, "fa");
  assert.equal(doc.documentElement.dir, "rtl");
  assert.equal(window.localStorage.getItem("freq-lang"), "fa");
});

test("theme changes persist and update the skin", async (t) => {
  const { window, close } = makeDom("");
  t.after(close);
  const doc = window.document;
  await waitFor(function () {
    return doc.querySelectorAll("#cards .card").length === 3;
  });
  click(window, doc.querySelector('[data-lang="fa"]'));
  click(window, doc.getElementById("settings-btn"));
  assert.equal(doc.getElementById("settings").hidden, false);
  click(window, doc.getElementById("theme-btn"));
  assert.equal(doc.getElementById("themes").hidden, false);
  click(window, doc.querySelector('[data-tid="light"]'));
  assert.equal(doc.documentElement.getAttribute("data-skin"), "light");
  assert.equal(doc.documentElement.getAttribute("data-theme"), "light");
  assert.equal(window.localStorage.getItem("freq-theme"), "light");
  const meta = doc.querySelector('meta[name="theme-color"]');
  assert.equal(meta.getAttribute("content"), "#f4f4f5");
});

test("player appearances are selectable, localized and persistent", async (t) => {
  const { window, close } = makeDom("");
  t.after(close);
  const doc = window.document;
  await waitFor(function () {
    return doc.querySelectorAll("#cards .card").length === 3;
  });

  click(window, doc.getElementById("about-btn"));
  assert.equal(doc.querySelector(".tg"), null);
  assert.doesNotMatch(doc.getElementById("about").textContent, /t\.me\/|کانال/);
  click(window, doc.getElementById("about"));

  click(window, doc.getElementById("settings-btn"));
  click(window, doc.getElementById("player-style-btn"));
  assert.equal(doc.getElementById("playerstyles").hidden, false);
  assert.equal(doc.getElementById("player-style-grid").children.length, 11);
  click(window, doc.querySelector('[data-style-id="terminal"]'));
  assert.equal(doc.documentElement.getAttribute("data-player-style"), "terminal");
  assert.equal(window.localStorage.getItem("freq-player-style"), "terminal");
  assert.equal(doc.querySelector('[data-style-id="terminal"]').getAttribute("aria-pressed"), "true");

  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(doc.getElementById("playerstyles").hidden, true);
  click(window, doc.getElementById("settings-btn"));
  click(window, doc.querySelector('[data-lang="en"]'));
  assert.match(doc.getElementById("player-style-btn").textContent, /Terminal/);
  assert.match(doc.getElementById("player-style-count").textContent, /11/);
});

test("deep link auto-selects the shared station", async (t) => {
  const { window, close } = makeDom("?s=uuid-2");
  t.after(close);
  const doc = window.document;
  await waitFor(function () {
    return doc.getElementById("p-name").textContent === "رادیو جوان";
  });
  assert.equal(doc.getElementById("audio").src, "https://stream.example/two");
  assert.equal(doc.getElementById("p-name").textContent, "رادیو جوان");
});

test("URL filters are applied before the first request", async (t) => {
  const { window, calls, close } = makeDom("?tag=jazz&cc=DE&sort=bitrate");
  t.after(close);
  const doc = window.document;
  await waitFor(function () {
    return doc.querySelectorAll("#cards .card").length === 3;
  });
  const first = calls.filter(function (u) {
    return u.indexOf("/json/stations/search") >= 0;
  })[0];
  assert.match(first, /countrycode=DE/);
  assert.match(first, /tag=jazz/);
  assert.match(first, /order=bitrate/);
  assert.equal(doc.querySelectorAll("#genres button.on").length, 1);
});

test("offline snapshot is used when the directory is unreachable", async (t) => {
  const dom = new JSDOM(html, { url: "https://freq.test/", runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  t.after(function () { try { window.close(); } catch (_) {} });
  window.console = console;
  window.matchMedia = function () {
    return { matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} };
  };
  window.HTMLCanvasElement.prototype.getContext = function () {
    return null;
  };
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.IntersectionObserver = Observer;
  window.ResizeObserver = Observer;
  window.requestAnimationFrame = function () {
    return 0;
  };
  window.HTMLMediaElement.prototype.play = function () {
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function () {};
  window.HTMLMediaElement.prototype.load = function () {};
  window.fetch = function () {
    return Promise.reject(new Error("offline"));
  };
  window.localStorage.setItem(
    "freq-cache",
    JSON.stringify({ at: Date.now(), mode: "browse", cc: "", tag: "", q: "", language: "", stations: STATIONS })
  );
  window.eval(coreSource);
  window.eval(i18nSource);
  window.eval(appSource);
  const ok = await waitFor(function () {
    return window.document.querySelectorAll("#cards .card").length === 3;
  }, 5000);
  assert.ok(ok, "cached stations did not render");
  assert.equal(window.document.getElementById("offline").hidden, false);
  assert.match(window.document.getElementById("count-line").textContent, /3/);
});
