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
  ];

  const state = {
    lang: localStorage.getItem("freq-lang") || "fa",
    host: HOSTS[0],
    cc: "",
    tag: "",
    q: "",
    offset: 0,
    hasMore: false,
    loadingMore: false,
    favOnly: false,
    stations: [],
    favs: JSON.parse(localStorage.getItem("freq-favs") || "[]"),
    current: null,
    playing: false,
  };

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
        const res = await fetch(h + path, { headers: { "User-Agent": "FREQ/1.0" } });
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
    renderList();
  }

  async function loadStations(append) {
    if (state.loadingMore) return;
    if (state.favOnly) {
      state.stations = state.favs.slice();
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
        order: "clickcount",
        reverse: "true",
      });
      if (state.cc) p.set("countrycode", state.cc);
      if (state.tag) p.set("tag", state.tag);
      if (state.q.trim()) p.set("name", state.q.trim());
      const data = await getJSON(`/json/stations/search?${p}`);
      const list = (data || []).filter((s) => (s.url_resolved || s.url || "").startsWith("https://"));
      state.stations = append ? state.stations.concat(list) : list;
      state.hasMore = (data || []).length >= PAGE;
      state.offset += PAGE;
      renderCountries();
      renderGenres();
      renderList();
    } finally {
      state.loadingMore = false;
    }
  }

  function renderCountries() {
    const favBtn = `<button type="button" class="${state.favOnly ? "on" : ""}" data-cc="__fav">${t("fav")}</button>`;
    $("countries").innerHTML =
      favBtn +
      COUNTRIES.map((c) => {
        const on = !state.favOnly && c.cc === state.cc ? "on" : "";
        const label = state.lang === "fa" ? c.fa : c.en;
        return `<button type="button" class="${on}" data-cc="${c.cc}">${label}</button>`;
      }).join("");
  }

  function renderGenres() {
    $("genres").innerHTML = GENRES.map((g) => {
      const on = !state.favOnly && g.tag === state.tag ? "on" : "";
      const label = state.lang === "fa" ? g.fa : g.en;
      return `<button type="button" class="${on}" data-tag="${g.tag}">${label}</button>`;
    }).join("");
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
        const tags = (s.tags || "").split(",").filter(Boolean).slice(0, 3).join(" · ");
        return `<button class="card ${on}" type="button" data-id="${s.stationuuid}">
          ${ico}
          <div>
            <div class="nm">${s.name || "—"}</div>
            <div class="meta">${s.country || s.countrycode || ""} ${tags ? "· " + tags : ""}</div>
          </div>
        </button>`;
      })
      .join("");
    const more = state.hasMore
      ? `<button id="more" class="more" type="button">${t("more")}</button>`
      : "";
    $("list").innerHTML = cards + more;
  }

  function renderPlayer() {
    const s = state.current;
    $("p-toggle").textContent = state.playing ? t("pause") : t("play");
    $("p-fav").textContent = s && isFav(s.stationuuid) ? "♥" : "♡";
    if (!s) return;
    $("p-name").textContent = s.name || "—";
    $("p-sub").textContent = [s.country, s.codec, s.bitrate ? s.bitrate + " kbps" : ""]
      .filter(Boolean)
      .join(" · ");
    if (s.favicon) $("p-ico").src = s.favicon;
  }

  function play(station) {
    const audio = $("audio");
    state.current = station;
    const url = station.url_resolved || station.url;
    if (audio.src !== url) audio.src = url;
    getJSON(`/json/url/${station.stationuuid}`).catch(() => {});
    audio.play().then(() => {
      state.playing = true;
      renderPlayer();
      renderList();
    }).catch(() => {
      state.playing = false;
      renderPlayer();
    });
    renderPlayer();
    renderList();
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
        renderPlayer();
      }).catch(() => {});
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
      t += state.playing ? 0.028 : 0.008;
      const w = innerWidth;
      const h = innerHeight;
      ctx.fillStyle = "rgba(7,6,15,0.22)";
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h * 0.42;
      for (let i = 7; i >= 1; i--) {
        const r = 40 + i * 38 + Math.sin(t * 2 + i) * (state.playing ? 14 : 4);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 ? `rgba(255,43,214,${0.08 + i * 0.03})` : `rgba(122,240,255,${0.06 + i * 0.02})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 8 + (state.playing ? 4 : 0), 0, Math.PI * 2);
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
      const btn = e.target.closest("[data-cc]");
      if (!btn) return;
      if (btn.dataset.cc === "__fav") state.favOnly = true;
      else {
        state.favOnly = false;
        state.cc = btn.dataset.cc;
      }
      state.q = "";
      $("q").value = "";
      loadStations().catch(() => {});
    });
    $("genres").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tag]");
      if (!btn) return;
      state.favOnly = false;
      state.tag = btn.dataset.tag;
      loadStations().catch(() => {});
    });
    $("search-form").addEventListener("submit", (e) => {
      e.preventDefault();
      state.q = $("q").value || "";
      state.favOnly = false;
      loadStations().catch(() => {});
    });
    $("list").addEventListener("click", (e) => {
      if (e.target.closest("#more")) {
        loadStations(true).catch(() => {});
        return;
      }
      const btn = e.target.closest("[data-id]");
      if (!btn) return;
      const s = state.stations.find((x) => x.stationuuid === btn.dataset.id);
      if (s) play(s);
    });
    $("list").addEventListener("scroll", () => {
      const el = $("list");
      if (el.scrollTop + el.clientHeight > el.scrollHeight - 240) {
        if (state.hasMore && !state.loadingMore) loadStations(true).catch(() => {});
      }
    });
    $("p-toggle").addEventListener("click", toggle);
    $("p-fav").addEventListener("click", () => toggleFav(state.current));
    $("vol").addEventListener("input", (e) => {
      $("audio").volume = Number(e.target.value);
    });
    $("audio").addEventListener("pause", () => {
      state.playing = false;
      renderPlayer();
    });
    $("audio").addEventListener("play", () => {
      state.playing = true;
      renderPlayer();
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
  }

  async function boot() {
    applyI18n();
    bind();
    viz();
    $("audio").volume = 0.85;
    try {
      await loadStations();
      $("loader").classList.add("off");
    } catch (err) {
      $("load-sub").textContent = String(err.message || err);
    }
  }
  boot();
})();
