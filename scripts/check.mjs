#!/usr/bin/env node
/**
 * FREQ static integrity checks — catches the mistakes that break a no-build
 * PWA: missing DOM ids, missing translations, stale assets, CSP hash drift.
 *
 * Exit code 0 = all good, 1 = at least one error.
 */
import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
const ok = [];

function fail(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}
function pass(msg) {
  ok.push(msg);
}
async function read(name) {
  return readFile(resolve(ROOT, name), "utf8");
}
async function exists(name) {
  try {
    await access(resolve(ROOT, name));
    return true;
  } catch (_) {
    return false;
  }
}
function idsIn(html) {
  const ids = new Set();
  const re = /\bid="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) ids.add(m[1]);
  return ids;
}
function staticPath(pathname) {
  return pathname.replace(/^\.\//, "").replace(/[?#].*$/, "");
}

const [html, app, core, i18n, sw, manifestText] = await Promise.all([
  read("index.html"),
  read("app.js"),
  read("core.js"),
  read("i18n.js"),
  read("sw.js"),
  read("manifest.webmanifest"),
]);

/* 1. IDs ---------------------------------------------------------------- */
const ids = idsIn(html);
const dynamic = new Set(["cards", "tail", "offline-text"]);
const referenced = new Set();
{
  const re = /\$\(\s*"([^"]+)"\s*\)/g;
  let m;
  while ((m = re.exec(app))) referenced.add(m[1]);
}
const missingIds = [...referenced].filter((id) => !ids.has(id) && !dynamic.has(id));
if (missingIds.length) fail("app.js references missing ids: " + missingIds.join(", "));
else pass(`all ${referenced.size} referenced ids exist in index.html`);

const duplicateIds = (() => {
  const seen = new Set();
  const dup = new Set();
  const re = /\bid="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    if (seen.has(m[1])) dup.add(m[1]);
    seen.add(m[1]);
  }
  return [...dup];
})();
if (duplicateIds.length) fail("duplicate ids in index.html: " + duplicateIds.join(", "));
else pass(`no duplicate ids (${ids.size} total)`);

/* 2. i18n --------------------------------------------------------------- */
const dict = {};
for (const lang of ["fa", "en"]) {
  const start = i18n.indexOf(lang + ": {");
  if (start < 0) {
    fail("missing language pack: " + lang);
    continue;
  }
  const block = lang === "fa" ? i18n.slice(start, i18n.indexOf("\n  en: {", start)) : i18n.slice(start);
  const keys = new Set();
  const re = /^\s{4}([A-Za-z0-9_]+)\s*:/gm;
  let m;
  while ((m = re.exec(block))) keys.add(m[1]);
  dict[lang] = keys;
}
if (dict.fa && dict.en) {
  const missingEn = [...dict.fa].filter((k) => !dict.en.has(k));
  const missingFa = [...dict.en].filter((k) => !dict.fa.has(k));
  if (missingEn.length) fail("keys missing from en: " + missingEn.join(", "));
  if (missingFa.length) fail("keys missing from fa: " + missingFa.join(", "));
  if (!missingEn.length && !missingFa.length) pass(`i18n parity: ${dict.fa.size} keys in fa & en`);
}
const used = new Set();
{
  const re = /\bt\(\s*"([^"]+)"\s*\)/g;
  let m;
  while ((m = re.exec(app))) used.add(m[1]);
}
{
  const re = /data-i18n(?:-placeholder|-aria)?="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) used.add(m[1]);
}
const missingKeys = [...used].filter((k) => dict.fa && !dict.fa.has(k));
if (missingKeys.length) fail("missing translation keys: " + missingKeys.join(", "));
else pass(`all ${used.size} used translation keys exist`);

/* 2b. Duplicate keys and dead actions ------------------------------------ */
{
  const dups = [];
  for (const lang of ["fa", "en"]) {
    const start = i18n.indexOf(lang + ": {");
    if (start < 0) continue;
    const block = lang === "fa" ? i18n.slice(start, i18n.indexOf("\n  en: {", start)) : i18n.slice(start);
    const seen = new Set();
    const re = /^\s{4}([A-Za-z0-9_]+)\s*:/gm;
    let m;
    while ((m = re.exec(block))) {
      if (seen.has(m[1])) dups.push(`${lang}.${m[1]}`);
      seen.add(m[1]);
    }
  }
  if (dups.length) fail("duplicate i18n keys: " + [...new Set(dups)].join(", "));
  else pass("no duplicate i18n keys");

  const htmlActs = new Set([...html.matchAll(/data-act="([^"]+)"/g)].map((m) => m[1]));
  const codeActs = new Set([...app.matchAll(/act === "([^"]+)"/g)].map((m) => m[1]));
  const dead = [...htmlActs].filter((a) => !codeActs.has(a));
  if (dead.length) fail("buttons with no data-act handler: " + dead.join(", "));
  else pass(`all ${htmlActs.size} data-act buttons are handled`);

  // `seeall` only exists on rails that app.js injects at runtime.
  const runtimeOnly = new Set(["seeall"]);
  const unused = [...codeActs].filter((a) => !htmlActs.has(a) && !runtimeOnly.has(a));
  if (unused.length) warn("data-act handlers never rendered: " + unused.join(", "));
}

/* 3. Assets referenced by the HTML -------------------------------------- */
const refs = new Set();
{
  const re = /(?:href|src)="(\.?\/?[^"#:]+?)(?:\?[^"]*)?"/g;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1];
    if (/^(https?:|data:|blob:|mailto:|tel:)/.test(raw)) continue;
    if (!raw || raw === "#" || raw.startsWith("#")) continue;
    refs.add(staticPath(raw));
  }
}
for (const ref of refs) {
  if (!(await exists(ref))) fail("missing local asset: " + ref);
}
if (refs.size) pass(`checked ${refs.size} local asset references`);

/* 4. CSP JSON-LD hash ---------------------------------------------------- */
{
  const meta = html.match(/http-equiv="Content-Security-Policy"[\s\S]*?content="([^"]*)"/);
  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!meta || !block) {
    fail("missing CSP meta or JSON-LD block");
  } else {
    const hash = "sha256-" + createHash("sha256").update(block[1], "utf8").digest("base64");
    if (!meta[1].includes(hash)) fail("CSP hash is stale — expected " + hash);
    else pass("CSP JSON-LD hash matches");
  }
}

/* 5. Service worker shell ------------------------------------------------ */
{
  const shell = [...sw.matchAll(/"(\.\/[^"]+)"/g)].map((m) => m[1]);
  const checked = new Set();
  for (const entry of shell) {
    const file = staticPath(entry);
    const tracked = file.startsWith("assets/") || /\.(html|js|css|webmanifest)$/.test(file);
    if (!tracked) continue;
    if (checked.has(file)) continue;
    checked.add(file);
    if (!(await exists(file))) fail("service worker precaches missing file: " + entry);
  }
  pass(`service worker precaches ${checked.size} local files`);
}

/* 6. Version strings ----------------------------------------------------- */
{
  const versions = new Set([...html.matchAll(/\?v=(\d+)/g)].map((m) => m[1]));
  if (versions.size > 1) fail("mixed ?v= versions in index.html: " + [...versions].join(", "));
  else if (versions.size === 1) pass("cache-busting version: ?v=" + [...versions][0]);
  const pkg = JSON.parse(await read("package.json"));
  const about = html.match(/id="about-ver"[^>]*>v([\d.]+)</);
  if (about && about[1] !== pkg.version) fail(`about version ${about[1]} != package.json ${pkg.version}`);
  else if (about) pass("about version matches package.json");
  const appVersion = app.match(/APP_VERSION\s*=\s*"([\d.]+)"/);
  if (!appVersion || appVersion[1] !== pkg.version) {
    fail("APP_VERSION does not match package.json");
  }
  const pageVersion = versions.size === 1 ? [...versions][0] : null;
  const shellVersioned = [...sw.matchAll(/"\.\/[^"?]+\?v=(\d+)"/g)].map((m) => m[1]);
  const shellStale = shellVersioned.filter((v) => v !== pageVersion);
  if (shellStale.length) fail("service worker shell uses stale ?v= " + shellStale.join(", "));
  const swCache = sw.match(/CACHE_VERSION\s*=\s*"freq-v([\d.]+)"/);
  if (!swCache) fail("service worker has no CACHE_VERSION");
  else if (pageVersion && swCache[1] !== pkg.version) {
    fail(`CACHE_VERSION freq-v${swCache[1]} != app ${pkg.version}`);
  } else if (swCache) {
    pass(`version lockstep: v${pkg.version}, ?v=${pageVersion}, freq-v${swCache[1]}`);
  }
}

/* 7. Manifest ------------------------------------------------------------ */
try {
  const mf = JSON.parse(manifestText);
  for (const field of ["name", "short_name", "start_url", "display", "icons", "theme_color"]) {
    if (!mf[field]) fail("manifest missing: " + field);
  }
  if (!Array.isArray(mf.icons) || mf.icons.length < 2) fail("manifest needs at least two icons");
  for (const icon of mf.icons || []) {
    const path = staticPath("./" + icon.src.replace(/^\.\//, ""));
    if (!(await exists(path))) fail("manifest icon missing: " + icon.src);
  }
  pass("manifest is valid and icons exist");
} catch (err) {
  fail("manifest is not valid JSON: " + err.message);
}

/* 8. Housekeeping -------------------------------------------------------- */
{
  const forbidden = [
    [/document\.write\s*\(/, "document.write"],
    [/\beval\s*\(/, "eval()"],
    [/http:\/\/de1\.api\.radio-browser\.info/, "insecure API host"],
  ];
  for (const [re, label] of forbidden) {
    if (re.test(app) || re.test(core) || re.test(i18n)) fail("forbidden pattern: " + label);
  }
  if (!/Content-Security-Policy/.test(html)) fail("missing CSP meta tag");
  if (!/<html[^>]+lang=/.test(html)) fail("<html> has no lang attribute");
  if (!/<meta name="viewport"/.test(html)) fail("missing viewport meta");
  if (/<img[^>]+src="[^"]+"(?![^>]*\balt=)[^>]*>/i.test(html)) warn("an <img> may be missing alt text");
  pass("housekeeping checks done");
}

/* Report ---------------------------------------------------------------- */
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
for (const line of ok) process.stdout.write(`\x1b[32m✓\x1b[0m ${line}\n`);
for (const line of warnings) process.stdout.write(`\x1b[33m!\x1b[0m ${line}\n`);
for (const line of errors) process.stdout.write(`\x1b[31m✗\x1b[0m ${line}\n`);
process.stdout.write(
  `\n${bold("check")}: ${ok.length} passed, ${warnings.length} warnings, ${errors.length} errors\n`
);
if (errors.length) process.exit(1);
