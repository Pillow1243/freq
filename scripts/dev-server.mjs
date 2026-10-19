#!/usr/bin/env node
/**
 * FREQ dev server — dependency-free static server with correct MIME types,
 * no-store caching for development and a tiny request log.
 *
 *   npm run dev            # http://localhost:4176
 *   PORT=8080 npm run dev  # custom port
 */
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.env.PORT || 4176);
const HOST = process.env.HOST || "0.0.0.0";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(self), microphone=(self), camera=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

function log(status, method, url, ms) {
  const color = status >= 500 ? 31 : status >= 400 ? 33 : 32;
  process.stdout.write(
    `\x1b[${color}m${status}\x1b[0m ${method} ${decodeURIComponent(url)} \x1b[2m${ms}ms\x1b[0m\n`
  );
}

async function resolveFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (_) {
    return null;
  }
  let rel = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  if (rel === sep || rel === "/" || rel === ".") rel = "index.html";
  let target = resolve(join(ROOT, rel));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null;
  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      target = join(target, "index.html");
      const indexInfo = await stat(target);
      return indexInfo.isFile() ? target : null;
    }
    return info.isFile() ? target : null;
  } catch (_) {
    return null;
  }
}

const server = createServer(async function (req, res) {
  const started = Date.now();
  const method = req.method || "GET";
  if (method !== "GET" && method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD", ...SECURITY_HEADERS });
    res.end("Method Not Allowed");
    log(405, method, req.url || "/", Date.now() - started);
    return;
  }
  const url = new URL(req.url || "/", "http://" + (req.headers.host || "localhost"));
  let file = await resolveFile(url.pathname);
  let status = 200;
  if (!file) {
    status = 404;
    file = await resolveFile("/404.html");
    if (!file) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", ...SECURITY_HEADERS });
      res.end("Not found");
      log(404, method, url.pathname, Date.now() - started);
      return;
    }
  }
  const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "Service-Worker-Allowed": "/",
    ...SECURITY_HEADERS,
  });
  if (method === "HEAD") {
    res.end();
  } else {
    createReadStream(file).pipe(res);
  }
  log(status, method, url.pathname, Date.now() - started);
});

server.listen(PORT, HOST, function () {
  const shown = HOST === "0.0.0.0" ? "localhost" : HOST;
  process.stdout.write(`\n  FREQ dev server\n  → http://${shown}:${PORT}/\n\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, function () {
    server.close(function () {
      process.exit(0);
    });
  });
}
