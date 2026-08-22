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
  };

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
    renderList();
    renderPlayer();
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
    if (state.mode === "fav" || state.mode === "recent") {
      state.stations = (state.mode === "fav" ? state.favs : state.recents).slice();
      state.hasMore = false;
      renderCountries();
      renderGenres();
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
      let data = await getJSON(`/json/stations/search?${p}`);
      if (state.q.trim() && (!data || data.length < 12) && !append) {
        const p2 = new URLSearchParams(p);
        p2.delete("name");
        p2.set("tag", state.q.trim());
        const extra = await getJSON(`/json/stations/search?${p2}`).catch(() => []);
        const seen = new Set((data || []).map((s) => s.stationuuid));
        data = (data || []).concat((extra || []).filter((s) => !seen.has(s.stationuuid)));
      }
      const list = (data || []).filter((s) => (s.url_resolved || s.url || "").startsWith("https://"));
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

  function renderList() {
    const n = state.stations.length;
    const cfn = dict().count;
    $("count-line").textContent = typeof cfn === "function" ? cfn(n) : String(n);
    if (!state.stations.length) {
      $("list").innerHTML = `<div class="card">${t("empty")}</div>`;
      return;
    }
    const cards = state.stations
      .map((s) => {
        const on = state.current && s.stationuuid === state.current.stationuuid ? "on" : "";
        const ico = s.favicon
          ? `<img src="${s.favicon}" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=ph></div>'">`
          : `<div class="ph"></div>`;
        const tags = (s.tags || "").split(",").filter(Boolean).slice(0, 2).join(" · ");
        const fl = flag(s.countrycode);
        return `<div class="card ${on}" data-id="${s.stationuuid}">
          ${ico}
          <button type="button" class="card-hit" data-play="${s.stationuuid}">
            <div class="nm">${fl ? fl + " " : ""}${esc(s.name || "—")}</div>
            <div class="meta">${esc(s.country || "")} ${s.bitrate ? "· " + s.bitrate + "k" : ""} ${tags ? "· " + esc(tags) : ""}</div>
          </button>
          <button type="button" class="info" data-info="${s.stationuuid}">i</button>
        </div>`;
      })
      .join("");
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
    el.style.background = `conic-gradient(from 210deg, hsl(${(h % 40) + 22} 70% 46%), hsl(32 78% 36%), #1a1008, hsl(${(h % 40) + 28} 68% 44%))`;
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
    setMediaSession(s);
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
        clockListen(true);
        renderPlayer();
      }).catch(() => {
        if (gen !== state.playGen) return;
        state.ignoreErr = false;
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
    clockListen(false);
    state.status = t("failed");
    renderPlayer();
    if (state.fails < 4) setTimeout(() => playRel(1), 500);
  }

  function playRel(dir) {
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

  function setVol(v) {
    v = Math.min(1, Math.max(0, Number(v) || 0));
    if ($("audio")) $("audio").volume = v;
    if ($("vol")) $("vol").value = String(v);
    if (v > 0.01) state.prevVol = v;
    try {
      localStorage.setItem("freq-vol", String(v));
    } catch (_) {}
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
      ctx.fillStyle = "rgba(22,14,9,0.22)";
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h * 0.38;
      const lamp = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.55);
      lamp.addColorStop(0, state.playing ? "rgba(255,140,40,0.16)" : "rgba(201,162,39,0.07)");
      lamp.addColorStop(1, "rgba(22,14,9,0)");
      ctx.fillStyle = lamp;
      ctx.fillRect(0, 0, w, h);
      for (let i = 7; i >= 1; i--) {
        const r = 28 + i * 38 + Math.sin(t * 1.4 + i) * (state.playing ? 10 : 3);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 ? `rgba(255,176,32,${0.05 + i * 0.02})` : `rgba(201,162,39,${0.04 + i * 0.015})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 7 + (state.playing ? 3 : 0), 0, Math.PI * 2);
      ctx.fillStyle = state.playing ? "#ff6a1a" : "#c9a227";
      ctx.shadowColor = state.playing ? "#ff6a1a" : "#c9a227";
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      motes.forEach((m) => {
        m.y -= m.s * 0.00035;
        if (m.y < 0) m.y = 1;
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,220,160,0.18)";
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
      g.addColorStop(0, "rgba(255,176,32,0)");
      g.addColorStop(0.2, "rgba(255,176,32,0.55)");
      g.addColorStop(0.55, "rgba(180,35,24,0.75)");
      g.addColorStop(1, "rgba(255,176,32,0)");
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
        ctx.strokeStyle = i % 2 ? "rgba(255,43,214,0.72)" : "rgba(122,240,255,0.55)";
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r0 - 6, 0, Math.PI * 2);
      ctx.strokeStyle = state.playing ? "rgba(255,43,214,0.28)" : "rgba(255,255,255,0.08)";
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
    $("countries").addEventListener("click", (e) => {
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
      loadStations().catch(() => {});
    });
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
    }
    document.addEventListener("click", onAct);
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
      if (e.key === "Escape") closeStage();
      if (e.key === "n" || e.key === "N") playRel(1);
      if (e.key === "p" || e.key === "P") playRel(-1);
      if (e.key === "r" || e.key === "R") playRandom();
      if (e.key === "f" || e.key === "F") toggleFav(state.current);
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
      if (state.sleepAt && Date.now() >= state.sleepAt) {
        state.sleepAt = 0;
        state.sleepMin = 0;
        renderSleep();
        $("audio").pause();
      }
      if (state.playing || state.sleepAt) {
        if ($("s-time")) $("s-time").textContent = fmtTime(listenElapsed());
        updateSleepLeft();
      }
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
