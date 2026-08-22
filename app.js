/* FREQ — ساخته شده توسط مبین.آ */
(() => {
  const $ = (id) => document.getElementById(id);
  const HOSTS = [
    "https://de1.api.radio-browser.info",
    "https://fi1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info",
  ];
  const PAGE = 120;
  const COUNTRIES = [
    { cc: "", fa: "جهان", en: "World" },
    { cc: "IR", fa: "ایران", en: "Iran" },
    { cc: "DE", fa: "آلمان", en: "Germany" },
    { cc: "FR", fa: "فرانسه", en: "France" },
    { cc: "GB", fa: "بریتانیا", en: "UK" },
    { cc: "US", fa: "آمریکا", en: "USA" },
    { cc: "TR", fa: "ترکیه", en: "Turkey" },
    { cc: "ES", fa: "اسپانیا", en: "Spain" },
    { cc: "IT", fa: "ایتالیا", en: "Italy" },
    { cc: "NL", fa: "هلند", en: "Netherlands" },
    { cc: "PL", fa: "لهستان", en: "Poland" },
    { cc: "RU", fa: "روسیه", en: "Russia" },
    { cc: "JP", fa: "ژاپن", en: "Japan" },
    { cc: "KR", fa: "کره", en: "Korea" },
    { cc: "IN", fa: "هند", en: "India" },
    { cc: "BR", fa: "برزیل", en: "Brazil" },
    { cc: "MX", fa: "مکزیک", en: "Mexico" },
    { cc: "EG", fa: "مصر", en: "Egypt" },
    { cc: "AE", fa: "امارات", en: "UAE" },
    { cc: "AU", fa: "استرالیا", en: "Australia" },
    { cc: "CA", fa: "کانادا", en: "Canada" },
  ];
  const GENRES = [
    { tag: "", fa: "همهٔ سبک‌ها", en: "All genres" },
    { tag: "pop", fa: "پاپ", en: "Pop" },
    { tag: "rock", fa: "راک", en: "Rock" },
    { tag: "jazz", fa: "جاز", en: "Jazz" },
    { tag: "classical", fa: "کلاسیک", en: "Classical" },
    { tag: "electronic", fa: "الکترونیک", en: "Electronic" },
    { tag: "dance", fa: "دنس", en: "Dance" },
    { tag: "hip hop", fa: "هیپ‌هاپ", en: "Hip hop" },
    { tag: "metal", fa: "متال", en: "Metal" },
    { tag: "news", fa: "خبر", en: "News" },
    { tag: "talk", fa: "گفت‌وگو", en: "Talk" },
    { tag: "oldies", fa: "قدیمی", en: "Oldies" },
    { tag: "80s", fa: "دهه ۸۰", en: "80s" },
    { tag: "chillout", fa: "چیل", en: "Chill" },
    { tag: "persian", fa: "پارسی", en: "Persian" },
    { tag: "folk", fa: "فولک", en: "Folk" },
    { tag: "reggae", fa: "رگه", en: "Reggae" },
  ];
  const LANGS = [
    { id: "", fa: "همهٔ زبان‌ها", en: "All languages" },
    { id: "persian", fa: "فارسی", en: "Persian" },
    { id: "english", fa: "انگلیسی", en: "English" },
    { id: "german", fa: "آلمانی", en: "German" },
    { id: "french", fa: "فرانسوی", en: "French" },
    { id: "arabic", fa: "عربی", en: "Arabic" },
    { id: "turkish", fa: "ترکی", en: "Turkish" },
    { id: "spanish", fa: "اسپانیایی", en: "Spanish" },
    { id: "russian", fa: "روسی", en: "Russian" },
  ];
  const BANDS = [
    { tag: "", fa: "همهٔ موج‌ها", en: "All bands" },
    { tag: "chillout", fa: "شب", en: "Night" },
    { tag: "news", fa: "خبر", en: "News" },
    { tag: "jazz", fa: "جاز", en: "Jazz" },
    { tag: "persian", fa: "پارسی", en: "Persian" },
    { tag: "classical", fa: "کلاسیک", en: "Classical" },
  ];

  const state = {
    lang: localStorage.getItem("freq-lang") || "fa",
    host: HOSTS[0],
    cc: "",
    tag: "",
    langFilter: "",
    q: "",
    sort: localStorage.getItem("freq-sort") || "clickcount",
    offset: 0,
    hasMore: false,
    loadingMore: false,
    mode: "browse",
    stations: [],
    favs: safeParse("freq-favs", []),
    recents: safeParse("freq-recents", []),
    current: safeParse("freq-last", null),
    playing: false,
    status: "",
    sleepAt: 0,
    sleepMin: 0,
    playGen: 0,
    ignoreErr: false,
    fails: 0,
    listenMs: 0,
    listenTick: 0,
    prevVol: Number(localStorage.getItem("freq-vol") || "0.85") || 0.85,
    stageOpen: false,
    sheet: null,
    mhz: 96,
    presets: padPresets(safeParse("freq-presets", [])),
    alarm: safeParse("freq-alarm", { on: false, hh: 7, mm: 0, last: "" }),
    stats: safeParse("freq-stats", { ms: 0, hits: {} }),
    band: "",
    wave: localStorage.getItem("freq-wave") || "fm",
    hd: localStorage.getItem("freq-hd") === "1",
    hidden: safeParse("freq-hidden", []),
    scanning: false,
    scanGen: 0,
    night: false,
    userVol: Number(localStorage.getItem("freq-vol") || "0.85") || 0.85,
    weather: "",
    fadeIv: 0,
    folders: safeParse("freq-folders", []),
    folderId: "",
    mapOpen: false,
    carOpen: false,
    mapPts: [],
    filtersOpen: false,
    theme: localStorage.getItem("freq-theme") || "dark",
    forYou: [],
    nearList: [],
    homeAll: false,
  };
  function padPresets(arr) {
    const out = Array.isArray(arr) ? arr.slice(0, 6) : [];
    while (out.length < 6) out.push(null);
    return out;
  }

  function safeParse(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }
  function dict() {
    const pack = window.I18N || {};
    return pack[state.lang] || pack.fa || { dir: "rtl", htmlLang: "fa", title: "FREQ" };
  }
  function t(key) {
    const v = dict()[key];
    return typeof v === "function" ? v : v || key;
  }
  function applyI18n() {
    const d = dict();
    document.documentElement.lang = d.htmlLang;
    document.documentElement.dir = d.dir;
    document.title = d.title;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (typeof d[el.dataset.i18n] === "string") el.textContent = d[el.dataset.i18n];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = d[el.dataset.i18nPlaceholder] || "";
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const label = d[el.dataset.i18nAria];
      if (typeof label === "string") el.setAttribute("aria-label", label);
    });
    document.querySelectorAll("[data-lang]").forEach((b) => {
      b.classList.toggle("on", b.dataset.lang === state.lang);
    });
    renderCountries();
    renderGenres();
    renderLangs();
    renderSorts();
    renderSleep();
    renderBands();
    renderWaves();
    renderPresets();
    renderFolders();
    syncHdBtn();
    renderList();
    renderPlayer();
    syncAlarmUi();
    tickClock();
    applyTheme();
    syncFiltersBtn();
  }
  function setLang(lang) {
    state.lang = lang === "en" ? "en" : "fa";
    localStorage.setItem("freq-lang", state.lang);
    applyI18n();
  }

  async function getJSON(path) {
    let last = null;
    const tried = new Set();
    for (const h of [state.host, ...HOSTS]) {
      if (!h || tried.has(h)) continue;
      tried.add(h);
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;
      try {
        const res = await fetch(h + path, ctrl ? { signal: ctrl.signal } : {});
        if (!res.ok) throw new Error(String(res.status));
        state.host = h;
        return await res.json();
      } catch (e) {
        last = e;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
    throw last || new Error("radio api down");
  }

  function saveFavs() {
    localStorage.setItem("freq-favs", JSON.stringify(state.favs));
  }
  function isFav(uuid) {
    return state.favs.some((s) => s.stationuuid === uuid);
  }
  function toggleFav(station) {
    if (!station) return;
    if (isFav(station.stationuuid)) {
      state.favs = state.favs.filter((s) => s.stationuuid !== station.stationuuid);
    } else {
      state.favs = [station, ...state.favs].slice(0, 200);
    }
    saveFavs();
    renderPlayer();
    if (state.mode === "fav") {
      state.stations = state.favs.slice();
    }
    renderList();
  }
  function pushRecent(station) {
    state.recents = [station, ...state.recents.filter((s) => s.stationuuid !== station.stationuuid)].slice(0, 40);
    localStorage.setItem("freq-recents", JSON.stringify(state.recents));
    localStorage.setItem("freq-last", JSON.stringify(station));
  }

  async function loadStations(append) {
    if (state.loadingMore) return;
    if (state.mode === "fav" || state.mode === "recent" || state.mode === "folder") {
      if (state.mode === "folder") {
        const f = (state.folders || []).find(function (x) { return x.id === state.folderId; });
        const ids = (f && f.ids) || [];
        state.stations = ids.map(function (id) {
          return state.favs.find(function (s) { return s.stationuuid === id; })
            || state.recents.find(function (s) { return s.stationuuid === id; })
            || null;
        }).filter(Boolean);
      } else {
        state.stations = (state.mode === "fav" ? state.favs : state.recents).slice();
      }
      state.hasMore = false;
      renderCountries();
      renderGenres();
      renderFolders();
      renderList();
      return;
    }
    if (!append) state.offset = 0;
    state.loadingMore = true;
    try {
      const p = new URLSearchParams({
        hidebroken: "true",
        is_https: "true",
        limit: String(PAGE),
        offset: String(state.offset),
        order: state.sort,
        reverse: state.sort === "name" ? "false" : "true",
      });
      if (state.cc) p.set("countrycode", state.cc);
      if (state.tag) p.set("tag", state.tag);
      if (state.langFilter) p.set("language", state.langFilter);
      if (state.q.trim()) p.set("name", state.q.trim());
      if (state.hd) p.set("bitrateMin", "128");
      if (state.wave === "am" && !state.tag) p.set("tag", "news");
      if (state.wave === "sw" && !state.tag) p.set("tag", "world");
      let data = await getJSON(`/json/stations/search?${p}`);
      if (state.q.trim() && (!data || data.length < 12) && !append) {
        const p2 = new URLSearchParams(p);
        p2.delete("name");
        p2.set("tag", state.q.trim());
        const extra = await getJSON(`/json/stations/search?${p2}`).catch(() => []);
        const seen = new Set((data || []).map((s) => s.stationuuid));
        data = (data || []).concat((extra || []).filter((s) => !seen.has(s.stationuuid)));
      }
      const list = (data || []).filter((s) => {
        const url = s.url_resolved || s.url || "";
        if (!url.startsWith("https://")) return false;
        if ((state.hidden || []).indexOf(s.stationuuid) >= 0) return false;
        return true;
      });
      state.stations = append ? state.stations.concat(list) : list;
      state.hasMore = (data || []).length >= PAGE;
      state.offset += PAGE;
      renderCountries();
      renderGenres();
      renderLangs();
      renderList();
    } finally {
      state.loadingMore = false;
    }
  }

  function renderCountries() {
    const extra = [
      `<button type="button" class="${state.mode === "fav" ? "on" : ""}" data-mode="fav">${t("fav")}</button>`,
      `<button type="button" class="${state.mode === "recent" ? "on" : ""}" data-mode="recent">${t("recent")}</button>`,
      `<button type="button" data-here="1">${t("here")}</button>`,
    ].join("");
    $("countries").innerHTML =
      extra +
      COUNTRIES.map((c) => {
        const on = state.mode === "browse" && c.cc === state.cc ? "on" : "";
        const label = state.lang === "fa" ? c.fa : c.en;
        return `<button type="button" class="${on}" data-cc="${c.cc}">${label}</button>`;
      }).join("");
  }

  function renderGenres() {
    $("genres").innerHTML = GENRES.map((g) => {
      const on = state.mode === "browse" && g.tag === state.tag ? "on" : "";
      const label = state.lang === "fa" ? g.fa : g.en;
      return `<button type="button" class="${on}" data-tag="${g.tag}">${label}</button>`;
    }).join("");
  }
  function renderLangs() {
    $("langs").innerHTML = LANGS.map((g) => {
      const on = state.mode === "browse" && g.id === state.langFilter ? "on" : "";
      const label = state.lang === "fa" ? g.fa : g.en;
      return `<button type="button" class="${on}" data-langf="${g.id}">${label}</button>`;
    }).join("");
  }
  function flag(cc) {
    if (!cc || cc.length !== 2) return "";
    return [...cc.toUpperCase()].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
  }

  function renderSorts() {
    const opts = [
      ["clickcount", "popular"],
      ["votes", "votes"],
      ["name", "az"],
    ];
    $("sorts").innerHTML = opts
      .map(([id, key]) => `<button type="button" class="${state.sort === id ? "on" : ""}" data-sort="${id}">${t(key)}</button>`)
      .join("");
  }

  function renderSleep() {
    const box = $("sleep-chips");
    if (!box) return;
    box.innerHTML = [0, 15, 30, 60, 90]
      .map((m) => {
        const on = state.sleepMin === m ? "on" : "";
        const label = m ? String(m) : t("sleepOff");
        return `<button type="button" class="${on}" data-sleep="${m}">${label}</button>`;
      })
      .join("");
  }

  function stationCard(s, rail) {
    const on = state.current && s.stationuuid === state.current.stationuuid ? "on" : "";
    const ico = s.favicon
      ? `<img src="${s.favicon}" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=ph></div>'">`
      : `<div class="ph"></div>`;
    const tags = (s.tags || "").split(",").filter(Boolean).slice(0, 2).join(" · ");
    const fl = flag(s.countrycode);
    if (rail) {
      return `<button type="button" class="rail-card ${on}" data-play="${s.stationuuid}">
        ${ico}
        <div class="nm">${esc((s.name || "—").slice(0, 28))}</div>
        <div class="meta">${esc(s.country || "")}</div>
      </button>`;
    }
    return `<div class="card ${on}" data-id="${s.stationuuid}">
      ${ico}
      <button type="button" class="card-hit" data-play="${s.stationuuid}">
        <div class="nm">${fl ? fl + " " : ""}${esc(s.name || "—")}${s.bitrate >= 128 ? '<span class="badge-hd">HD</span>' : ""}</div>
        <div class="meta">${esc(s.country || "")} ${s.bitrate ? "· " + s.bitrate + "k" : ""} ${tags ? "· " + esc(tags) : ""}</div>
      </button>
      <button type="button" class="info" data-info="${s.stationuuid}">i</button>
    </div>`;
  }
  function isHome() {
    return (
      state.mode === "browse" &&
      !state.homeAll &&
      !state.q.trim() &&
      !state.tag &&
      !state.cc &&
      !state.langFilter
    );
  }
  function railBlock(title, items) {
    if (!items || !items.length) return "";
    return `<section class="rail">
      <div class="rail-top"><h3>${esc(title)}</h3>
      <button type="button" data-act="seeall">${t("seeall")}</button></div>
      <div class="rail-row">${items.slice(0, 10).map(function (s) { return stationCard(s, true); }).join("")}</div>
    </section>`;
  }
  function renderList() {
    const n = state.stations.length;
    const cfn = dict().count;
    $("count-line").textContent = typeof cfn === "function" ? cfn(n) : String(n);
    if (isHome()) {
      const cont = (state.recents || []).slice(0, 10);
      const you = (state.forYou || []).length ? state.forYou : state.stations.slice(8, 18);
      const trend = state.stations.slice(0, 10);
      const near = state.nearList || [];
      $("list").innerHTML =
        railBlock(t("continue"), cont) +
        railBlock(t("foryou"), you) +
        railBlock(t("near"), near) +
        railBlock(t("trending"), trend);
      return;
    }
    if (!state.stations.length) {
      $("list").innerHTML = `<div class="card">${t("empty")}</div>`;
      return;
    }
    const cards = state.stations.map(function (s) { return stationCard(s, false); }).join("");
    const more = state.hasMore ? `<button id="more" class="more" type="button">${t("more")}</button>` : "";
    $("list").innerHTML = cards + more;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function hashHue(str) {
    let h = 0;
    for (const c of String(str || "F")) h = (h * 33 + c.charCodeAt(0)) % 360;
    return h;
  }
  function fakeFreq(s) {
    let n = 0;
    for (const c of (s && (s.stationuuid || s.name)) || "F") n = (n * 31 + c.charCodeAt(0)) >>> 0;
    return (88 + (n % 199) / 10).toFixed(1) + " MHz";
  }
  function initials(name) {
    const parts = String(name || "F")
      .replace(/[^A-Za-z0-9\u0600-\u06FF\u0400-\u04FF]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const letters = (parts[0] ? parts[0][0] : "F") + (parts[1] ? parts[1][0] : "");
    return letters.toUpperCase();
  }
  function paintPh(el, station) {
    if (!el) return;
    const name = (station && station.name) || "FREQ";
    const h = hashHue(name);
    el.textContent = initials(name);
    el.style.background = `conic-gradient(from 200deg, hsl(${h} 80% 52%), hsl(${(h + 40) % 360} 70% 42%), #18181b, hsl(${h} 80% 52%))`;
  }
  function setArt(img, ph, station) {
    if (!img || !ph) return;
    const src = station && station.favicon;
    if (src) {
      img.onload = () => {
        img.hidden = false;
        ph.hidden = true;
      };
      img.onerror = () => {
        img.hidden = true;
        ph.hidden = false;
        paintPh(ph, station);
      };
      if (img.src !== src) img.src = src;
      else {
        img.hidden = false;
        ph.hidden = true;
      }
    } else {
      img.removeAttribute("src");
      img.hidden = true;
      ph.hidden = false;
      paintPh(ph, station);
    }
  }

  function listenElapsed() {
    const extra = state.playing && state.listenTick ? Date.now() - state.listenTick : 0;
    return state.listenMs + extra;
  }
  function fmtTime(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  function clockListen(on) {
    if (on) {
      if (!state.listenTick) state.listenTick = Date.now();
    } else if (state.listenTick) {
      state.listenMs += Date.now() - state.listenTick;
      state.listenTick = 0;
    }
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }
  function setNeedle(mhz) {
    const t = Math.min(1, Math.max(0, ((Number(mhz) || 96) - 88) / 20));
    const left = 6 + t * 88;
    ["p-needle", "s-needle"].forEach((id) => {
      const el = $(id);
      if (el) el.style.left = left + "%";
    });
  }
  function renderPlayer() {
    const s = state.current;
    const player = $("player");
    const stage = $("stage");
    if (!player) return;
    const fav = !!(s && isFav(s.stationuuid));
    const connecting = state.status === t("connecting");
    const failed = state.status === t("failed");

    player.classList.toggle("on", state.playing);
    player.classList.toggle("connecting", connecting);
    player.classList.toggle("failed", failed);
    if (stage) {
      stage.classList.toggle("open", state.stageOpen);
      stage.classList.toggle("on-air", state.playing);
      stage.setAttribute("aria-hidden", state.stageOpen ? "false" : "true");
    }
    document.body.classList.toggle("stage-open", state.stageOpen);
    document.querySelectorAll(".fav-btn").forEach((b) => b.classList.toggle("on", fav));

    const kick = state.status || t("onair");
    setText("p-kick", kick);
    setText("s-kick", kick);

    const toggleLabel = state.playing ? t("pause") : t("play");
    document.querySelectorAll("[data-act='toggle']").forEach((b) => b.setAttribute("aria-label", toggleLabel));

    const audio = $("audio");
    const vol = audio ? audio.volume : 0.85;
    setText("vol-n", String(Math.round(vol * 100)));
    const muteBtn = $("mute-btn");
    if (muteBtn) muteBtn.classList.toggle("muted", vol < 0.01);
    setText("s-time", fmtTime(listenElapsed()));
    updateSleepLeft();

    if (!s) {
      setText("p-name", "—");
      setText("s-name", "—");
      setText("p-sub", "");
      setText("s-sub", "");
      setText("p-freq", "");
      setText("s-freq", "");
      setNeedle(96);
      setRds(null);
      renderPresets();
      return;
    }

    const name = s.name || "—";
    setText("p-name", name);
    setText("s-name", name);
    const sub = [flag(s.countrycode), s.country, s.codec, s.bitrate ? s.bitrate + " kbps" : ""]
      .filter(Boolean)
      .join(" · ");
    setText("p-sub", sub);
    setText("s-sub", sub);
    const mhz = fakeFreq(s);
    state.mhz = parseFloat(mhz) || 96;
    setText("p-freq", mhz);
    setText("s-freq", mhz);
    setNeedle(state.mhz);
    setArt($("p-ico"), $("p-ph"), s);
    setArt($("s-ico"), $("s-ph"), s);
    if ($("p-vinyl")) $("p-vinyl").classList.toggle("live", state.playing);
    if ($("s-vinyl")) $("s-vinyl").classList.toggle("live", state.playing);
    setRds(s);
    renderPresets();
    setMediaSession(s);
    setText("car-name", name);
    setText("car-sub", sub);
    const car = $("car");
    if (car) car.classList.toggle("on-air", state.playing);
  }

  function updateSleepLeft() {
    const el = $("sleep-left");
    if (!el) return;
    if (!state.sleepAt) {
      el.textContent = "";
      return;
    }
    const left = Math.max(0, state.sleepAt - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    el.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function setMediaSession(s) {
    if (!("mediaSession" in navigator) || !s) return;
    try {
      const art = s.favicon ? [{ src: s.favicon, sizes: "96x96", type: "image/png" }] : [];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: s.name || "FREQ",
        artist: s.country || "FREQ",
        album: fakeFreq(s) + " · FREQ",
        artwork: art,
      });
      navigator.mediaSession.playbackState = state.playing ? "playing" : "paused";
    } catch (_) {}
  }

  function markCurrent() {
    document.querySelectorAll(".card[data-id]").forEach((el) => {
      el.classList.toggle("on", state.current && el.dataset.id === state.current.stationuuid);
    });
  }

  function play(station) {
    if (!station) return;
    const audio = $("audio");
    state.playGen = (state.playGen || 0) + 1;
    const gen = state.playGen;
    state.ignoreErr = true;
    state.current = station;
    state.status = t("connecting");
    state.playing = false;
    state.listenMs = 0;
    state.listenTick = 0;
    pushRecent(station);
    bumpStats(station);
    startStatic();
    audio.pause();
    audio.removeAttribute("src");
    audio.src = station.url_resolved || station.url || "";
    audio.load();
    getJSON(`/json/url/${station.stationuuid}`).catch(() => {});
    renderPlayer();
    markCurrent();
    const go = audio.play();
    if (go && go.then) {
      go.then(() => {
        if (gen !== state.playGen) return;
        state.ignoreErr = false;
        state.fails = 0;
        state.playing = true;
        state.status = "";
        stopStatic();
        if (state.scanning) {
          state.scanning = false;
          toast(t("tuned"));
        }
        if (state.alarmFade) {
          state.alarmFade = false;
          fadeVol(0.04, state.userVol || 0.85, 8000);
        }
        clockListen(true);
        renderPlayer();
        tickStand();
      }).catch(() => {
        if (gen !== state.playGen) return;
        state.ignoreErr = false;
        stopStatic();
        failSkip();
      });
    }
    setTimeout(() => {
      if (gen === state.playGen) state.ignoreErr = false;
    }, 400);
  }

  function failSkip() {
    state.fails = (state.fails || 0) + 1;
    state.playing = false;
    stopStatic();
    clockListen(false);
    state.status = t("failed");
    renderPlayer();
    if (state.fails < 4) setTimeout(() => playRel(1), 500);
  }

  function playRel(dir) {
    tickClick();
    const list = state.stations;
    if (!list.length) return;
    if (!state.current) {
      play(list[0]);
      return;
    }
    const i = list.findIndex((s) => s.stationuuid === state.current.stationuuid);
    const n = (i < 0 ? 0 : i + dir + list.length) % list.length;
    play(list[n]);
  }

  function playRandom() {
    const list = state.stations;
    if (!list.length) return;
    let pick = list[Math.floor(Math.random() * list.length)];
    if (state.current && list.length > 1) {
      while (pick.stationuuid === state.current.stationuuid) {
        pick = list[Math.floor(Math.random() * list.length)];
      }
    }
    play(pick);
  }

  function toggle() {
    const audio = $("audio");
    if (!state.current) {
      if (state.stations[0]) play(state.stations[0]);
      return;
    }
    if (state.playing) {
      audio.pause();
      state.playing = false;
      clockListen(false);
    } else {
      audio
        .play()
        .then(() => {
          state.playing = true;
          state.status = "";
          clockListen(true);
          renderPlayer();
        })
        .catch(() => failSkip());
    }
    renderPlayer();
  }

  function setVol(v, silent) {
    v = Math.min(1, Math.max(0, Number(v) || 0));
    if ($("audio")) $("audio").volume = v;
    if ($("vol")) $("vol").value = String(v);
    if (v > 0.01) state.prevVol = v;
    if (!silent) {
      state.userVol = v;
      try {
        localStorage.setItem("freq-vol", String(v));
      } catch (_) {}
    }
    setText("vol-n", String(Math.round(v * 100)));
    const muteBtn = $("mute-btn");
    if (muteBtn) muteBtn.classList.toggle("muted", v < 0.01);
  }
  function toggleMute() {
    const cur = $("audio").volume;
    if (cur < 0.01) setVol(state.prevVol || 0.85);
    else setVol(0);
  }
  function setSleep(m) {
    state.sleepMin = m;
    state.sleepAt = m ? Date.now() + m * 60000 : 0;
    renderSleep();
    updateSleepLeft();
  }

  function openStage() {
    state.stageOpen = true;
    const stage = $("stage");
    if (stage) {
      stage.hidden = false;
      stage.classList.add("open");
    }
    document.body.classList.add("stage-open");
    renderPlayer();
  }
  function closeStage() {
    state.stageOpen = false;
    const stage = $("stage");
    if (stage) {
      stage.classList.remove("open");
      stage.hidden = true;
    }
    document.body.classList.remove("stage-open");
    renderPlayer();
  }


  function hereCC() {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
    if (tz.indexOf("tehran") >= 0) return "IR";
    if (tz.indexOf("berlin") >= 0 || tz.indexOf("frankfurt") >= 0) return "DE";
    const map = {
      "asia/tehran": "IR",
      "europe/berlin": "DE",
      "europe/paris": "FR",
      "europe/london": "GB",
      "america/new_york": "US",
      "america/los_angeles": "US",
      "europe/istanbul": "TR",
      "asia/tokyo": "JP",
      "asia/dubai": "AE",
    };
    return map[tz] || "";
  }
  function goHere() {
    const cc = hereCC();
    state.mode = "browse";
    state.cc = cc;
    state.q = "";
    if ($("q")) $("q").value = "";
    loadStations().catch(function () {});
  }
  function renderBands() {
    const box = $("bands");
    if (!box) return;
    box.innerHTML = BANDS.map(function (g) {
      const on = state.mode === "browse" && g.tag === state.band ? "on" : "";
      const label = state.lang === "fa" ? g.fa : g.en;
      return '<button type="button" class="' + on + '" data-band="' + g.tag + '">' + label + "</button>";
    }).join("");
  }
  function renderPresets() {
    const html = state.presets
      .map(function (s, i) {
        const on = s && state.current && s.stationuuid === state.current.stationuuid ? "on" : "";
        const has = s ? "has" : "";
        const name = s ? (s.name || "P" + (i + 1)).slice(0, 10) : "P" + (i + 1);
        return (
          '<button type="button" class="' +
          on +
          " " +
          has +
          '" data-preset="' +
          i +
          '" title="' +
          esc(s ? s.name : t("emptyPreset")) +
          '">' +
          (i + 1) +
          (s ? " · " + esc(name) : "") +
          "</button>"
        );
      })
      .join("");
    ["presets", "s-presets"].forEach(function (id) {
      const el = $(id);
      if (el) el.innerHTML = html;
    });
  }
  function savePreset(i) {
    if (!state.current) return;
    state.presets[i] = state.current;
    try {
      localStorage.setItem("freq-presets", JSON.stringify(state.presets));
    } catch (_) {}
    renderPresets();
    toast(t("saved") + " P" + (i + 1));
  }
  function playPreset(i) {
    const s = state.presets[i];
    if (s) play(s);
    else toast(t("emptyPreset"));
  }
  let noise = { ctx: null, src: null };
  function startStatic() {
    stopStatic();
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const n = 2 * ctx.sampleRate;
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1400;
      const g = ctx.createGain();
      g.gain.value = 0.045;
      src.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      src.start();
      noise = { ctx: ctx, src: src };
    } catch (_) {}
  }
  function stopStatic() {
    try {
      if (noise.src) noise.src.stop();
    } catch (_) {}
    try {
      if (noise.ctx) noise.ctx.close();
    } catch (_) {}
    noise = { ctx: null, src: null };
  }
  function toast(msg) {
    const el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 1800);
  }
  function toJalali(d) {
    const gy = d.getFullYear();
    const gm = d.getMonth() + 1;
    const gd = d.getDate();
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    let gy2 = gy <= 1600 ? gy - 621 : gy - 1600;
    const gy2e = gm > 2 ? gy2 + 1 : gy2;
    let days =
      365 * gy2 +
      Math.floor((gy2e + 3) / 4) -
      Math.floor((gy2e + 99) / 100) +
      Math.floor((gy2e + 399) / 400) -
      80 +
      gd +
      g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return jy + "/" + String(jm).padStart(2, "0") + "/" + String(jd).padStart(2, "0");
  }
  function tickClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setText("s-clock", hh + ":" + mm);
    const date = state.lang === "fa" ? toJalali(now) : now.toISOString().slice(0, 10);
    setText("s-date", date);
    const st = dict().stats;
    if (typeof st === "function") {
      const hours = ((state.stats.ms || 0) / 3600000).toFixed(1);
      const n = Object.keys(state.stats.hits || {}).length;
      setText("s-stats", st(hours, n));
    }
    const stereo = $("lamp-stereo");
    const tuned = $("lamp-tuned");
    if (stereo) stereo.classList.toggle("on", !!state.playing);
    if (tuned) tuned.classList.toggle("on", !!state.playing && !state.status);
  }
  function bumpStats(station) {
    if (!state.stats.hits) state.stats.hits = {};
    if (station && station.stationuuid) state.stats.hits[station.stationuuid] = 1;
    try {
      localStorage.setItem("freq-stats", JSON.stringify(state.stats));
    } catch (_) {}
  }
  function flushListen() {
    if (state.playing && state.listenTick) {
      state.stats.ms = (state.stats.ms || 0) + 1000;
    }
  }
  function saveAlarm() {
    try {
      localStorage.setItem("freq-alarm", JSON.stringify(state.alarm));
    } catch (_) {}
  }
  function syncAlarmUi() {
    const on = $("alarm-on");
    const tm = $("alarm-time");
    if (on) on.checked = !!state.alarm.on;
    if (tm) {
      const hh = String(state.alarm.hh || 0).padStart(2, "0");
      const mm = String(state.alarm.mm || 0).padStart(2, "0");
      tm.value = hh + ":" + mm;
    }
  }
  function readAlarmUi() {
    const on = $("alarm-on");
    const tm = $("alarm-time");
    if (on) state.alarm.on = !!on.checked;
    if (tm && tm.value) {
      const p = tm.value.split(":");
      state.alarm.hh = Number(p[0]) || 0;
      state.alarm.mm = Number(p[1]) || 0;
    }
    saveAlarm();
  }
  function checkAlarm() {
    if (!state.alarm || !state.alarm.on) return;
    const now = new Date();
    if (now.getHours() !== Number(state.alarm.hh) || now.getMinutes() !== Number(state.alarm.mm)) return;
    const key = now.getFullYear() + "-" + now.getMonth() + "-" + now.getDate();
    if (state.alarm.last === key) return;
    state.alarm.last = key;
    saveAlarm();
    state.alarmFade = true;
    const s = state.presets[0] || state.current || state.favs[0] || state.stations[0];
    if (s) play(s);
    pingAlarm(s);
    openStand();
  }
  function stationUrl(s) {
    const base = location.origin + location.pathname.replace(/index\.html$/, "");
    return base + "?s=" + encodeURIComponent(s.stationuuid);
  }
  function shareStation(s) {
    if (!s) return;
    const url = stationUrl(s);
    const title = (s.name || "FREQ") + " — FREQ";
    if (navigator.share) {
      navigator.share({ title: title, text: title, url: url }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        toast(t("shared"));
      });
    } else {
      toast(url);
    }
  }
  function voteStation(s) {
    if (!s) return;
    getJSON("/json/vote/" + s.stationuuid)
      .then(function () {
        toast(t("voted"));
      })
      .catch(function () {
        toast(t("voted"));
      });
  }
  function exportFavs() {
    const blob = new Blob(
      [JSON.stringify({ favs: state.favs, presets: state.presets, folders: state.folders, v: 2 }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "freq-favs.json";
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 500);
  }
  function importFavs(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        if (Array.isArray(data.favs)) {
          state.favs = data.favs.slice(0, 200);
          saveFavs();
        }
        if (Array.isArray(data.presets)) {
          state.presets = padPresets(data.presets);
          localStorage.setItem("freq-presets", JSON.stringify(state.presets));
        }
        if (Array.isArray(data.folders)) {
          state.folders = data.folders;
          saveFolders();
          renderFolders();
        }
        renderPresets();
        renderList();
        toast(t("fav"));
      } catch (_) {}
    };
    reader.readAsText(file);
  }
  function openHelp() {
    const el = $("help");
    if (el) el.hidden = false;
  }
  function closeHelp() {
    const el = $("help");
    if (el) el.hidden = true;
  }
  function setRds(s) {
    const tags = s && s.tags ? String(s.tags).split(",").filter(Boolean).slice(0, 8).join("  ·  ") : "";
    const line = s ? [s.name, s.country, s.codec, tags].filter(Boolean).join("   ·   ") : "";
    setText("p-rds", line);
    setText("s-rds", line);
  }
  async function applyDeepLink() {
    const sid = new URLSearchParams(location.search).get("s");
    if (!sid) return;
    let s = findStation(sid);
    if (!s) {
      try {
        const data = await getJSON("/json/stations/byuuid/" + encodeURIComponent(sid));
        if (data && data[0]) s = data[0];
      } catch (_) {}
    }
    if (s) play(s);
  }


  function renderWaves() {
    const box = $("waves");
    if (!box) return;
    box.innerHTML = ["am", "fm", "sw"]
      .map(function (id) {
        const on = state.wave === id ? "on" : "";
        return '<button type="button" class="' + on + '" data-wave="' + id + '">' + t(id) + "</button>";
      })
      .join("");
  }
  function setWave(id) {
    state.wave = id === "am" || id === "sw" ? id : "fm";
    try {
      localStorage.setItem("freq-wave", state.wave);
    } catch (_) {}
    renderWaves();
    if (state.mode === "browse") loadStations().catch(function () {});
    tickClick();
  }
  function syncHdBtn() {
    const b = $("hd-btn");
    if (b) b.classList.toggle("on", !!state.hd);
  }
  function toggleHd() {
    state.hd = !state.hd;
    try {
      localStorage.setItem("freq-hd", state.hd ? "1" : "0");
    } catch (_) {}
    syncHdBtn();
    if (state.mode === "browse") loadStations().catch(function () {});
  }
  function hideStation(s) {
    if (!s) return;
    if ((state.hidden || []).indexOf(s.stationuuid) < 0) state.hidden.push(s.stationuuid);
    try {
      localStorage.setItem("freq-hidden", JSON.stringify(state.hidden));
    } catch (_) {}
    state.stations = state.stations.filter(function (x) {
      return x.stationuuid !== s.stationuuid;
    });
    renderList();
    toast(t("hidden"));
    if ($("sheet")) $("sheet").hidden = true;
  }
  function startScan() {
    if (state.scanning) {
      state.scanning = false;
      return;
    }
    if (!state.stations.length) return;
    state.scanning = true;
    state.scanGen = (state.scanGen || 0) + 1;
    const gen = state.scanGen;
    toast(t("scanning"));
    function step() {
      if (!state.scanning || gen !== state.scanGen) return;
      playRel(1);
      setTimeout(function () {
        if (!state.scanning || gen !== state.scanGen) return;
        if (state.playing && !state.status) {
          state.scanning = false;
          toast(t("tuned"));
        } else step();
      }, 2600);
    }
    step();
  }
  function fadeVol(from, to, ms) {
    const audio = $("audio");
    if (!audio) return;
    if (state.fadeIv) clearInterval(state.fadeIv);
    audio.volume = from;
    const t0 = Date.now();
    state.fadeIv = setInterval(function () {
      const p = Math.min(1, (Date.now() - t0) / ms);
      audio.volume = from + (to - from) * p;
      if (p >= 1) {
        clearInterval(state.fadeIv);
        state.fadeIv = 0;
      }
    }, 80);
  }
  function sleepTick() {
    if (!state.sleepAt) return;
    const left = state.sleepAt - Date.now();
    if (left <= 0) {
      state.sleepAt = 0;
      state.sleepMin = 0;
      renderSleep();
      const audio = $("audio");
      if (audio) audio.pause();
      setVol(state.userVol || 0.85, true);
      return;
    }
    if (left < 45000) {
      const v = (state.userVol || 0.85) * (left / 45000);
      if ($("audio")) $("audio").volume = Math.max(0.02, v);
    }
  }
  function snooze() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 9);
    state.alarm.on = true;
    state.alarm.hh = now.getHours();
    state.alarm.mm = now.getMinutes();
    state.alarm.last = "";
    saveAlarm();
    syncAlarmUi();
    const audio = $("audio");
    if (audio) audio.pause();
    toast(t("snooze"));
  }
  function openStand() {
    state.night = true;
    const el = $("stand");
    if (el) el.hidden = false;
    document.body.classList.add("stand-on");
    tickStand();
  }
  function closeStand() {
    state.night = false;
    const el = $("stand");
    if (el) el.hidden = true;
    document.body.classList.remove("stand-on");
  }
  function toggleStand() {
    if (state.night) closeStand();
    else openStand();
  }
  function tickStand() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setText("stand-clock", hh + ":" + mm);
    setText(
      "stand-date",
      state.lang === "fa" ? toJalali(now) : now.toISOString().slice(0, 10)
    );
    setText("stand-wx", state.weather || "");
    setText("stand-st", (state.current && state.current.name) || "FREQ");
    setText("s-wx", state.weather || "");
  }
  function tickClick() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 180;
      g.gain.value = 0.03;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      o.stop(ctx.currentTime + 0.06);
      setTimeout(function () {
        ctx.close();
      }, 120);
    } catch (_) {}
  }
  async function loadWeather() {
    let lat = 50.1109;
    let lon = 8.6821;
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
    if (tz.indexOf("tehran") >= 0) {
      lat = 35.6892;
      lon = 51.389;
    }
    try {
      if (navigator.geolocation) {
        const pos = await new Promise(function (res, rej) {
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 2500, maximumAge: 600000 });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      }
    } catch (_) {}
    try {
      const url =
        "https://api.open-meteo.com/v1/forecast?latitude=" +
        lat +
        "&longitude=" +
        lon +
        "&current=temperature_2m,weather_code";
      const j = await fetch(url).then(function (r) {
        return r.json();
      });
      const temp = Math.round((j.current && j.current.temperature_2m) || 0);
      const code = (j.current && j.current.weather_code) || 0;
      const sky =
        code === 0 ? (state.lang === "fa" ? "آفتابی" : "clear") :
        code < 4 ? (state.lang === "fa" ? "کمی ابری" : "partly cloudy") :
        code < 50 ? (state.lang === "fa" ? "ابری" : "cloudy") :
        code < 70 ? (state.lang === "fa" ? "باران" : "rain") :
        code < 80 ? (state.lang === "fa" ? "برف" : "snow") :
        state.lang === "fa" ? "رعد" : "storm";
      state.weather = temp + "° · " + sky;
      tickStand();
    } catch (_) {}
  }
  function shareTelegram(st) {
    if (!st) return;
    const url =
      "https://t.me/share/url?url=" +
      encodeURIComponent(stationUrl(st)) +
      "&text=" +
      encodeURIComponent((st.name || "FREQ") + " — FREQ");
    window.open(url, "_blank", "noopener");
  }


  function saveFolders() {
    try { localStorage.setItem("freq-folders", JSON.stringify(state.folders || [])); } catch (_) {}
  }
  function renderFolders() {
    const box = $("folders");
    if (!box) return;
    const items = (state.folders || []).map(function (f) {
      const on = state.mode === "folder" && state.folderId === f.id ? "on" : "";
      return '<button type="button" class="' + on + '" data-folder="' + f.id + '">' + esc(f.name) + "</button>";
    }).join("");
    box.innerHTML = items;
  }
  function newFolder() {
    const inp = $("folder-name");
    const name = ((inp && inp.value) || "").trim();
    if (!name) { toast(t("folderPh")); return; }
    const id = "f" + Date.now().toString(36);
    state.folders = (state.folders || []).concat([{ id: id, name: name, ids: [] }]).slice(-20);
    saveFolders();
    if (inp) inp.value = "";
    renderFolders();
    toast(t("saved"));
  }
  function addToFolder() {
    if (!state.current) return;
    const list = state.folders || [];
    if (!list.length) { toast(t("noFolder")); return; }
    const f = list.find(function (x) { return x.id === state.folderId; }) || list[0];
    if (f.ids.indexOf(state.current.stationuuid) < 0) f.ids.push(state.current.stationuuid);
    if (!isFav(state.current.stationuuid)) {
      state.favs = [state.current].concat(state.favs).slice(0, 200);
      saveFavs();
    }
    saveFolders();
    renderFolders();
    toast(t("addedFolder"));
  }
  function openFolder(id) {
    state.mode = "folder";
    state.folderId = id;
    loadStations().catch(function () {});
  }
  function toggleMap() {
    if (state.mapOpen) closeMap();
    else openMap();
  }
  function closeMap() {
    state.mapOpen = false;
    const el = $("map");
    if (el) el.hidden = true;
  }
  async function openMap() {
    state.mapOpen = true;
    closeCar();
    const el = $("map");
    if (el) el.hidden = false;
    await loadMapPts();
    drawMap();
  }
  async function loadMapPts() {
    let pts = (state.stations || []).filter(function (s) {
      return s.geo_lat && s.geo_long;
    }).map(function (s) {
      return { lat: Number(s.geo_lat), lon: Number(s.geo_long), s: s };
    });
    if (pts.length < 40) {
      try {
        const extra = await getJSON("/json/stations/search?hidebroken=true&is_https=true&has_geo_info=true&limit=300&order=clickcount&reverse=true");
        const seen = {};
        pts.forEach(function (p) { seen[p.s.stationuuid] = 1; });
        (extra || []).forEach(function (st) {
          if (seen[st.stationuuid] || !st.geo_lat) return;
          pts.push({ lat: Number(st.geo_lat), lon: Number(st.geo_long), s: st });
        });
      } catch (_) {}
    }
    state.mapPts = pts.slice(0, 400);
  }
  function drawMap() {
    const c = $("map-c");
    if (!c || !c.getContext) return;
    const ctx = c.getContext("2d");
    const host = c.parentElement;
    const w = (host && host.clientWidth) || innerWidth;
    const h = Math.max(280, ((host && host.clientHeight) || innerHeight) - 90);
    c.width = w * devicePixelRatio;
    c.height = h * devicePixelRatio;
    c.style.width = w + "px";
    c.style.height = h + "px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    for (let x = 0; x <= 12; x++) {
      ctx.beginPath(); ctx.moveTo((x / 12) * w, 0); ctx.lineTo((x / 12) * w, h); ctx.stroke();
    }
    for (let y = 0; y <= 6; y++) {
      ctx.beginPath(); ctx.moveTo(0, (y / 6) * h); ctx.lineTo(w, (y / 6) * h); ctx.stroke();
    }
    (state.mapPts || []).forEach(function (pt) {
      const x = ((pt.lon + 180) / 360) * w;
      const y = ((90 - pt.lat) / 180) * h;
      const on = state.current && pt.s.stationuuid === state.current.stationuuid;
      ctx.beginPath();
      ctx.arc(x, y, on ? 5 : 2.2, 0, Math.PI * 2);
      ctx.fillStyle = on ? "#ff4d2e" : "rgba(125,211,252,0.7)";
      ctx.fill();
    });
  }
  function hitMap(ev) {
    const c = $("map-c");
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    let best = null;
    let bestD = 18;
    (state.mapPts || []).forEach(function (pt) {
      const px = ((pt.lon + 180) / 360) * r.width;
      const py = ((90 - pt.lat) / 180) * r.height;
      const d = Math.hypot(px - x, py - y);
      if (d < bestD) { bestD = d; best = pt; }
    });
    if (best) play(best.s);
  }
  function toggleCar() {
    if (state.carOpen) closeCar();
    else openCar();
  }
  function openCar() {
    state.carOpen = true;
    closeMap();
    const el = $("car");
    if (el) el.hidden = false;
    renderPlayer();
  }
  function closeCar() {
    state.carOpen = false;
    const el = $("car");
    if (el) el.hidden = true;
  }


  function applyTheme() {
    const th = state.theme || "dark";
    document.documentElement.setAttribute("data-theme", th);
    try { localStorage.setItem("freq-theme", th); } catch (_) {}
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", th === "light" ? "#f4f4f5" : "#09090b");
  }
  function cycleTheme() {
    const order = ["dark", "oled", "light"];
    const i = order.indexOf(state.theme);
    state.theme = order[(i + 1) % order.length];
    applyTheme();
    toast(t("theme") + " · " + state.theme);
  }
  function syncFiltersBtn() {
    const b = $("filters-btn");
    const box = $("filters");
    if (b) b.classList.toggle("on", !!state.filtersOpen);
    if (box) box.hidden = !state.filtersOpen;
  }
  function toggleFilters() {
    state.filtersOpen = !state.filtersOpen;
    syncFiltersBtn();
  }
  async function loadDiscover() {
    const bag = {};
    (state.recents || []).concat(state.favs || []).forEach(function (s) {
      String(s.tags || "").split(",").forEach(function (raw) {
        const tag = raw.trim();
        if (tag) bag[tag] = (bag[tag] || 0) + 1;
      });
    });
    const top = Object.keys(bag).sort(function (a, b) { return bag[b] - bag[a]; })[0];
    if (!top) return;
    try {
      const data = await getJSON("/json/stations/search?hidebroken=true&is_https=true&limit=16&order=clickcount&reverse=true&tag=" + encodeURIComponent(top));
      state.forYou = (data || []).filter(function (s) {
        return (s.url_resolved || s.url || "").startsWith("https://");
      });
      if (isHome()) renderList();
    } catch (_) {}
  }
  async function loadNear() {
    let lat = 50.1109, lon = 8.6821;
    try {
      if (navigator.geolocation) {
        const pos = await new Promise(function (res, rej) {
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 2500, maximumAge: 600000 });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      }
    } catch (_) {
      const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
      if (tz.indexOf("tehran") >= 0) { lat = 35.6892; lon = 51.389; }
    }
    try {
      const data = await getJSON("/json/stations/search?hidebroken=true&is_https=true&has_geo_info=true&limit=200&order=clickcount&reverse=true");
      const list = (data || []).filter(function (s) {
        return s.geo_lat && (s.url_resolved || s.url || "").startsWith("https://");
      }).map(function (s) {
        const dlat = Number(s.geo_lat) - lat;
        const dlon = Number(s.geo_long) - lon;
        s._d = dlat * dlat + dlon * dlon;
        return s;
      }).sort(function (a, b) { return a._d - b._d; }).slice(0, 16);
      state.nearList = list;
      if (isHome()) renderList();
    } catch (_) {}
  }
  function goNear() {
    state.mode = "browse";
    state.homeAll = false;
    if (state.nearList && state.nearList.length) {
      state.stations = state.nearList.slice();
      state.hasMore = false;
      renderList();
      toast(t("near"));
    } else {
      loadNear().then(function () {
        if (state.nearList.length) {
          state.stations = state.nearList.slice();
          renderList();
        }
      });
    }
  }
  function pingAlarm(s) {
    try {
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;
      new Notification("FREQ", {
        body: (s && s.name) || t("alarm"),
        icon: "./assets/icon-192.png",
        tag: "freq-alarm",
      });
    } catch (_) {}
  }

  function viz() {
    const c = $("viz");
    if (!c || !c.getContext) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let t = 0;
    const motes = Array.from({ length: 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.4,
      s: 0.15 + Math.random() * 0.4,
    }));
    function resize() {
      c.width = innerWidth * devicePixelRatio;
      c.height = innerHeight * devicePixelRatio;
      c.style.width = innerWidth + "px";
      c.style.height = innerHeight + "px";
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    addEventListener("resize", resize);
    function frame() {
      t += state.playing ? 0.018 : 0.006;
      const w = innerWidth;
      const h = innerHeight;
      ctx.fillStyle = "rgba(9,9,11,0.22)";
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h * 0.38;
      const lamp = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.55);
      lamp.addColorStop(0, state.playing ? "rgba(255,77,46,0.14)" : "rgba(125,211,252,0.06)");
      lamp.addColorStop(1, "rgba(9,9,11,0)");
      ctx.fillStyle = lamp;
      ctx.fillRect(0, 0, w, h);
      for (let i = 7; i >= 1; i--) {
        const r = 28 + i * 38 + Math.sin(t * 1.4 + i) * (state.playing ? 10 : 3);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 ? `rgba(255,77,46,${0.05 + i * 0.02})` : `rgba(125,211,252,${0.04 + i * 0.015})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 7 + (state.playing ? 3 : 0), 0, Math.PI * 2);
      ctx.fillStyle = state.playing ? "#ff4d2e" : "#7dd3fc";
      ctx.shadowColor = state.playing ? "#ff4d2e" : "#7dd3fc";
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      motes.forEach((m) => {
        m.y -= m.s * 0.00035;
        if (m.y < 0) m.y = 1;
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    frame();
  }

  function playerWave() {
    const c = $("p-wave");
    if (!c) return;
    const ctx = c.getContext("2d");
    let t = 0;
    function resize() {
      const r = c.parentElement.getBoundingClientRect();
      c.width = Math.max(1, r.width) * devicePixelRatio;
      c.height = 26 * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    addEventListener("resize", resize);
    function frame() {
      t += state.playing ? 0.09 : 0.02;
      const w = c.width / devicePixelRatio;
      const h = 26;
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const amp = state.playing ? 7.5 : 2.2;
        const y =
          h * 0.55 +
          Math.sin(x * 0.045 + t) * amp +
          Math.sin(x * 0.11 + t * 1.7) * (amp * 0.45);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(125,211,252,0)");
      g.addColorStop(0.2, "rgba(125,211,252,0.55)");
      g.addColorStop(0.55, "rgba(255,77,46,0.8)");
      g.addColorStop(1, "rgba(125,211,252,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      requestAnimationFrame(frame);
    }
    frame();
  }

  function stageRing() {
    const c = $("s-ring");
    if (!c) return;
    const ctx = c.getContext("2d");
    let t = 0;
    function resize() {
      const box = c.getBoundingClientRect();
      const s = Math.max(1, box.width);
      c.width = s * devicePixelRatio;
      c.height = s * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    addEventListener("resize", resize);
    function frame() {
      t += state.playing ? 0.05 : 0.012;
      const w = c.width / devicePixelRatio;
      const cx = w / 2;
      const cy = w / 2;
      ctx.clearRect(0, 0, w, w);
      const bars = 64;
      const r0 = w * 0.42;
      for (let i = 0; i < bars; i++) {
        const a = (i / bars) * Math.PI * 2 - Math.PI / 2 + t * 0.15;
        const pulse = state.playing
          ? 10 + Math.abs(Math.sin(t * 3 + i * 0.45)) * 18 + Math.abs(Math.sin(t * 1.4 + i)) * 8
          : 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * (r0 + pulse), cy + Math.sin(a) * (r0 + pulse));
        ctx.strokeStyle = i % 2 ? "rgba(255,77,46,0.72)" : "rgba(125,211,252,0.5)";
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r0 - 6, 0, Math.PI * 2);
      ctx.strokeStyle = state.playing ? "rgba(255,77,46,0.35)" : "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.stroke();
      requestAnimationFrame(frame);
    }
    frame();
  }

  function findStation(id) {
    return (
      state.stations.find((x) => x.stationuuid === id) ||
      state.favs.find((x) => x.stationuuid === id) ||
      state.recents.find((x) => x.stationuuid === id) ||
      (state.presets || []).find((x) => x && x.stationuuid === id) ||
      (state.current && state.current.stationuuid === id ? state.current : null)
    );
  }
  function openSheet(s) {
    state.sheet = s;
    $("sheet").hidden = false;
    $("sh-name").textContent = s.name || "—";
    $("sh-meta").textContent = [
      flag(s.countrycode),
      s.country,
      s.codec,
      s.bitrate ? s.bitrate + " kbps" : "",
      s.votes != null ? t("votes") + " " + s.votes : "",
    ]
      .filter(Boolean)
      .join(" · ");
    $("sh-tags").textContent = (s.tags || "").split(",").filter(Boolean).slice(0, 8).join(" · ");
    if (s.favicon) $("sh-ico").src = s.favicon;
    const home = s.homepage && /^https?:/i.test(s.homepage) ? s.homepage : "";
    $("sh-home").hidden = !home;
    if (home) $("sh-home").href = home;
  }

  function bind() {
    document.querySelectorAll("[data-lang]").forEach((b) => {
      b.addEventListener("click", () => setLang(b.dataset.lang));
    });
    const foldersEl = $("folders");
    if (foldersEl) {
      foldersEl.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-folder]");
        if (!btn) return;
        openFolder(btn.dataset.folder);
      });
    }
    const mapc = $("map-c");
    if (mapc) {
      mapc.addEventListener("click", hitMap);
      addEventListener("resize", function () { if (state.mapOpen) drawMap(); });
    }
    $("countries").addEventListener("click", (e) => {
      if (e.target.closest("[data-here]")) {
        goHere();
        return;
      }
      const modeBtn = e.target.closest("[data-mode]");
      if (modeBtn) {
        state.mode = modeBtn.dataset.mode;
        loadStations().catch(() => {});
        return;
      }
      const btn = e.target.closest("[data-cc]");
      if (!btn) return;
      state.mode = "browse";
      state.cc = btn.dataset.cc;
      state.homeAll = !!btn.dataset.cc;
      state.q = "";
      $("q").value = "";
      loadStations().catch(() => {});
    });
    $("genres").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tag]");
      if (!btn) return;
      state.mode = "browse";
      state.tag = btn.dataset.tag;
      loadStations().catch(() => {});
    });
    const waves = $("waves");
    if (waves) {
      waves.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-wave]");
        if (!btn) return;
        setWave(btn.dataset.wave);
      });
    }
    if ($("sh-hide"))
      $("sh-hide").addEventListener("click", function () {
        hideStation(state.sheet || state.current);
      });
    const bands = $("bands");
    if (bands) {
      bands.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-band]");
        if (!btn) return;
        state.mode = "browse";
        state.band = btn.dataset.band || "";
        state.tag = state.band;
        loadStations().catch(function () {});
        renderBands();
      });
    }
    $("langs").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-langf]");
      if (!btn) return;
      state.mode = "browse";
      state.langFilter = btn.dataset.langf;
      loadStations().catch(() => {});
    });
    $("sorts").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sort]");
      if (!btn) return;
      state.sort = btn.dataset.sort;
      localStorage.setItem("freq-sort", state.sort);
      renderSorts();
      if (state.mode === "browse") loadStations().catch(() => {});
    });
    $("search-form").addEventListener("submit", (e) => {
      e.preventDefault();
      state.q = $("q").value || "";
      state.mode = "browse";
      state.homeAll = !!state.q.trim();
      loadStations().catch(() => {});
    });
    let searchT = 0;
    if ($("q")) {
      $("q").addEventListener("input", function () {
        clearTimeout(searchT);
        searchT = setTimeout(function () {
          state.q = $("q").value || "";
          state.mode = "browse";
          state.homeAll = !!state.q.trim();
          loadStations().catch(function () {});
        }, 380);
      });
    }
    $("list").addEventListener("click", (e) => {
      if (e.target.closest("#more")) {
        loadStations(true).catch(() => {});
        return;
      }
      const info = e.target.closest("[data-info]");
      if (info) {
        const s = findStation(info.dataset.info);
        if (s) openSheet(s);
        return;
      }
      const hit = e.target.closest("[data-play], [data-id]");
      if (!hit) return;
      const id = hit.dataset.play || hit.dataset.id;
      const s = findStation(id);
      if (s) play(s);
    });
    $("list").addEventListener("scroll", () => {
      const el = $("list");
      if (el.scrollTop + el.clientHeight > el.scrollHeight - 240) {
        if (state.hasMore && !state.loadingMore && state.mode === "browse") {
          loadStations(true).catch(() => {});
        }
      }
    });
    $("sheet-x").addEventListener("click", () => {
      $("sheet").hidden = true;
    });
    $("sh-play").addEventListener("click", () => {
      if (state.sheet) play(state.sheet);
    });
    if ($("sh-share"))
      $("sh-share").addEventListener("click", () => {
        shareStation(state.sheet || state.current);
      });
    if ($("sh-vote"))
      $("sh-vote").addEventListener("click", () => {
        voteStation(state.sheet || state.current);
      });
    if ($("help-close")) $("help-close").addEventListener("click", closeHelp);
    if ($("help"))
      $("help").addEventListener("click", (e) => {
        if (e.target.id === "help") closeHelp();
      });
    if ($("alarm-on")) $("alarm-on").addEventListener("change", function () {
      readAlarmUi();
      if (state.alarm.on && typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission().catch(function () {});
      }
    });
    addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      window._freqPrompt = e;
      const b = $("install-btn");
      if (b) b.hidden = false;
    });
    if ($("alarm-time")) $("alarm-time").addEventListener("change", readAlarmUi);
    if ($("import-file"))
      $("import-file").addEventListener("change", (e) => {
        const f = e.target.files && e.target.files[0];
        importFavs(f);
        e.target.value = "";
      });
    $("sh-similar").addEventListener("click", () => {
      const tag = ((state.sheet && state.sheet.tags) || "").split(",")[0];
      if (!tag) return;
      state.mode = "browse";
      state.tag = tag.trim();
      state.q = "";
      $("q").value = "";
      $("sheet").hidden = true;
      loadStations().catch(() => {});
    });

    function onAct(e) {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "toggle") toggle();
      else if (act === "prev") playRel(-1);
      else if (act === "next") playRel(1);
      else if (act === "rand") playRandom();
      else if (act === "fav") toggleFav(state.current);
      else if (act === "expand") openStage();
      else if (act === "collapse") closeStage();
      else if (act === "mute") toggleMute();
      else if (act === "share") shareStation(state.current);
      else if (act === "vote") voteStation(state.current);
      else if (act === "export") exportFavs();
      else if (act === "import") {
        const f = $("import-file");
        if (f) f.click();
      }
      else if (act === "help") openHelp();
      else if (act === "scan") startScan();
      else if (act === "stand") toggleStand();
      else if (act === "snooze") snooze();
      else if (act === "hd") toggleHd();
      else if (act === "tg") shareTelegram(state.current);
      else if (act === "map") toggleMap();
      else if (act === "car") toggleCar();
      else if (act === "newfolder") newFolder();
      else if (act === "addfolder") addToFolder();
      else if (act === "filters") toggleFilters();
      else if (act === "near") goNear();
      else if (act === "theme") cycleTheme();
      else if (act === "seeall") { state.homeAll = true; renderList(); }
      else if (act === "install") {
        if (window._freqPrompt) {
          window._freqPrompt.prompt();
          window._freqPrompt = null;
          const b = $("install-btn");
          if (b) b.hidden = true;
        }
      }
    }
    document.addEventListener("click", onAct);
    document.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-preset]");
      if (!btn) return;
      if (savedHold) {
        savedHold = false;
        e.preventDefault();
        return;
      }
      playPreset(Number(btn.dataset.preset));
    });
    let holdT = 0;
    let savedHold = false;
    document.addEventListener("pointerdown", function (e) {
      const btn = e.target.closest("[data-preset]");
      if (!btn) return;
      const i = Number(btn.dataset.preset);
      savedHold = false;
      holdT = setTimeout(function () {
        savePreset(i);
        savedHold = true;
        holdT = 0;
      }, 650);
    });
    document.addEventListener("pointerup", function () {
      if (holdT) clearTimeout(holdT);
      holdT = 0;
    });
    document.addEventListener("pointercancel", function () {
      if (holdT) clearTimeout(holdT);
      holdT = 0;
    });
    const chips = $("sleep-chips");
    if (chips) {
      chips.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-sleep]");
        if (!btn) return;
        setSleep(Number(btn.dataset.sleep));
      });
    }
    const volEl = $("vol");
    if (volEl) volEl.addEventListener("input", (e) => setVol(e.target.value));

    let sy = 0;
    let swipeOk = false;
    const stageEl = $("stage");
    if (stageEl) {
      stageEl.addEventListener(
        "touchstart",
        (e) => {
          sy = e.touches[0].clientY;
          swipeOk = sy < 90;
        },
        { passive: true }
      );
      stageEl.addEventListener(
        "touchend",
        (e) => {
          if (!swipeOk) return;
          const dy = e.changedTouches[0].clientY - sy;
          if (dy > 110) closeStage();
        },
        { passive: true }
      );
    }

    $("audio").addEventListener("pause", () => {
      if (state.ignoreErr) return;
      state.playing = false;
      clockListen(false);
      renderPlayer();
    });
    $("audio").addEventListener("play", () => {
      state.playing = true;
      state.status = "";
      clockListen(true);
      renderPlayer();
    });
    $("audio").addEventListener("error", () => {
      if (state.ignoreErr) return;
      failSkip();
    });
    $("about-btn").addEventListener("click", () => {
      $("about").hidden = false;
    });
    $("about-close").addEventListener("click", () => {
      $("about").hidden = true;
    });
    $("about").addEventListener("click", (e) => {
      if (e.target.id === "about") $("about").hidden = true;
    });
    addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") {
        closeStage();
        closeHelp();
        closeStand();
        closeMap();
        closeCar();
      }
      if (e.key === "n" || e.key === "N") playRel(1);
      if (e.key === "p" || e.key === "P") playRel(-1);
      if (e.key === "r" || e.key === "R") playRandom();
      if (e.key === "f" || e.key === "F") toggleFav(state.current);
      if (e.key === "s" || e.key === "S") shareStation(state.current);
      if (e.key === "?" || e.key === "h" || e.key === "H") {
        if (e.key === "h" || e.key === "H") goHere();
        else openHelp();
      }
      if (e.key === "?") openHelp();
      if (e.key >= "1" && e.key <= "6") {
        const i = Number(e.key) - 1;
        if (e.shiftKey) savePreset(i);
        else playPreset(i);
      }
      if (e.key === "k" || e.key === "K") startScan();
      if (e.key === "c" || e.key === "C") toggleStand();
      if (e.key === "m" || e.key === "M") toggleMap();
      if (e.key === "v" || e.key === "V") toggleCar();
    });
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", () => {
          if (!state.playing) toggle();
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          if (state.playing) toggle();
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => playRel(1));
        navigator.mediaSession.setActionHandler("previoustrack", () => playRel(-1));
      } catch (_) {}
    }
    setInterval(() => {
      sleepTick();
      if (state.playing || state.sleepAt) {
        if ($("s-time")) $("s-time").textContent = fmtTime(listenElapsed());
        updateSleepLeft();
      }
      if (state.playing) {
        flushListen();
        try {
          localStorage.setItem("freq-stats", JSON.stringify(state.stats));
        } catch (_) {}
      }
      tickClock();
      tickStand();
      checkAlarm();
    }, 1000);
  }

  function hideLoader() {
    const el = $("loader");
    if (el) el.classList.add("off");
  }
  async function boot() {
    try {
      applyI18n();
      bind();
      viz();
      playerWave();
      stageRing();
      const vol = Number(localStorage.getItem("freq-vol") || "0.85");
      setVol(Number.isFinite(vol) ? vol : 0.85);
      if (state.current) renderPlayer();
    } catch (err) {
      const sub = $("load-sub");
      if (sub) sub.textContent = String(err && err.message ? err.message : err);
    }
    setTimeout(hideLoader, 12000);
    try {
      await loadStations();
      renderPlayer();
      renderPresets();
      tickClock();
      await applyDeepLink();
      loadWeather().catch(function () {});
      loadDiscover().catch(function () {});
      loadNear().catch(function () {});
      applyTheme();
      if (navigator.serviceWorker) {
        navigator.serviceWorker.register("./sw.js").catch(function () {});
      }
    } catch (err) {
      const line = $("count-line");
      if (line) line.textContent = String(err && err.message ? err.message : err);
      if (!state.stations.length && (state.favs.length || state.recents.length)) {
        state.mode = state.favs.length ? "fav" : "recent";
        state.stations = (state.mode === "fav" ? state.favs : state.recents).slice();
        try {
          renderCountries();
          renderList();
        } catch (_) {}
      }
    } finally {
      hideLoader();
    }
  }
  boot();
})();
