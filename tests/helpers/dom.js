"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..", "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const coreSource = fs.readFileSync(path.join(ROOT, "core.js"), "utf8");
const i18nSource = fs.readFileSync(path.join(ROOT, "i18n.js"), "utf8");
const appSource = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");

const STATIONS = [
  {
    stationuuid: "uuid-1",
    name: "Radio One",
    url: "https://stream.example/one",
    url_resolved: "https://stream.example/one",
    favicon: "https://cdn.example/one.png",
    tags: "jazz,chill",
    country: "Germany",
    countrycode: "DE",
    codec: "MP3",
    bitrate: 192,
    votes: 12,
    clickcount: 99,
    geo_lat: 52.5,
    geo_long: 13.4,
    homepage: "https://radio-one.example",
  },
  {
    stationuuid: "uuid-2",
    name: "رادیو جوان",
    url: "https://stream.example/two",
    url_resolved: "https://stream.example/two",
    favicon: "",
    tags: "persian,pop",
    country: "Iran",
    countrycode: "IR",
    codec: "AAC",
    bitrate: 128,
    votes: 4,
    clickcount: 50,
  },
  {
    stationuuid: "uuid-3",
    name: "Night FM",
    url: "https://stream.example/three",
    tags: "ambient",
    country: "France",
    countrycode: "FR",
    codec: "MP3",
    bitrate: 128,
    votes: 1,
    clickcount: 10,
  },
];

/** A Response-like object good enough for app.js and the tests. */
function fakeResponse(body, status) {
  const code = status || 200;
  return {
    ok: code >= 200 && code < 300,
    status: code,
    headers: { get: function () { return null; } },
    json: function () {
      return Promise.resolve(typeof body === "string" ? JSON.parse(body) : body);
    },
  };
}

function makeDom(search, options) {
  const opts = options || {};
  const dom = new JSDOM(html, {
    url: "https://freq.test/" + (search || ""),
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  if (typeof opts.onLine === "boolean") {
    Object.defineProperty(window.navigator, "onLine", { value: opts.onLine, configurable: true });
  }
  if (opts.seed) {
    Object.keys(opts.seed).forEach(function (key) {
      window.localStorage.setItem(key, opts.seed[key]);
    });
  }
  window.console = console;
  window.matchMedia = function () {
    return {
      matches: false,
      media: "",
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    };
  };
  window.HTMLCanvasElement.prototype.getContext = function () {
    return null;
  };
  class Observer {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver = Observer;
  window.ResizeObserver = Observer;
  window.requestAnimationFrame = function () {
    return 0;
  };
  window.cancelAnimationFrame = function () {};
  window.scrollTo = function () {};
  window.confirm = function () {
    return false;
  };
  window.open = function () {
    return null;
  };
  window.HTMLMediaElement.prototype.play = function () {
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function () {};
  window.HTMLMediaElement.prototype.load = function () {};

  const calls = [];
  const defaultFetch = function (url) {
    const target = String(url);
    calls.push(target);
    let body = {};
    if (target.indexOf("/json/stats") >= 0) body = { stations: 51234, countries: 210 };
    else if (target.indexOf("/json/countries") >= 0) {
      body = [
        { iso_3166_1: "DE", name: "Germany", stationcount: 1200 },
        { iso_3166_1: "IR", name: "Iran", stationcount: 200 },
        { iso_3166_1: "FR", name: "France", stationcount: 800 },
      ];
    } else if (target.indexOf("/json/stations/search") >= 0) body = STATIONS;
    else if (target.indexOf("open-meteo") >= 0) body = { current: { temperature_2m: 21.4, weather_code: 1 } };
    return Promise.resolve(fakeResponse(body, 200));
  };
  window.fetch = opts.fetch
    ? function (url, init) {
        calls.push(String(url));
        return opts.fetch(String(url), init, fakeResponse);
      }
    : defaultFetch;
  window.eval(coreSource);
  window.eval(i18nSource);
  window.eval(appSource);
  return {
    dom,
    window,
    calls,
    close: function () {
      try {
        window.close();
      } catch (_) {}
    },
  };
}

async function waitFor(fn, timeout) {
  const limit = Date.now() + (timeout || 3000);
  while (Date.now() < limit) {
    if (fn()) return true;
    await new Promise(function (r) {
      setTimeout(r, 25);
    });
  }
  return false;
}

function click(window, el) {
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
}

module.exports = {
  makeDom,
  waitFor,
  click,
  fakeResponse,
  STATIONS,
  html,
  coreSource,
  i18nSource,
  appSource,
};
