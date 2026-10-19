/* FREQ service worker — offline shell + polite runtime caching.
   Made by Mobin.A. Bump CACHE_VERSION whenever the shell changes. */
"use strict";

const CACHE_VERSION = "freq-v2.2.0";
const SHELL_CACHE = CACHE_VERSION + "-shell";
const RUNTIME_CACHE = CACHE_VERSION + "-runtime";
const API_CACHE = CACHE_VERSION + "-api";

const SHELL = [
  "./",
  "./index.html",
  "./404.html",
  "./core.js?v=35",
  "./i18n.js?v=35",
  "./app.js?v=35",
  "./styles.css?v=35",
  "./manifest.webmanifest?v=35",
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

/**
 * A failed directory lookup must stay a failed lookup. Handing the page an
 * empty JSON array here looked like "the server says there are no stations":
 * the app never fell over to another mirror, never showed a retry and the
 * list stayed blank. A 504 keeps the truth on the wire.
 */
function offlineApiError() {
  return new Response('{"error":"offline","message":"FREQ service worker could not reach the station directory"}', {
    status: 504,
    statusText: "Gateway Timeout",
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * Last-resort page for a cold start with no cache at all (fresh install while
 * offline). It is honest about what happened and offers one way forward — the
 * app shell itself, when cached, is the normal offline experience.
 */
function offlinePage() {
  const html = [
    "<!doctype html>",
    '<html lang="fa" dir="rtl"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    "<title>FREQ — آفلاین / offline</title>",
    "<style>",
    ":root{color-scheme:dark light}",
    "body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;",
    "background:#09090b;color:#f4f4f5;font:16px/1.7 system-ui,-apple-system,Segoe UI,Vazirmatn,sans-serif}",
    ".card{max-width:34rem;text-align:center}",
    ".mark{font:800 34px/1 system-ui;letter-spacing:.28em;direction:ltr;color:#ff4d2e}",
    "h1{font-size:1.25rem;margin:18px 0 6px}",
    "p{margin:0 0 8px;color:#a1a1aa}",
    "a{display:inline-block;margin-top:18px;padding:11px 20px;border-radius:999px;",
    "background:#ff4d2e;color:#fff;text-decoration:none;font-weight:700}",
    "hr{border:0;border-top:1px solid rgba(255,255,255,.1);margin:22px 0}",
    "</style></head><body><div class=\"card\">",
    '<div class="mark">FREQ</div>',
    "<h1>اینترنت در دسترس نیست — FREQ هنوز آفلاین را کامل یاد نگرفته است</h1>",
    "<p>صفحهٔ اصلی روی این دستگاه کش نشده، پس ایستگاهی برای نشان دادن داریم نیستیم. وصل شو و دوباره تلاش کن.</p>",
    "<hr>",
    '<div dir="ltr"><h1>No connection — and no saved copy of FREQ on this device yet</h1>',
    "<p>The app shell was never cached, so there is nothing stored to show offline. Reconnect and try again.</p></div>",
    '<a href="./">Retry · تلاش دوباره</a>',
    "</div></body></html>",
  ].join("");
  return new Response(html, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
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
          offlinePage()
        );
      })()
    );
    return;
  }

  if (isApi(url)) {
    // No timeout race with the page and no fake empty list: cached copy if we
    // have one, otherwise a real error the app can explain and retry.
    event.respondWith(networkFirst(request, API_CACHE, 14000).catch(offlineApiError));
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
