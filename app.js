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
    playGen: 0,
    ignoreErr: false,
    fails: 0,
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
    return (window.I18N && window.I18N[state.lang]) || window.I18N.fa;
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
    for (const h of [state.host, ...HOSTS]) {
      try {
        const res = await fetch(h + path);
        if (!res.ok) throw new Error(String(res.status));
        state.host = h;
        return res.json();
      } catch (e) {
        last = e;
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
    const sel = $("sleep");
    const cur = sel.value;
    sel.innerHTML = [0, 15, 30, 60, 90]
      .map((m) => `<option value="${m}">${m ? t("sleep") + " " + m : t("sleepOff")}</option>`)
      .join("");
    if (cur) sel.value = cur;
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
            <div class="nm">${fl ? fl + " " : ""}${s.name || "—"}</div>
            <div class="meta">${s.country || ""} ${s.bitrate ? "· " + s.bitrate + "k" : ""} ${tags ? "· " + tags : ""}</div>
          </button>
          <button type="button" class="info" data-info="${s.stationuuid}">i</button>
        </div>`;
      })
      .join("");
    const more = state.hasMore ? `<button id="more" class="more" type="button">${t("more")}</button>` : "";
    $("list").innerHTML = cards + more;
  }

  function renderPlayer() {
    const s = state.current;
    $("p-toggle").textContent = state.playing ? t("pause") : t("play");
    $("p-fav").textContent = s && isFav(s.stationuuid) ? "♥" : "♡";
    if (state.status) $("p-kick").textContent = state.status;
    else $("p-kick").textContent = t("onair");
    if (!s) return;
    $("p-name").textContent = s.name || "—";
    $("p-sub").textContent = [s.country, s.codec, s.bitrate ? s.bitrate + " kbps" : ""]
      .filter(Boolean)
      .join(" · ");
    if (s.favicon) $("p-ico").src = s.favicon;
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
    } else {
      audio.play().then(() => {
        state.playing = true;
        state.status = "";
        renderPlayer();
      }).catch(() => failSkip());
    }
    renderPlayer();
  }

  function viz() {
    const c = $("viz");
    const ctx = c.getContext("2d");
    let t = 0;
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
      t += state.playing ? 0.032 : 0.008;
      const w = innerWidth;
      const h = innerHeight;
      ctx.fillStyle = "rgba(7,6,15,0.2)";
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h * 0.4;
      for (let i = 8; i >= 1; i--) {
        const r = 36 + i * 34 + Math.sin(t * 2 + i) * (state.playing ? 16 : 4);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 ? `rgba(255,43,214,${0.07 + i * 0.03})` : `rgba(122,240,255,${0.05 + i * 0.02})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (state.playing) {
        for (let i = 0; i < 36; i++) {
          const a = (i / 36) * Math.PI * 2 + t;
          const len = 18 + Math.abs(Math.sin(t * 4 + i)) * 28;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22);
          ctx.lineTo(cx + Math.cos(a) * (22 + len), cy + Math.sin(a) * (22 + len));
          ctx.strokeStyle = i % 2 ? "rgba(255,43,214,0.35)" : "rgba(122,240,255,0.28)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 9 + (state.playing ? 5 : 0), 0, Math.PI * 2);
      ctx.fillStyle = state.playing ? "#ff2bd6" : "#7af0ff";
      ctx.fill();
      requestAnimationFrame(frame);
    }
    frame();
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
    $("sh-meta").textContent = [flag(s.countrycode), s.country, s.codec, s.bitrate ? s.bitrate + " kbps" : "", s.votes != null ? t("votes") + " " + s.votes : ""]
      .filter(Boolean)
      .join(" · ");
    $("sh-tags").textContent = (s.tags || "").split(",").filter(Boolean).slice(0, 8).join(" · ");
    if (s.favicon) $("sh-ico").src = s.favicon;
    const home = s.homepage && /^https?:/i.test(s.homepage) ? s.homepage : "";
    $("sh-home").hidden = !home;
    if (home) $("sh-home").href = home;
  }
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
  $("p-toggle").addEventListener("click", toggle);
    $("p-fav").addEventListener("click", () => toggleFav(state.current));
    $("p-next").addEventListener("click", () => playRel(1));
    $("p-prev").addEventListener("click", () => playRel(-1));
    $("p-rand").addEventListener("click", playRandom);
    $("vol").addEventListener("input", (e) => {
      const v = Number(e.target.value);
      $("audio").volume = v;
      localStorage.setItem("freq-vol", String(v));
    });
    $("sleep").addEventListener("change", (e) => {
      const m = Number(e.target.value);
      state.sleepAt = m ? Date.now() + m * 60000 : 0;
    });
    $("audio").addEventListener("pause", () => {
      state.playing = false;
      renderPlayer();
    });
    $("audio").addEventListener("play", () => {
      state.playing = true;
      state.status = "";
      renderPlayer();
    });
    $("audio").addEventListener("error", () => {
      state.status = t("failed");
      renderPlayer();
      setTimeout(() => playRel(1), 800);
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
      if (e.key === "n" || e.key === "N") playRel(1);
      if (e.key === "p" || e.key === "P") playRel(-1);
      if (e.key === "r" || e.key === "R") playRandom();
      if (e.key === "f" || e.key === "F") toggleFav(state.current);
    });
    setInterval(() => {
      if (state.sleepAt && Date.now() >= state.sleepAt) {
        state.sleepAt = 0;
        $("sleep").value = "0";
        $("audio").pause();
      }
    }, 1000);
  }

  async function boot() {
    applyI18n();
    bind();
    viz();
    const vol = Number(localStorage.getItem("freq-vol") || "0.85");
    $("audio").volume = vol;
    $("vol").value = String(vol);
    try {
      await loadStations();
      renderPlayer();
      $("loader").classList.add("off");
    } catch (err) {
      $("load-sub").textContent = String(err.message || err);
    }
  }
  boot();
})();
