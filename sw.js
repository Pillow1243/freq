/* FREQ service worker — offline shell + polite runtime caching.
   Made by Mobin.A. Bump CACHE_VERSION whenever the shell changes. */
"use strict";

const CACHE_VERSION = "freq-v2.0.1";
const SHELL_CACHE = CACHE_VERSION + "-shell";
const RUNTIME_CACHE = CACHE_VERSION + "-runtime";
const API_CACHE = CACHE_VERSION + "-api";

const SHELL = [
  "./",
  "./index.html",
  "./404.html",
  "./core.js?v=32",
  "./i18n.js?v=32",
  "./app.js?v=32",
  "./styles.css?v=32",
  "./manifest.webmanifest?v=32",
  "./assets/icon.svg",
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable.png",
];

const API_HOSTS = ["api.radio-browser.info", "open-meteo.com"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    (async function () {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.all(
        SHELL.map(function (url) {
          return cache.add(new Request(url, { cache: "reload" })).catch(function () {});
        })
      );
    })()
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async function () {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(function (key) { return key.indexOf(CACHE_VERSION) !== 0; })
          .map(function (key) { return caches.delete(key); })
      );
      if (self.registration.navigationPreload) {
        try { await self.registration.navigationPreload.disable(); } catch (_) {}
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", function (event) {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") self.skipWaiting();
  if (data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) { return caches.delete(key); }));
      })
    );
  }
});

function cacheLimit(name) {
  if (/-api$/.test(name)) return 120;
  if (/-shell$/.test(name)) return 80;
  return 60;
}

async function putCapped(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    const limit = cacheLimit(cacheName);
    const keys = await cache.keys();
    if (keys.length > limit) {
      await Promise.all(
        keys.slice(0, keys.length - limit).map(function (key) { return cache.delete(key); })
      );
    }
  } catch (_) {}
}

function isApi(url) {
  return API_HOSTS.some(function (host) {
    return url.hostname === host || url.hostname.endsWith("." + host);
  });
}

function isStream(url) {
  return /\.(mp3|aac|m3u8|ogg|opus|flac|m4a|wav)(\?|$)/i.test(url.pathname) && !isApi(url);
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  // Shell assets are version-locked by CACHE_VERSION, so a `?v=` bump should
  // still hit the precached copy (icons are precached without a query string).
  const hit = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then(function (response) {
      if (response && (response.ok || response.type === "opaque")) {
        putCapped(cacheName, request, response.clone());
      }
      return response;
    })
    .catch(function () { return null; });
  return hit || (await network) || Response.error();
}

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreSearch: false });
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs || 7000) : null;
  try {
    const response = await fetch(request, controller ? { signal: controller.signal } : undefined);
    if (response && response.ok) {
      putCapped(cacheName, request, response.clone());
      return response;
    }
    return hit || response || Response.error();
  } catch (_) {
    if (hit) return hit;
    throw _;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET") return;
  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return;
  if (isStream(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async function () {
        try {
          const fresh = await fetch(request, { cache: "no-cache" });
          if (fresh && fresh.ok) {
            putCapped(SHELL_CACHE, "./index.html", fresh.clone());
            return fresh;
          }
        } catch (_) {}
        const cache = await caches.open(SHELL_CACHE);
        return (
          (await cache.match("./index.html")) ||
          (await cache.match("./")) ||
          new Response(
            "<!doctype html><meta charset=utf-8><title>FREQ</title><style>body{font:16px system-ui;background:#09090b;color:#f4f4f5;display:grid;place-items:center;height:100vh;margin:0}</style><p>FREQ is offline. Reconnect and try again.</p>",
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          )
        );
      })()
    );
    return;
  }

  if (isApi(url)) {
    event.respondWith(networkFirst(request, API_CACHE, 8000).catch(function () {
      return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (/\/assets\//.test(url.pathname) || /\.(png|svg|jpg|jpeg|webp|ico|woff2?|ttf)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }
  if (/\.(css|js|json|webmanifest)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});
