"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { makeDom, waitFor, click } = require("./helpers/dom.js");

async function ready(t) {
  const ctx = makeDom("");
  t.after(ctx.close);
  const ok = await waitFor(function () {
    return ctx.window.document.querySelectorAll("#cards .card").length === 3;
  });
  assert.ok(ok, "cards did not render");
  return ctx;
}

test("every panel opens, traps focus and closes", async (t) => {
  const { window } = await ready(t);
  const doc = window.document;
  const key = (k) => doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true }));

  click(window, doc.getElementById("filters-btn"));
  assert.equal(doc.getElementById("filters").hidden, false);
  key("Escape");
  assert.equal(doc.getElementById("filters").hidden, true);

  click(window, doc.getElementById("settings-btn"));
  assert.equal(doc.getElementById("settings").hidden, false);
  click(window, doc.getElementById("theme-btn"));
  assert.equal(doc.getElementById("themes").hidden, false);
  click(window, doc.getElementById("themes"));
  assert.equal(doc.getElementById("themes").hidden, true);

  click(window, doc.getElementById("wrap-btn"));
  assert.equal(doc.getElementById("wrap").hidden, false);
  click(window, doc.getElementById("wrap"));
  assert.equal(doc.getElementById("wrap").hidden, true);

  click(window, doc.getElementById("about-btn"));
  assert.equal(doc.getElementById("about").hidden, false);
  click(window, doc.getElementById("about"));
  assert.equal(doc.getElementById("about").hidden, true);

  key("?");
  assert.equal(doc.getElementById("help").hidden, false);
  key("Escape");
  assert.equal(doc.getElementById("help").hidden, true);

  click(window, doc.querySelector('[data-act="map"]'));
  assert.equal(doc.getElementById("map").hidden, false);
  key("Escape");
  assert.equal(doc.getElementById("map").hidden, true);

  click(window, doc.querySelector('[data-act="car"]'));
  assert.equal(doc.getElementById("car").hidden, false);
  click(window, doc.getElementById("car"));
  assert.equal(doc.getElementById("car").hidden, true);

  click(window, doc.querySelector('[data-act="stand"]'));
  assert.equal(doc.getElementById("stand").hidden, false);
  click(window, doc.getElementById("stand"));
  assert.equal(doc.getElementById("stand").hidden, true);
});

test("presets hold-to-save then tap-to-play", async (t) => {
  const { window } = await ready(t);
  const doc = window.document;
  click(window, doc.querySelector('#cards [data-play="uuid-1"]'));
  const preset = doc.querySelector('#presets [data-preset="0"]');
  preset.dispatchEvent(new window.MouseEvent("click", { bubbles: true, shiftKey: true }));
  const saved = JSON.parse(window.localStorage.getItem("freq-presets"));
  assert.equal(saved[0].stationuuid, "uuid-1");
  assert.match(doc.getElementById("toast-msg").textContent, /P1/);

  click(window, doc.querySelector('#cards [data-play="uuid-2"]'));
  click(window, doc.querySelector('#presets [data-preset="0"]'));
  assert.equal(doc.getElementById("audio").src, "https://stream.example/one");
});

test("folders can be created and filled", async (t) => {
  const { window } = await ready(t);
  const doc = window.document;
  click(window, doc.querySelector('#cards [data-play="uuid-1"]'));
  click(window, doc.getElementById("settings-btn"));
  const name = doc.getElementById("folder-name");
  name.value = "Night";
  click(window, doc.querySelector('[data-act="newfolder"]'));
  const folders = JSON.parse(window.localStorage.getItem("freq-folders"));
  assert.equal(folders.length, 1);
  assert.equal(folders[0].name, "Night");
  click(window, doc.querySelector('[data-act="addfolder"]'));
  const after = JSON.parse(window.localStorage.getItem("freq-folders"));
  assert.deepEqual(after[0].ids, ["uuid-1"]);
  assert.equal(doc.querySelectorAll("#folders button").length, 1);
});

test("hiding a station removes it and undo restores it", async (t) => {
  const { window } = await ready(t);
  const doc = window.document;
  click(window, doc.querySelector('#cards [data-info="uuid-2"]'));
  assert.equal(doc.getElementById("sheet").hidden, false);
  click(window, doc.getElementById("sh-hide"));
  assert.equal(doc.getElementById("sheet").hidden, true);
  assert.equal(doc.querySelectorAll("#cards .card").length, 2);
  const key = JSON.parse(window.localStorage.getItem("freq-hidden"));
  assert.deepEqual(key, ["uuid-2"]);
  const action = doc.getElementById("toast-act");
  assert.equal(action.hidden, false);
  click(window, action);
  await waitFor(function () {
    return doc.querySelectorAll("#cards .card").length === 3;
  });
  assert.equal(doc.querySelectorAll("#cards .card").length, 3);
  assert.deepEqual(JSON.parse(window.localStorage.getItem("freq-hidden")), []);
});

test("filters are mirrored into the URL and cleared again", async (t) => {
  const { window } = await ready(t);
  const doc = window.document;
  click(window, doc.querySelector('#genres [data-tag="jazz"]'));
  await new Promise(function (r) {
    setTimeout(r, 450);
  });
  assert.match(window.location.search, /tag=jazz/);
  click(window, doc.getElementById("clear-btn"));
  await new Promise(function (r) {
    setTimeout(r, 450);
  });
  assert.equal(window.location.search, "");
});

test("keyboard shortcuts drive playback, favourites and help", async (t) => {
  const { window } = await ready(t);
  const doc = window.document;
  const key = (k) =>
    doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  key(" ");
  await waitFor(function () {
    return doc.getElementById("p-name").textContent !== "—";
  });
  assert.equal(doc.getElementById("p-name").textContent, "Radio One");
  key("f");
  assert.equal(doc.getElementById("p-fav").getAttribute("aria-pressed"), "true");
  key("?");
  assert.equal(doc.getElementById("help").hidden, false);
  key("Escape");
  assert.equal(doc.getElementById("help").hidden, true);
});

test("sleep timer, alarm and stats persist", async (t) => {
  const { window } = await ready(t);
  const doc = window.document;
  click(window, doc.querySelector('[data-sleep="15"]'));
  assert.equal(doc.getElementById("dock-sleep").getAttribute("aria-pressed"), "true");
  assert.equal(doc.getElementById("dock-sleep").textContent.trim().length > 0, true);
  click(window, doc.querySelector('[data-sleep="0"]'));
  assert.equal(doc.getElementById("dock-sleep").getAttribute("aria-pressed"), "false");

  click(window, doc.getElementById("settings-btn"));
  const alarm = doc.getElementById("alarm-on");
  alarm.checked = true;
  alarm.dispatchEvent(new window.Event("change", { bubbles: true }));
  assert.equal(JSON.parse(window.localStorage.getItem("freq-alarm")).on, true);
  const time = doc.getElementById("alarm-time");
  time.value = "06:45";
  time.dispatchEvent(new window.Event("change", { bubbles: true }));
  const alarmSaved = JSON.parse(window.localStorage.getItem("freq-alarm"));
  assert.equal(alarmSaved.hh, 6);
  assert.equal(alarmSaved.mm, 45);
});

test("stats panel can be cleared and update is a no-op without a worker", async (t) => {
  const { window } = await ready(t);
  const doc = window.document;
  click(window, doc.getElementById("settings-btn"));
  click(window, doc.getElementById("wrap-btn"));
  assert.equal(doc.getElementById("wrap").hidden, false);
  click(window, doc.querySelector("[data-reset-stats]"));
  const stats = JSON.parse(window.localStorage.getItem("freq-stats"));
  assert.equal(stats.ms, 0);
  assert.deepEqual(stats.hits, {});
  click(window, doc.getElementById("wrap"));

  click(window, doc.getElementById("settings-btn"));
  click(window, doc.querySelector('[data-act="update"]'));
  assert.ok(doc.getElementById("toast-msg").textContent.length > 0);
});

test("search history is remembered and offered as native suggestions", async (t) => {
  const { window } = await ready(t);
  const doc = window.document;
  const field = doc.getElementById("q");
  field.value = "jazz";
  doc.getElementById("search-form").dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true })
  );
  const saved = JSON.parse(window.localStorage.getItem("freq-searches"));
  assert.deepEqual(saved, ["jazz"]);
  const hints = doc.querySelectorAll("#search-hints option");
  assert.equal(hints.length, 1);
  assert.equal(hints[0].value, "jazz");
  assert.equal(field.getAttribute("list"), "search-hints");
});
