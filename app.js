/* FREQ — ساخته شده توسط مبین.آ */
(() => {
  "use strict";

  const Core = window.FreqCore;
  if (!Core) {
    const sub = document.getElementById("load-sub");
    if (sub) sub.textContent = "FREQ failed to load (core.js).";
    return;
  }

  const {
    safeUrl,
    isWebUrl,
    esc,
    hashHue,
    fakeFreq,
    initials,
    fmtTime,
    padPresets,
    hexRgb,
    toJalali,
    normalizeStation,
    normalizeStations,
    buildStationsQuery,
    buildTagFallbackQuery,
    parseFilters,
    filtersToQuery,
    formatNumber,
    dayIndex,
    topTags,
    uniqueStations,
    sameStation,
  } = Core;

  const $ = function (id) {
    if (typeof document === "undefined" || !document || !document.getElementById) return null;
    return document.getElementById(id);
  };
  const HOSTS = [
    "https://de1.api.radio-browser.info",
    "https://fi1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info",
    "https://all.api.radio-browser.info",
  ];
  const PAGE = 120;
  const APP_VERSION = "2.1.0";
  const API_TTL = 30 * 1000;
  const DIRSTATS_TTL = 6 * 60 * 60 * 1000;
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
    { tag: "", fa: "همه", en: "All", ico: "✦", hue: 220 },
    { tag: "pop", fa: "پاپ", en: "Pop", ico: "✨", hue: 312 },
    { tag: "rock", fa: "راک", en: "Rock", ico: "🎸", hue: 8 },
    { tag: "jazz", fa: "جاز", en: "Jazz", ico: "🎷", hue: 38 },
    { tag: "classical", fa: "کلاسیک", en: "Classical", ico: "🎻", hue: 268 },
    { tag: "electronic", fa: "الکترونیک", en: "Electronic", ico: "⚡", hue: 188 },
    { tag: "dance", fa: "دنس", en: "Dance", ico: "🪩", hue: 292 },
    { tag: "hip hop", fa: "هیپ‌هاپ", en: "Hip hop", ico: "🎤", hue: 28 },
    { tag: "rap", fa: "رپ", en: "Rap", ico: "💥", hue: 16 },
    { tag: "metal", fa: "متال", en: "Metal", ico: "🤘", hue: 350 },
    { tag: "news", fa: "خبر", en: "News", ico: "📰", hue: 206 },
    { tag: "talk", fa: "گفت‌وگو", en: "Talk", ico: "🎙️", hue: 198 },
    { tag: "sports", fa: "ورزش", en: "Sports", ico: "⚽", hue: 142 },
    { tag: "oldies", fa: "قدیمی", en: "Oldies", ico: "📻", hue: 24 },
    { tag: "80s", fa: "دهه ۸۰", en: "80s", ico: "📼", hue: 322 },
    { tag: "chillout", fa: "چیل", en: "Chill", ico: "🌙", hue: 222 },
    { tag: "lofi", fa: "لوفای", en: "Lo-fi", ico: "🎧", hue: 248 },
    { tag: "persian", fa: "پارسی", en: "Persian", ico: "🌸", hue: 336 },
    { tag: "arabic", fa: "عربی", en: "Arabic", ico: "☾", hue: 168 },
    { tag: "folk", fa: "فولک", en: "Folk", ico: "🪕", hue: 32 },
    { tag: "reggae", fa: "رگه", en: "Reggae", ico: "🌴", hue: 128 },
    { tag: "latin", fa: "لاتین", en: "Latin", ico: "💃", hue: 352 },
    { tag: "blues", fa: "بلوز", en: "Blues", ico: "💙", hue: 214 },
    { tag: "country", fa: "کانتری", en: "Country", ico: "🤠", hue: 22 },
    { tag: "house", fa: "هاوس", en: "House", ico: "🏠", hue: 182 },
    { tag: "techno", fa: "تکنو", en: "Techno", ico: "🔊", hue: 262 },
    { tag: "soul", fa: "سول", en: "Soul", ico: "💜", hue: 280 },
    { tag: "disco", fa: "دیسکو", en: "Disco", ico: "🕺", hue: 300 },
    { tag: "ambient", fa: "امبینت", en: "Ambient", ico: "🌌", hue: 230 },
    { tag: "indie", fa: "ایندی", en: "Indie", ico: "🌻", hue: 48 },
    { tag: "funk", fa: "فانک", en: "Funk", ico: "😎", hue: 44 },
    { tag: "k-pop", fa: "کی‌پاپ", en: "K-pop", ico: "💫", hue: 318 },
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
  const THEMES = [
    { id: "dark", fa: "اخگر", en: "Ember", light: 0, bg: "#09090b", acc: "#ff4d2e", ice: "#7dd3fc", text: "#f4f4f5", muted: "#a1a1aa", ink: "#ffffff", panel: "rgba(24,24,28,0.72)", line: "rgba(255,255,255,0.08)", player: "rgba(12,12,16,0.82)", cabinet: "rgba(18,18,22,0.9)", wash: "radial-gradient(ellipse at 50% -20%, rgba(255,77,46,0.16), transparent 42%), radial-gradient(ellipse at 90% 80%, rgba(125,211,252,0.06), transparent 40%), #09090b" },
    { id: "oled", fa: "سیاه", en: "Void", light: 0, bg: "#000000", acc: "#ff3b30", ice: "#64d2ff", text: "#ffffff", muted: "#a3a3a3", ink: "#ffffff", panel: "rgba(18,18,18,0.82)", line: "rgba(255,255,255,0.08)", player: "rgba(10,10,10,0.9)", cabinet: "rgba(12,12,12,0.94)", wash: "#000000" },
    { id: "light", fa: "کاغذ", en: "Paper", light: 1, bg: "#f4f4f5", acc: "#e11d48", ice: "#0284c7", text: "#18181b", muted: "#52525b", ink: "#ffffff", panel: "rgba(255,255,255,0.8)", line: "rgba(0,0,0,0.08)", player: "rgba(255,255,255,0.9)", cabinet: "rgba(255,255,255,0.94)", wash: "radial-gradient(ellipse at 50% -20%, rgba(225,29,72,0.12), transparent 42%), #f4f4f5" },
    { id: "aurora", fa: "شفق", en: "Aurora", light: 0, bg: "#041510", acc: "#34d399", ice: "#67e8f9", text: "#ecfdf5", muted: "#86efac", ink: "#042f2e", panel: "rgba(6,36,28,0.72)", line: "rgba(110,231,183,0.16)", player: "rgba(4,24,18,0.86)", cabinet: "rgba(6,32,24,0.92)", wash: "radial-gradient(ellipse at 20% -10%, rgba(52,211,153,0.22), transparent 40%), radial-gradient(ellipse at 90% 80%, rgba(56,189,248,0.14), transparent 42%), #041510" },
    { id: "sunset", fa: "غروب", en: "Sunset", light: 0, bg: "#1a0b12", acc: "#fb7185", ice: "#fdba74", text: "#fff1f2", muted: "#fda4af", ink: "#4c0519", panel: "rgba(48,16,28,0.72)", line: "rgba(251,113,133,0.18)", player: "rgba(28,10,16,0.88)", cabinet: "rgba(36,12,20,0.92)", wash: "radial-gradient(ellipse at 10% 0%, rgba(251,113,133,0.22), transparent 40%), radial-gradient(ellipse at 90% 100%, rgba(251,146,60,0.18), transparent 42%), #1a0b12" },
    { id: "ocean", fa: "اقیانوس", en: "Ocean", light: 0, bg: "#071422", acc: "#38bdf8", ice: "#a5b4fc", text: "#e0f2fe", muted: "#7dd3fc", ink: "#082f49", panel: "rgba(8,28,48,0.72)", line: "rgba(56,189,248,0.16)", player: "rgba(6,18,32,0.88)", cabinet: "rgba(8,24,40,0.92)", wash: "radial-gradient(ellipse at 30% -10%, rgba(56,189,248,0.2), transparent 42%), radial-gradient(ellipse at 90% 90%, rgba(37,99,235,0.16), transparent 40%), #071422" },
    { id: "violet", fa: "بنفش", en: "Violet", light: 0, bg: "#120818", acc: "#c084fc", ice: "#f9a8d4", text: "#fae8ff", muted: "#d8b4fe", ink: "#3b0764", panel: "rgba(36,16,52,0.72)", line: "rgba(192,132,252,0.18)", player: "rgba(22,10,32,0.88)", cabinet: "rgba(28,12,40,0.92)", wash: "radial-gradient(ellipse at 50% -10%, rgba(168,85,247,0.24), transparent 42%), radial-gradient(ellipse at 100% 80%, rgba(244,114,182,0.12), transparent 40%), #120818" },
    { id: "lava", fa: "گدازه", en: "Lava", light: 0, bg: "#140606", acc: "#ef4444", ice: "#fb923c", text: "#fff1f2", muted: "#fca5a5", ink: "#ffffff", panel: "rgba(42,12,12,0.74)", line: "rgba(239,68,68,0.18)", player: "rgba(24,8,8,0.88)", cabinet: "rgba(32,10,10,0.92)", wash: "radial-gradient(ellipse at 50% -10%, rgba(239,68,68,0.22), transparent 40%), radial-gradient(ellipse at 80% 100%, rgba(251,146,60,0.1), transparent 42%), #140606" },
    { id: "mint", fa: "نعنا", en: "Mint", light: 0, bg: "#071412", acc: "#2dd4bf", ice: "#99f6e4", text: "#f0fdfa", muted: "#5eead4", ink: "#042f2e", panel: "rgba(8,36,32,0.72)", line: "rgba(45,212,191,0.16)", player: "rgba(6,24,22,0.88)", cabinet: "rgba(8,30,28,0.92)", wash: "radial-gradient(ellipse at 20% 0%, rgba(45,212,191,0.2), transparent 42%), #071412" },
    { id: "gold", fa: "طلا", en: "Gold", light: 0, bg: "#120e06", acc: "#fbbf24", ice: "#fde68a", text: "#fffbeb", muted: "#fcd34d", ink: "#1c1504", panel: "rgba(40,30,10,0.74)", line: "rgba(251,191,36,0.16)", player: "rgba(22,16,6,0.9)", cabinet: "rgba(28,20,8,0.94)", wash: "radial-gradient(ellipse at 50% -10%, rgba(250,204,21,0.16), transparent 42%), #120e06" },
    { id: "sakura", fa: "شکوفه", en: "Sakura", light: 1, bg: "#fff1f5", acc: "#db2777", ice: "#fb7185", text: "#4a044e", muted: "#9d174d", ink: "#ffffff", panel: "rgba(255,255,255,0.78)", line: "rgba(190,24,93,0.12)", player: "rgba(255,255,255,0.9)", cabinet: "rgba(255,241,245,0.94)", wash: "radial-gradient(ellipse at 20% 0%, rgba(244,114,182,0.2), transparent 44%), #fff1f5" },
    { id: "nord", fa: "نورد", en: "Nord", light: 0, bg: "#0e1419", acc: "#88c0d0", ice: "#81a1c1", text: "#eceff4", muted: "#9aa7b5", ink: "#0b1220", panel: "rgba(22,30,38,0.76)", line: "rgba(136,192,208,0.14)", player: "rgba(14,20,26,0.9)", cabinet: "rgba(18,26,34,0.94)", wash: "radial-gradient(ellipse at 40% -10%, rgba(136,192,208,0.16), transparent 42%), #0e1419" },
    { id: "matrix", fa: "ماتریکس", en: "Matrix", light: 0, bg: "#020604", acc: "#22c55e", ice: "#86efac", text: "#dcfce7", muted: "#4ade80", ink: "#052e16", panel: "rgba(6,24,12,0.78)", line: "rgba(34,197,94,0.16)", player: "rgba(2,10,6,0.92)", cabinet: "rgba(4,16,8,0.95)", wash: "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.16), transparent 40%), #020604" },
    { id: "rose", fa: "رز", en: "Rose", light: 0, bg: "#1a0c12", acc: "#fb7185", ice: "#fda4af", text: "#fff1f2", muted: "#fecdd3", ink: "#4c0519", panel: "rgba(48,18,28,0.74)", line: "rgba(251,113,133,0.16)", player: "rgba(26,10,16,0.9)", cabinet: "rgba(34,12,20,0.94)", wash: "radial-gradient(ellipse at 30% 0%, rgba(251,113,133,0.2), transparent 42%), #1a0c12" },
    { id: "cyber", fa: "سایبر", en: "Cyber", light: 0, bg: "#0a0612", acc: "#ec4899", ice: "#22d3ee", text: "#fdf4ff", muted: "#f9a8d4", ink: "#ffffff", panel: "rgba(24,12,36,0.76)", line: "rgba(236,72,153,0.18)", player: "rgba(12,8,22,0.9)", cabinet: "rgba(16,10,28,0.94)", wash: "radial-gradient(ellipse at 10% 0%, rgba(236,72,153,0.22), transparent 40%), radial-gradient(ellipse at 90% 100%, rgba(34,211,238,0.16), transparent 42%), #0a0612" },
    { id: "sand", fa: "کویر", en: "Dune", light: 1, bg: "#f6efe4", acc: "#d97706", ice: "#0f766e", text: "#1c1917", muted: "#78716c", ink: "#fffbeb", panel: "rgba(255,251,245,0.82)", line: "rgba(120,53,15,0.12)", player: "rgba(255,251,245,0.92)", cabinet: "rgba(255,247,237,0.95)", wash: "radial-gradient(ellipse at 50% -10%, rgba(217,119,6,0.12), transparent 42%), #f6efe4" },
    { id: "forest", fa: "جنگل", en: "Forest", light: 0, bg: "#07140c", acc: "#4ade80", ice: "#86efac", text: "#ecfdf5", muted: "#86efac", ink: "#052e16", panel: "rgba(10,32,18,0.74)", line: "rgba(74,222,128,0.16)", player: "rgba(6,20,12,0.9)", cabinet: "rgba(8,26,14,0.94)", wash: "radial-gradient(ellipse at 30% 0%, rgba(74,222,128,0.16), transparent 42%), #07140c" },
    { id: "wine", fa: "شرابی", en: "Wine", light: 0, bg: "#1a0710", acc: "#e11d48", ice: "#fb7185", text: "#fff1f2", muted: "#fda4af", ink: "#ffffff", panel: "rgba(48,12,24,0.74)", line: "rgba(225,29,72,0.18)", player: "rgba(26,8,16,0.9)", cabinet: "rgba(34,10,20,0.94)", wash: "radial-gradient(ellipse at 40% 0%, rgba(190,24,93,0.2), transparent 42%), #1a0710" },
    { id: "neon", fa: "نئون", en: "Neon", light: 0, bg: "#07070f", acc: "#a3e635", ice: "#e879f9", text: "#f7fee7", muted: "#d9f99d", ink: "#1a2e05", panel: "rgba(16,16,28,0.76)", line: "rgba(163,230,53,0.16)", player: "rgba(8,8,16,0.9)", cabinet: "rgba(12,12,22,0.94)", wash: "radial-gradient(ellipse at 15% 0%, rgba(163,230,53,0.18), transparent 40%), radial-gradient(ellipse at 90% 90%, rgba(232,121,249,0.14), transparent 42%), #07070f" },
    { id: "midnight", fa: "نیمه‌شب", en: "Midnight", light: 0, bg: "#07081a", acc: "#818cf8", ice: "#67e8f9", text: "#eef2ff", muted: "#a5b4fc", ink: "#1e1b4b", panel: "rgba(16,18,48,0.74)", line: "rgba(129,140,248,0.18)", player: "rgba(8,10,28,0.9)", cabinet: "rgba(12,14,36,0.94)", wash: "radial-gradient(ellipse at 50% -10%, rgba(99,102,241,0.22), transparent 42%), #07081a" },
  ];

  const EXTRA_THEME_PALETTES = [
    { id: "coral", fa: "مرجان", en: "Coral", bg: "#1a0b12", acc: "#fb7185", ice: "#ffd0a8", text: "#fff1f2", muted: "#fda4af", ink: "#3f0a19" },
    { id: "peach", fa: "هلو", en: "Peach", bg: "#1b100b", acc: "#fb9872", ice: "#ffd8a8", text: "#fff7ed", muted: "#fdba92", ink: "#3d1b10" },
    { id: "cobalt", fa: "کبالت", en: "Cobalt", bg: "#08122b", acc: "#5b8cff", ice: "#a9d4ff", text: "#eef4ff", muted: "#a8bfff", ink: "#07152e" },
    { id: "sapphire", fa: "یاقوت کبود", en: "Sapphire", bg: "#061833", acc: "#38bdf8", ice: "#a5f3fc", text: "#e0f2fe", muted: "#7dd3fc", ink: "#08233e" },
    { id: "amethyst", fa: "آمتیست", en: "Amethyst", bg: "#160d25", acc: "#a78bfa", ice: "#f0abfc", text: "#f5f3ff", muted: "#c4b5fd", ink: "#24103d" },
    { id: "lavender", fa: "اسطوخودوس", en: "Lavender", light: true, bg: "#f4f0ff", acc: "#7c3aed", ice: "#db2777", text: "#21143c", muted: "#67518d", ink: "#ffffff" },
    { id: "plum", fa: "آلو", en: "Plum", bg: "#180a1e", acc: "#d946ef", ice: "#f0abfc", text: "#fdf4ff", muted: "#e879f9", ink: "#350c3c" },
    { id: "ruby", fa: "یاقوت", en: "Ruby", bg: "#1c0811", acc: "#f43f5e", ice: "#fda4af", text: "#fff1f2", muted: "#fda4af", ink: "#ffffff" },
    { id: "copper", fa: "مس", en: "Copper", bg: "#1a0e08", acc: "#e8875b", ice: "#f6bd80", text: "#fff7ed", muted: "#e7a77b", ink: "#2c1008" },
    { id: "honey", fa: "عسل", en: "Honey", bg: "#171006", acc: "#f6b73c", ice: "#ffe08a", text: "#fffbeb", muted: "#fcd34d", ink: "#281a05" },
    { id: "citrus", fa: "مرکبات", en: "Citrus", light: true, bg: "#f3f8e8", acc: "#4d7c0f", ice: "#0f766e", text: "#1a2810", muted: "#526b3b", ink: "#ffffff" },
    { id: "lagoon", fa: "تالاب", en: "Lagoon", bg: "#07191a", acc: "#2dd4bf", ice: "#67e8f9", text: "#ecfeff", muted: "#5eead4", ink: "#042f2e" },
    { id: "peacock", fa: "طاووس", en: "Peacock", bg: "#071724", acc: "#06b6d4", ice: "#a3e635", text: "#ecfeff", muted: "#67e8f9", ink: "#052b35" },
    { id: "glacier", fa: "یخچال", en: "Glacier", light: true, bg: "#eff8fc", acc: "#0369a1", ice: "#0891b2", text: "#102b3a", muted: "#456579", ink: "#ffffff" },
    { id: "cloud", fa: "ابر", en: "Cloud", light: true, bg: "#f4f6f8", acc: "#475569", ice: "#0f766e", text: "#17202b", muted: "#5a6571", ink: "#ffffff" },
    { id: "graphite", fa: "گرافیت", en: "Graphite", bg: "#111315", acc: "#a3a3a3", ice: "#67e8f9", text: "#f4f4f5", muted: "#a1a1aa", ink: "#111315" },
    { id: "mono", fa: "تک‌رنگ", en: "Monochrome", bg: "#070707", acc: "#f5f5f5", ice: "#a3a3a3", text: "#ffffff", muted: "#a3a3a3", ink: "#111111" },
    { id: "rose-quartz", fa: "رز بلوری", en: "Rose Quartz", light: true, bg: "#fff1f5", acc: "#be185d", ice: "#7c3aed", text: "#321628", muted: "#80546a", ink: "#ffffff" },
    { id: "mint-cream", fa: "کرم نعنا", en: "Mint Cream", light: true, bg: "#edfff7", acc: "#047857", ice: "#0e7490", text: "#102c24", muted: "#4b6e60", ink: "#ffffff" },
    { id: "skyline", fa: "آسمان", en: "Skyline", light: true, bg: "#eff8ff", acc: "#1d4ed8", ice: "#0891b2", text: "#14243b", muted: "#50647f", ink: "#ffffff" },
    { id: "lemonade", fa: "لیموناد", en: "Lemonade", light: true, bg: "#fffbea", acc: "#a16207", ice: "#ea580c", text: "#30240d", muted: "#73613a", ink: "#ffffff" },
    { id: "orchid", fa: "ارکیده", en: "Orchid", bg: "#1d0a1b", acc: "#e879f9", ice: "#c4b5fd", text: "#fdf4ff", muted: "#f0abfc", ink: "#381141" },
    { id: "berry", fa: "توت", en: "Berry", bg: "#160a1a", acc: "#c026d3", ice: "#fb7185", text: "#fdf4ff", muted: "#e879f9", ink: "#ffffff" },
    { id: "pine", fa: "کاج", en: "Pine", bg: "#08150f", acc: "#16a34a", ice: "#a3e635", text: "#ecfdf5", muted: "#86efac", ink: "#06240f" },
    { id: "jade", fa: "یشم", en: "Jade", bg: "#081715", acc: "#10b981", ice: "#6ee7b7", text: "#ecfdf5", muted: "#6ee7b7", ink: "#042f2e" },
    { id: "emberglass", fa: "شیشهٔ اخگر", en: "Ember Glass", bg: "#171015", acc: "#ff6b4a", ice: "#9bdcfb", text: "#fff5f1", muted: "#d6aaa1", ink: "#ffffff" },
    { id: "deepsea", fa: "دریای عمیق", en: "Deep Sea", bg: "#06121b", acc: "#0ea5e9", ice: "#38bdf8", text: "#e0f2fe", muted: "#7dd3fc", ink: "#06233a" },
    { id: "twilight", fa: "گرگ‌ومیش", en: "Twilight", bg: "#100b1d", acc: "#6366f1", ice: "#f472b6", text: "#eef2ff", muted: "#a5b4fc", ink: "#ffffff" },
    { id: "cosmic", fa: "کیهانی", en: "Cosmic", bg: "#090619", acc: "#8b5cf6", ice: "#22d3ee", text: "#f5f3ff", muted: "#c4b5fd", ink: "#ffffff" },
    { id: "mocha", fa: "موکا", en: "Mocha", bg: "#18110e", acc: "#d6a77a", ice: "#f3d7b3", text: "#fff7ed", muted: "#c5a995", ink: "#2c1d16" },
  ];
  EXTRA_THEME_PALETTES.forEach(function (palette) {
    const bgRgb = hexRgb(palette.bg);
    THEMES.push({
      id: palette.id,
      fa: palette.fa,
      en: palette.en,
      light: palette.light ? 1 : 0,
      bg: palette.bg,
      acc: palette.acc,
      ice: palette.ice,
      text: palette.text,
      muted: palette.muted,
      ink: palette.ink,
      panel: palette.light ? "rgba(255,255,255,0.78)" : "rgba(" + bgRgb + ",0.78)",
      line: palette.light ? "rgba(20,20,30,0.1)" : "rgba(" + hexRgb(palette.ice) + ",0.17)",
      player: palette.light ? "rgba(255,255,255,0.9)" : "rgba(" + bgRgb + ",0.9)",
      cabinet: palette.light ? "rgba(255,255,255,0.96)" : "rgba(" + bgRgb + ",0.95)",
      wash:
        "radial-gradient(ellipse at 16% 0%, rgba(" + hexRgb(palette.acc) + ",0.2), transparent 42%), " +
        "radial-gradient(ellipse at 88% 88%, rgba(" + hexRgb(palette.ice) + ",0.11), transparent 42%), " +
        palette.bg,
    });
  });

  const PLAYER_STYLES = [
    { id: "studio", fa: "استودیو", en: "Studio", faHint: "کنسول رادیویی متعادل", enHint: "Balanced radio console" },
    { id: "vinyl", fa: "وینیل", en: "Vinyl", faHint: "صفحهٔ گردان با حس نوستالژی", enHint: "A spinning record-inspired look" },
    { id: "spectrum", fa: "طیف‌نما", en: "Spectrum", faHint: "اکولایزر و موج در مرکز توجه", enHint: "Waveform and equalizer up front" },
    { id: "retro", fa: "رادیوی قدیمی", en: "Retro FM", faHint: "درجهٔ موج و حال‌وهوای آنالوگ", enHint: "Warm analog tuner details" },
    { id: "minimal", fa: "مینیمال", en: "Minimal", faHint: "ساده، خلوت و بی‌حواس‌پرتی", enHint: "Clean controls, less distraction" },
    { id: "glass", fa: "شیشه‌ای", en: "Glass", faHint: "شیشهٔ مات و نور نرم", enHint: "Soft, translucent glass" },
    { id: "neon", fa: "نئون", en: "Neon", faHint: "لبه‌های درخشان و پرانرژی", enHint: "Bright edges and a vivid glow" },
    { id: "album", fa: "کاور آلبوم", en: "Album Art", faHint: "تصویر ایستگاه بزرگ‌تر و برجسته‌تر", enHint: "Artwork-first listening" },
    { id: "wave", fa: "موج", en: "Wave", faHint: "لایه‌های زنده با الهام از موج", enHint: "Animated wave-inspired layers" },
    { id: "compact", fa: "فشرده", en: "Compact", faHint: "نوار کم‌جا برای صفحهٔ کوچک", enHint: "A slim dock for small screens" },
    { id: "terminal", fa: "ترمینال", en: "Terminal", faHint: "نمایشگر دیجیتال تک‌رنگ", enHint: "A monochrome digital monitor" },
  ];

  function playerStyleById(id) {
    return PLAYER_STYLES.find(function (style) { return style.id === id; }) || PLAYER_STYLES[0];
  }

  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : raw;
    } catch (_) {
      return fallback;
    }
  }
  function lsSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }
  function safeParse(key, fallback) {
    try {
      const raw = lsGet(key, null);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }
  function prefersLight() {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches);
    } catch (_) {
      return false;
    }
  }

  const storedVol = Number(lsGet("freq-vol", "0.85"));
  const storedGeo = safeParse("freq-geo", null);
  const state = {
    lang: lsGet("freq-lang", "") || window.FREQ_DEFAULT_LANG || "en",
    host: HOSTS[0],
    cc: "",
    tag: "",
    langFilter: "",
    q: "",
    sort: lsGet("freq-sort", "clickcount"),
    offset: 0,
    hasMore: false,
    loadingMore: false,
    loadingFirst: true,
    mode: "browse",
    stations: [],
    favs: normalizeStations(safeParse("freq-favs", [])),
    recents: normalizeStations(safeParse("freq-recents", [])),
    current: normalizeStation(safeParse("freq-last", null)),
    playing: false,
    failed: false,
    status: "",
    sleepAt: 0,
    sleepMin: 0,
    playGen: 0,
    ignoreErr: false,
    fails: 0,
    retries: 0,
    listenMs: 0,
    listenTick: 0,
    prevVol: Number.isFinite(storedVol) && storedVol > 0.01 ? storedVol : 0.85,
    stageOpen: false,
    sheet: null,
    mhz: 96,
    presets: padPresets(
      (safeParse("freq-presets", []) || []).map(function (s) {
        return normalizeStation(s);
      })
    ),
    alarm: safeParse("freq-alarm", { on: false, hh: 7, mm: 0, last: "" }),
    stats: safeParse("freq-stats", { ms: 0, hits: {}, tags: {}, names: {}, since: 0 }),
    band: "",
    wave: lsGet("freq-wave", "fm"),
    hd: lsGet("freq-hd", "0") === "1",
    hidden: (safeParse("freq-hidden", []) || []).filter(function (x) {
      return typeof x === "string";
    }),
    scanning: false,
    scanGen: 0,
    scanTimer: 0,
    night: false,
    userVol: Number.isFinite(storedVol) ? Math.min(1, Math.max(0, storedVol)) : 0.85,
    weather: "",
    wx: safeParse("freq-wx", null),
    fadeIv: 0,
    folders: (safeParse("freq-folders", []) || []).map(function (f) {
      return {
        id: String((f && f.id) || "f" + Math.random().toString(36).slice(2)),
        name: String((f && f.name) || "").slice(0, 24),
        ids: Array.isArray(f && f.ids) ? f.ids.filter(function (x) { return typeof x === "string"; }) : [],
      };
    }),
    folderId: "",
    mapOpen: false,
    carOpen: false,
    mapPts: [],
    filtersOpen: false,
    theme: lsGet("freq-theme", "") || (prefersLight() ? "light" : "dark"),
    playerStyle: lsGet("freq-player-style", "studio"),
    forYou: [],
    forYouTag: "",
    nearList: [],
    homeAll: false,
    fetchGen: 0,
    pool: [],
    dirStats: safeParse("freq-dirstats", null),
    countries: [],
    countryQ: "",
    searches: (safeParse("freq-searches", []) || [])
      .filter(function (x) { return typeof x === "string" && x.trim(); })
      .slice(0, 6),
    geo:
      storedGeo && Number.isFinite(Number(storedGeo.lat)) && Number.isFinite(Number(storedGeo.lon))
        ? { lat: Number(storedGeo.lat), lon: Number(storedGeo.lon), at: Number(storedGeo.at) || 0 }
        : null,
    error: false,
    offline: typeof navigator !== "undefined" && navigator.onLine === false,
    renderKey: "",
    renderedIds: [],
    cacheAt: 0,
    deepLinkStation: "",
    deepLinkPending: false,
    wantsRandom: false,
    swReg: null,
    swWaiting: null,
    swReloading: false,
    installPrompt: null,
    installed: false,
    listAbort: null,
    watchdog: 0,
    audioUrl: "",
    lastStatus: "",
    statsSaveAt: 0,
  };
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
    document.documentElement.lang = d.htmlLang || "en";
    document.documentElement.dir = d.dir || "ltr";
    document.title = d.title || "FREQ";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const value = d[el.dataset.i18n];
      if (typeof value === "string") el.textContent = value;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.placeholder = d[el.dataset.i18nPlaceholder] || "";
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      const label = d[el.dataset.i18nAria];
      if (typeof label === "string") el.setAttribute("aria-label", label);
    });
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      const on = b.dataset.lang === state.lang;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    function meta(selector, value) {
      const el = document.querySelector(selector);
      if (el && value) el.setAttribute("content", value);
    }
    if (d.description) meta('meta[name="description"]', d.description);
    if (d.title) {
      meta('meta[property="og:title"]', d.title);
      meta('meta[name="twitter:title"]', d.title);
    }
    if (d.description) {
      meta('meta[property="og:description"]', d.description);
      meta('meta[name="twitter:description"]', d.description);
    }
    if (state.current) {
      setMediaSession(state.current);
      setRds(state.current);
    }
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
    applyPlayerStyle();
    syncFiltersBtn();
    syncClearBtn();
    syncDockSleep();
    syncGeoBtn();
    syncVersion();
    renderDirectoryStats();
    renderSearchHints();
  }
  function setLang(lang) {
    state.lang = lang === "en" ? "en" : "fa";
    lsSet("freq-lang", state.lang);
    applyI18n();
  }

  const apiCache = new Map();
  function isAbort(err) {
    return !!err && (err.name === "AbortError" || /abort/i.test(String(err.message || "")));
  }
  function trimApiCache() {
    while (apiCache.size > 60) apiCache.delete(apiCache.keys().next().value);
  }
  function markOnline() {
    if (state.offline) {
      state.offline = false;
      setNetBar(false);
    }
  }
  function markOffline() {
    if (!state.offline) {
      state.offline = true;
      setNetBar(true);
    }
  }

  async function getJSON(path, opts) {
    const options = opts || {};
    const ttl = typeof options.ttl === "number" ? options.ttl : API_TTL;
    const cacheable = !options.noCache;
    if (cacheable) {
      const hit = apiCache.get(path);
      if (hit && Date.now() - hit.at < ttl) return hit.data;
    }
    let last = null;
    const tried = new Set();
    for (const h of [state.host, ...HOSTS]) {
      if (!h || tried.has(h)) continue;
      tried.add(h);
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      let onAbort = null;
      if (ctrl && options.signal) {
        if (options.signal.aborted) break;
        onAbort = function () { ctrl.abort(); };
        options.signal.addEventListener("abort", onAbort, { once: true });
      }
      const timer = ctrl
        ? setTimeout(function () { ctrl.abort(); }, options.timeout || 9000)
        : null;
      try {
        const init = ctrl ? { signal: ctrl.signal, credentials: "omit" } : { credentials: "omit" };
        const res = await fetch(h + path, init);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        state.host = h;
        if (cacheable) {
          apiCache.set(path, { data: data, at: Date.now() });
          trimApiCache();
        }
        markOnline();
        return data;
      } catch (e) {
        if (options.signal && options.signal.aborted) throw e;
        last = e;
      } finally {
        if (timer) clearTimeout(timer);
        if (onAbort && options.signal) options.signal.removeEventListener("abort", onAbort);
      }
    }
    markOffline();
    throw last || new Error("radio api down");
  }

  function saveFavs() {
    lsSet("freq-favs", JSON.stringify(state.favs));
  }
  function isFav(uuid) {
    return state.favs.some(function (s) { return s.stationuuid === uuid; });
  }
  function toggleFav(station) {
    const s = normalizeStation(station);
    if (!s) return;
    const adding = !isFav(s.stationuuid);
    if (!adding) {
      state.favs = state.favs.filter(function (x) { return x.stationuuid !== s.stationuuid; });
    } else {
      state.favs = [s].concat(state.favs).slice(0, 200);
    }
    saveFavs();
    renderPlayer();
    renderPresets();
    if (state.mode === "fav") state.stations = state.favs.filter(function (x) { return state.hidden.indexOf(x.stationuuid) < 0; });
    renderList();
    toast(adding ? t("favAdded") : t("favRemoved"));
  }
  function pushRecent(station) {
    const s = normalizeStation(station);
    if (!s) return;
    state.recents = [s]
      .concat(state.recents.filter(function (x) { return x.stationuuid !== s.stationuuid; }))
      .slice(0, 40);
    lsSet("freq-recents", JSON.stringify(state.recents));
    lsSet("freq-last", JSON.stringify(s));
  }

  function saveStationCache() {
    if (!state.stations.length || state.mode !== "browse") return;
    const payload = {
      at: Date.now(),
      mode: state.mode,
      cc: state.cc,
      tag: state.tag,
      q: state.q,
      language: state.langFilter,
      stations: state.stations.slice(0, 80),
    };
    if (lsSet("freq-cache", JSON.stringify(payload))) state.cacheAt = payload.at;
  }
  function readStationCache() {
    const cached = safeParse("freq-cache", null);
    if (!cached || !Array.isArray(cached.stations)) return [];
    return normalizeStations(cached.stations);
  }

  function applyLocalMode() {
    const visible = function (s) {
      return s && state.hidden.indexOf(s.stationuuid) < 0;
    };
    if (state.mode === "folder") {
      const f = (state.folders || []).find(function (x) { return x.id === state.folderId; });
      const ids = (f && f.ids) || [];
      state.stations = ids
        .map(function (id) {
          return state.favs.find(function (s) { return s.stationuuid === id; })
            || state.recents.find(function (s) { return s.stationuuid === id; })
            || null;
        })
        .filter(visible);
    } else {
      state.stations = (state.mode === "fav" ? state.favs : state.recents).filter(visible);
    }
    state.hasMore = false;
    state.loadingFirst = false;
    state.loadingMore = false;
    renderCountries();
    renderGenres();
    renderFolders();
    renderList();
    hideLoader();
  }

  async function loadStations(append) {
    if (append && (state.loadingMore || !state.hasMore)) return;
    if (!append) {
      state.fetchGen = (state.fetchGen || 0) + 1;
      state.loadingMore = false;
      state.error = false;
      if (state.listAbort) state.listAbort.abort();
      state.listAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
    }
    const fetchGen = state.fetchGen;
    if (state.mode === "fav" || state.mode === "recent" || state.mode === "folder") {
      applyLocalMode();
      return;
    }
    if (!append) {
      state.offset = 0;
      state.loadingFirst = !state.stations.length;
    }
    state.loadingMore = true;
    renderList();

    const query = buildStationsQuery(
      {
        cc: state.cc,
        tag: state.tag,
        language: state.langFilter,
        q: state.q.trim(),
        wave: state.wave,
        hd: state.hd,
        order: state.sort,
        offset: state.offset,
        limit: PAGE,
      },
      PAGE
    );
    try {
      const signal = state.listAbort ? state.listAbort.signal : undefined;
      let data = await getJSON("/json/stations/search?" + query, { ttl: 45 * 1000, signal: signal });
      if (state.q.trim() && (!data || data.length < 12) && !append) {
        const extra = await getJSON(
          "/json/stations/search?" + buildTagFallbackQuery(
            {
              cc: state.cc,
              language: state.langFilter,
              q: state.q.trim(),
              wave: state.wave,
              hd: state.hd,
              order: state.sort,
              offset: 0,
              limit: PAGE,
            },
            PAGE
          ),
          { ttl: 45 * 1000, signal: signal }
        ).catch(function () { return []; });
        const seen = new Set((data || []).map(function (s) { return s.stationuuid; }));
        data = (data || []).concat(
          (extra || []).filter(function (s) { return !seen.has(s.stationuuid); })
        );
      }
      if (fetchGen !== state.fetchGen) return;
      const raw = (data || []).filter(function (s) {
        return state.hidden.indexOf(s.stationuuid) < 0;
      });
      const list = normalizeStations(raw);
      state.stations = append ? uniqueStations(state.stations.concat(list)) : list;
      state.error = false;
      remember(list);
      state.hasMore = (data || []).length >= PAGE;
      state.offset += PAGE;
      saveStationCache();
      renderCountries();
      renderGenres();
      renderLangs();
      renderList();
    } catch (e) {
      if (isAbort(e) || fetchGen !== state.fetchGen) return;
      state.error = true;
      if (!state.stations.length) {
        const cached = readStationCache();
        if (cached.length) {
          state.stations = cached;
          state.hasMore = false;
          state.cacheAt = Number(safeParse("freq-cache", {}).at) || 0;
        }
      }
      renderCountries();
      renderGenres();
      renderList();
    } finally {
      if (fetchGen === state.fetchGen) {
        state.loadingMore = false;
        state.loadingFirst = false;
        hideLoader();
        fillIfShort();
      }
    }
  }

  function countryName(entry) {
    const curated = COUNTRIES.find(function (c) { return c.cc === entry.cc; });
    if (curated) return state.lang === "fa" ? curated.fa : curated.en;
    if (entry.name) {
      if (state.lang !== "fa") return entry.name;
      try {
        const dn = new Intl.DisplayNames(["fa"], { type: "region" });
        const label = dn.of(entry.cc);
        if (label) return label;
      } catch (_) {}
      return entry.name;
    }
    return entry.cc;
  }

  function renderCountries() {
    const box = $("countries");
    if (!box) return;
    const extra =
      `<button type="button" class="${state.mode === "fav" ? "on" : ""}" data-mode="fav" aria-pressed="${state.mode === "fav" ? "true" : "false"}">${esc(t("fav"))} <span class="cc-count">${formatNumber((state.favs || []).length, "en-US")}</span></button>` +
      `<button type="button" class="${state.mode === "recent" ? "on" : ""}" data-mode="recent" aria-pressed="${state.mode === "recent" ? "true" : "false"}">${esc(t("recent"))} <span class="cc-count">${formatNumber((state.recents || []).length, "en-US")}</span></button>` +
      `<button type="button" data-here="1">${esc(t("here"))}</button>`;
    const q = state.countryQ.trim().toLowerCase();
    const merged = [];
    const seen = Object.create(null);
    COUNTRIES.forEach(function (c) {
      if (!c.cc || seen[c.cc]) return;
      seen[c.cc] = 1;
      const hit = (state.countries || []).find(function (x) { return x.cc === c.cc; });
      merged.push({ cc: c.cc, name: "", count: hit ? hit.count : 0 });
    });
    (state.countries || []).forEach(function (c) {
      if (!c.cc || seen[c.cc]) return;
      seen[c.cc] = 1;
      merged.push(c);
    });
    const rows = merged.filter(function (entry) {
      if (!q) return true;
      return (
        countryName(entry).toLowerCase().indexOf(q) >= 0 ||
        entry.cc.toLowerCase().indexOf(q) >= 0
      );
    });
    const shown = q ? rows.slice(0, 200) : rows.slice(0, 64);
    const worldOn = state.mode === "browse" && !state.cc;
    let html =
      extra +
      `<button type="button" class="${worldOn ? "on" : ""}" data-cc="" aria-pressed="${worldOn ? "true" : "false"}">${esc(
        state.lang === "fa" ? COUNTRIES[0].fa : COUNTRIES[0].en
      )}</button>`;
    html += shown
      .map(function (entry) {
        const on = state.mode === "browse" && entry.cc === state.cc;
        const count = entry.count ? `<span class="cc-count">${formatNumber(entry.count, "en-US")}</span>` : "";
        const fl = flag(entry.cc);
        return `<button type="button" class="${on ? "on" : ""}" data-cc="${esc(entry.cc)}" aria-pressed="${on ? "true" : "false"}"><span class="cflag" aria-hidden="true">${fl}</span>${esc(countryName(entry))}${count}</button>`;
      })
      .join("");
    if (!shown.length) {
      html += `<span class="filter-empty">${esc(t("noResults"))}</span>`;
    }
    box.innerHTML = html;
  }

  async function loadCountries() {
    const cached = safeParse("freq-countries", null);
    if (cached && Array.isArray(cached.list) && Date.now() - Number(cached.at || 0) < 7 * 24 * 3600 * 1000) {
      state.countries = cached.list;
      renderCountries();
      return;
    }
    try {
      const data = await getJSON("/json/countries", { ttl: 7 * 24 * 3600 * 1000 });
      const seen = Object.create(null);
      const list = (Array.isArray(data) ? data : [])
        .map(function (row) {
          const cc = String((row && (row.iso_3166_1 || row.countrycode)) || "").toUpperCase();
          return {
            cc: /^[A-Z]{2}$/.test(cc) ? cc : "",
            name: String((row && row.name) || "").slice(0, 80),
            count: Number(row && row.stationcount) || 0,
          };
        })
        .filter(function (row) {
          if (!row.cc || seen[row.cc]) return false;
          seen[row.cc] = 1;
          return true;
        })
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, 240);
      if (list.length) {
        state.countries = list;
        lsSet("freq-countries", JSON.stringify({ at: Date.now(), list: list }));
        renderCountries();
      }
    } catch (_) {}
  }

  function renderGenres() {
    const box = $("genres");
    if (!box) return;
    box.innerHTML = GENRES.map((g) => {
      const on = state.mode === "browse" && g.tag === state.tag;
      const label = state.lang === "fa" ? g.fa : g.en;
      const ico = g.ico ? `<span class="gico" aria-hidden="true">${g.ico}</span>` : "";
      return `<button type="button" class="gchip ${on ? "on" : ""}" data-tag="${esc(g.tag)}" aria-pressed="${on ? "true" : "false"}" style="--gh:${g.hue || 220}">${ico}${esc(label)}</button>`;
    }).join("");
    syncClearBtn();
  }
  function genreByTag(tag) {
    return GENRES.find((g) => g.tag === tag) || null;
  }
  function mosaicHtml() {
    return `<section class="mosaic-sec">
      <div class="rail-top"><h3>${esc(t("browse"))}</h3></div>
      <div class="mosaic">${GENRES.filter((g) => g.tag).map((g) => {
        const label = state.lang === "fa" ? g.fa : g.en;
        return `<button type="button" class="mosaic-tile" data-gtag="${esc(g.tag)}" style="--gh:${g.hue}">
          <span class="gico">${g.ico || ""}</span><span>${esc(label)}</span>
        </button>`;
      }).join("")}</div>
    </section>`;
  }
  function todayPick() {
    const list = state.stations || [];
    if (!list.length) return null;
    const idx = dayIndex(list.length, new Date());
    return idx >= 0 ? list[idx] : null;
  }
  function todayHeroHtml() {
    const s = todayPick();
    if (!s) return "";
    const fl = flag(s.countrycode);
    const ico = artHtml(s);
    return `<section class="today">
      <button type="button" class="today-hit" data-play="${esc(s.stationuuid)}" title="${esc(s.name || "")}">
        ${ico}
        <div class="today-txt">
          <div class="today-k">${esc(t("today"))}</div>
          <h2>${fl ? fl + " " : ""}${esc(s.name || "—")}</h2>
          <p>${esc(s.country || "")}${s.bitrate ? " · " + s.bitrate + "k" : ""}</p>
        </div>
        <span class="today-go">${esc(t("play"))}</span>
      </button>
    </section>`;
  }
  function genreHeroHtml() {
    const g = genreByTag(state.tag);
    if (!g || !g.tag) return "";
    const label = state.lang === "fa" ? g.fa : g.en;
    const cfn = dict().count;
    const n = state.stations.length;
    const cnt = typeof cfn === "function" ? cfn(n) : String(n);
    return `<section class="genre-hero" style="--gh:${g.hue}">
      <div class="gh-ico">${g.ico || ""}</div>
      <div class="gh-txt"><h2>${esc(label)}</h2><p>${esc(cnt)}</p></div>
    </section>`;
  }
  function hasActiveFilters() {
    return !!(
      state.tag ||
      state.cc ||
      state.langFilter ||
      (state.q && state.q.trim()) ||
      state.band ||
      state.mode === "fav" ||
      state.mode === "recent" ||
      state.mode === "folder"
    );
  }
  function syncClearBtn() {
    const b = $("clear-btn");
    if (b) b.hidden = !hasActiveFilters();
    const fb = $("filters-btn");
    if (fb) fb.classList.toggle("hot", hasActiveFilters());
  }
  function setGenre(tag) {
    state.mode = "browse";
    state.tag = state.tag === tag ? "" : tag || "";
    state.band = state.tag;
    state.homeAll = !!state.tag;
    if (state.tag) state.folderId = "";
    closeFilters();
    renderGenres();
    renderBands();
    loadStations().catch(function () {});
    syncUrl();
  }
  function clearFilters() {
    state.mode = "browse";
    state.tag = "";
    state.cc = "";
    state.langFilter = "";
    state.q = "";
    state.band = "";
    state.folderId = "";
    state.countryQ = "";
    state.homeAll = false;
    if ($("q")) $("q").value = "";
    if ($("country-q")) $("country-q").value = "";
    renderGenres();
    renderCountries();
    renderLangs();
    renderBands();
    renderFolders();
    loadStations().catch(function () {});
    syncUrl();
  }
  function renderLangs() {
    const box = $("langs");
    if (!box) return;
    box.innerHTML = LANGS.map(function (g) {
      const on = state.mode === "browse" && g.id === state.langFilter ? "on" : "";
      const label = state.lang === "fa" ? g.fa : g.en;
      return `<button type="button" class="${on}" data-langf="${esc(g.id)}" aria-pressed="${on ? "true" : "false"}">${esc(label)}</button>`;
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
      ["bitrate", "quality"],
      ["name", "az"],
    ];
    const box = $("sorts");
    if (!box) return;
    box.innerHTML = opts
      .map(function (pair) {
        const on = state.sort === pair[0];
        return `<button type="button" class="${on ? "on" : ""}" data-sort="${pair[0]}" aria-pressed="${on ? "true" : "false"}">${esc(t(pair[1]))}</button>`;
      })
      .join("");
  }

  function renderSleep() {
    const box = $("sleep-chips");
    if (!box) return;
    box.innerHTML = [0, 15, 30, 60, 90]
      .map((m) => {
        const on = state.sleepMin === m ? "on" : "";
        const label = m ? String(m) : t("sleepOff");
        return `<button type="button" class="${on}" data-sleep="${m}" aria-pressed="${on ? "true" : "false"}">${label}</button>`;
      })
      .join("");
  }

  function phHtml(station) {
    return `<span class="ph" aria-hidden="true"><b>${esc(initials((station && station.name) || "F"))}</b></span>`;
  }
  function artHtml(station) {
    const ph = phHtml(station);
    const src = safeUrl(station && station.favicon, "image");
    if (!src) return ph;
    return (
      `<img src="${esc(src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-art="1">` +
      ph.replace('class="ph"', 'class="ph" hidden')
    );
  }
  function stationCard(s, rail) {
    const on = sameStation(state.current, s) ? "on" : "";
    const live = on && state.playing ? '<span class="noweq" aria-hidden="true"><i></i><i></i><i></i></span>' : "";
    const ico = artHtml(s);
    const tags = (s.tags || "").split(",").filter(Boolean).slice(0, 2).join(" · ");
    const fl = flag(s.countrycode);
    const uuid = esc(s.stationuuid);
    const name = esc(s.name || "—");
    const hd = s.bitrate >= 128 ? '<span class="badge-hd">HD</span>' : "";
    if (rail) {
      return `<button type="button" class="rail-card ${on}" data-play="${uuid}" title="${name}"${on ? ' aria-current="true"' : ""}>
        <span class="rail-art">${ico}</span>
        <span class="nm">${name}${live}</span>
        <span class="meta">${esc(s.country || "")}</span>
      </button>`;
    }
    return `<article class="card ${on}" data-id="${uuid}" title="${name}"${on ? ' aria-current="true"' : ""}>
      <div class="card-art">${ico}</div>
      <div class="card-main">
        <div class="nm-row">
          <button type="button" class="card-hit" data-play="${uuid}">
            <span class="nm">${fl ? fl + " " : ""}${name}${hd}${live}</span>
          </button>
          <button type="button" class="info" data-info="${uuid}" aria-label="${esc(t("info"))}: ${name}">i</button>
        </div>
        <button type="button" class="card-hit meta" data-play="${uuid}">${esc(s.country || "")}${
      s.bitrate ? " · " + s.bitrate + "k" : ""
    }${tags ? " · " + esc(tags) : ""}</button>
      </div>
    </article>`;
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
      <button type="button" data-act="seeall">${esc(t("seeall"))}</button></div>
      <div class="rail-row">${items.slice(0, 10).map(function (s) { return stationCard(s, true); }).join("")}</div>
    </section>`;
  }

  function skeletonHtml(count) {
    let out = "";
    for (let i = 0; i < count; i += 1) {
      out += `<div class="sk-card" aria-hidden="true">
        <div class="sk-art skeleton"></div>
        <div class="sk-lines">
          <div class="sk-line skeleton" style="width:${60 + ((i * 13) % 28)}%"></div>
          <div class="sk-line short skeleton"></div>
        </div>
      </div>`;
    }
    return out;
  }

  function stateBlock(kind) {
    const active = hasActiveFilters();
    if (kind === "error") {
      return `<div class="state">
        <div class="state-ico" aria-hidden="true">📡</div>
        <h3>${esc(t("loadError"))}</h3>
        <p>${esc(t("loadErrorBody"))}</p>
        <div class="state-actions">
          <button type="button" class="ghost wide" data-act="retry">${esc(t("retry"))}</button>
          <button type="button" class="ghost wide" data-act="filters">${esc(t("filters"))}</button>
        </div>
      </div>`;
    }
    const title = active ? t("emptyFiltered") : t("emptyHome");
    const actions =
      `<button type="button" class="ghost wide" data-act="rand">${esc(t("randomPick"))}</button>` +
      (active ? `<button type="button" class="ghost wide" data-act="clearf">${esc(t("clearFilters"))}</button>` : "");
    return `<div class="state">
      <div class="state-ico" aria-hidden="true">📻</div>
      <h3>${esc(title)}</h3>
      <p>${esc(t("empty"))}</p>
      <div class="state-actions">${actions}</div>
    </div>`;
  }

  function renderList() {
    const el = $("list");
    if (!el) return;
    const n = state.stations.length;
    const home = isHome();
    const viewKey = [
      state.lang,
      state.mode,
      state.tag,
      state.cc,
      state.langFilter,
      state.q,
      state.sort,
      home ? 1 : 0,
      state.folderId,
      state.forYouTag,
    ].join("|");
    const full = viewKey !== state.renderKey || !$("cards");
    const keep = full ? 0 : el.scrollTop;
    const ids = state.stations.map(function (s) { return s.stationuuid; });
    const cfn = dict().count;
    const countLine = $("count-line");
    if (countLine) {
      let lineText = typeof cfn === "function" ? cfn(n) : String(n);
      if (state.loadingMore && !n) lineText = t("loadingStations");
      else if (state.error && n) lineText += " · " + t("offline");
      countLine.textContent = lineText;
    }
    el.setAttribute("aria-busy", state.loadingMore || state.loadingFirst ? "true" : "false");

    if (!full) {
      const samePrefix =
        ids.length >= state.renderedIds.length &&
        state.renderedIds.every(function (id, i) { return ids[i] === id; });
      if (samePrefix && ids.length > state.renderedIds.length) {
        const cardsBox = $("cards");
        if (cardsBox) {
          cardsBox.insertAdjacentHTML(
            "beforeend",
            state.stations.slice(state.renderedIds.length).map(function (s) { return stationCard(s, false); }).join("")
          );
        }
        state.renderedIds = ids;
        syncClearBtn();
        syncChrome();
        watchTail();
        return;
      }
      if (ids.length === state.renderedIds.length && samePrefix) {
        markCurrent();
        syncChrome();
        watchTail();
        return;
      }
    }

    const rails = home
      ? todayHeroHtml() +
        railBlock(t("continue"), (state.recents || []).slice(0, 10)) +
        railBlock(t("foryou"), state.forYou || []) +
        railBlock(t("near"), state.nearList || []) +
        mosaicHtml()
      : "";
    const heading = home
      ? `<section class="rail"><div class="rail-top"><h3>${esc(t("trending"))}</h3></div></section>`
      : genreHeroHtml();
    let inner = "";
    if (!n && (state.loadingFirst || state.loadingMore)) {
      inner = skeletonHtml(6);
    } else if (!n) {
      inner = stateBlock(state.error ? "error" : "empty");
    } else {
      inner = state.stations.map(function (s) { return stationCard(s, false); }).join("");
      if (state.loadingMore) inner += skeletonHtml(2);
    }
    el.innerHTML =
      rails +
      heading +
      `<div id="cards" class="cards">${inner}</div>` +
      '<div id="tail" class="tail"></div>';
    el.scrollTop = keep;
    state.renderKey = viewKey;
    state.renderedIds = ids;
    syncClearBtn();
    syncChrome();
    watchTail();
    hideExploreTipIfSeen();
  }

  let tailObs = null;
  function maybeMore() {
    if (state.mode !== "browse" || !state.hasMore || state.loadingMore || state.error) return;
    loadStations(true).catch(function () {});
  }
  function fillIfShort() {
    const el = $("list");
    if (!el || state.mode !== "browse" || !state.hasMore || state.loadingMore) return;
    if (el.scrollHeight <= el.clientHeight + 80) maybeMore();
  }
  function watchTail() {
    const tail = $("tail");
    const root = $("list");
    if (!tail || !root || typeof IntersectionObserver === "undefined") {
      fillIfShort();
      return;
    }
    if (!tailObs) {
      tailObs = new IntersectionObserver(
        function (entries) {
          if (entries.some(function (e) { return e.isIntersecting; })) maybeMore();
        },
        { root: root, rootMargin: "360px" }
      );
    }
    tailObs.disconnect();
    tailObs.observe(tail);
    fillIfShort();
  }

  function paintPh(el, station) {
    if (!el) return;
    const name = (station && station.name) || "FREQ";
    el.textContent = initials(name);
    el.style.setProperty("--ph-hue", String(hashHue(name)));
    el.style.removeProperty("background");
  }
  function setArt(img, ph, station) {
    if (!img || !ph) return;
    const src = safeUrl(station && station.favicon, "image");
    if (!src) {
      img.removeAttribute("src");
      img.hidden = true;
      ph.hidden = false;
      paintPh(ph, station);
      return;
    }
    if (img.dataset.src !== src) {
      img.dataset.src = src;
      img.hidden = true;
    }
    img.onload = function () {
      img.hidden = false;
      ph.hidden = true;
    };
    img.onerror = function () {
      img.hidden = true;
      ph.hidden = false;
      paintPh(ph, station);
    };
    if (img.getAttribute("src") !== src) img.src = src;
    else if (img.complete && img.naturalWidth > 0) {
      img.hidden = false;
      ph.hidden = true;
    }
  }

  function listenElapsed() {
    const extra = state.playing && state.listenTick ? Date.now() - state.listenTick : 0;
    return state.listenMs + extra;
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
  function syncChrome() {
    const p = $("player");
    if (!p) return;
    const r = p.getBoundingClientRect();
    const extra = 22;
    const h = Math.max(160, Math.ceil(window.innerHeight - r.top + extra));
    document.documentElement.style.setProperty("--player-h", h + "px");
  }
  function renderPlayer() {
    const s = state.current;
    const player = $("player");
    const stage = $("stage");
    if (!player) return;
    player.setAttribute("data-player-style", state.playerStyle);
    if (stage) stage.setAttribute("data-player-style", state.playerStyle);
    const fav = !!(s && isFav(s.stationuuid));
    const failed = !!state.failed;
    const connecting = !state.playing && !!state.status && !failed;

    player.classList.toggle("on", state.playing);
    player.classList.toggle("connecting", connecting);
    player.classList.toggle("failed", failed);
    player.classList.toggle("buffering", !!state.buffering);
    if (stage) {
      stage.classList.toggle("open", state.stageOpen);
      stage.classList.toggle("on-air", state.playing);
      stage.setAttribute("aria-hidden", state.stageOpen ? "false" : "true");
      stage.classList.toggle("buffering", !!state.buffering);
    }
    document.body.classList.toggle("stage-open", state.stageOpen);
    document.querySelectorAll(".fav-btn").forEach(function (b) {
      b.classList.toggle("on", fav);
      b.setAttribute("aria-pressed", fav ? "true" : "false");
    });

    const kick = state.status || t("onair");
    setText("p-kick", kick);
    setText("s-kick", kick);

    const toggleLabel = state.playing ? t("pause") : t("play");
    document.querySelectorAll("[data-act='toggle']").forEach(function (b) {
      b.setAttribute("aria-label", toggleLabel);
    });

    const audio = $("audio");
    const vol = audio ? audio.volume : state.userVol;
    setText("vol-n", String(Math.round(vol * 100)));
    const muteBtn = $("mute-btn");
    if (muteBtn) muteBtn.classList.toggle("muted", vol < 0.01);
    setText("s-time", fmtTime(listenElapsed()));
    updateSleepLeft();

    const sheetPlay = $("sh-play");
    if (sheetPlay) {
      sheetPlay.textContent = state.playing && sameStation(state.current, state.sheet) ? t("pause") : t("play");
    }

    const announcement = s ? (s.name || "—") + " — " + kick : kick;
    if (announcement !== state.lastStatus) {
      state.lastStatus = announcement;
      setText("p-state", announcement);
    }

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
    if (dict().title) document.title = name + " — FREQ";
    setText("p-name", name);
    setText("s-name", name);
    const sub = [flag(s.countrycode), s.country, s.codec, s.bitrate ? s.bitrate + " kbps" : ""]
      .filter(Boolean)
      .join(" · ");
    setText("p-sub", sub);
    setText("s-sub", sub);
    const mhz = fakeFreq(s) + " MHz";
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
    syncChrome();
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
      const src = safeUrl(s.favicon, "image");
      const art = src ? [{ src: src, sizes: "96x96" }] : [];
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
    document.querySelectorAll(".card[data-id]").forEach(function (el) {
      const on = !!(state.current && el.dataset.id === state.current.stationuuid);
      el.classList.toggle("on", on);
      if (on) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
  }

  function clearWatchdog() {
    if (state.watchdog) {
      clearTimeout(state.watchdog);
      state.watchdog = 0;
    }
  }

  function onAudioStarted(gen) {
    if (gen && gen !== state.playGen) return;
    state.ignoreErr = false;
    state.fails = 0;
    state.playing = true;
    state.failed = false;
    state.buffering = false;
    state.status = "";
    clearWatchdog();
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
    setMediaSession(state.current);
  }

  function tryFallback(gen) {
    const audio = $("audio");
    const s = state.current;
    if (!audio || !s) return false;
    const primary = s.url_resolved || s.url;
    const fallback = s.url && s.url !== primary ? s.url : "";
    if (state.retries > 0 || !fallback) return false;
    state.retries += 1;
    state.audioUrl = fallback;
    state.status = t("reconnecting");
    state.buffering = true;
    renderPlayer();
    try {
      audio.src = fallback;
      audio.load();
    } catch (_) {}
    audio
      .play()
      .then(function () { onAudioStarted(gen); })
      .catch(function () { failSkip(); });
    return true;
  }

  function play(station) {
    const s = normalizeStation(station) || (station && station.url_resolved ? station : null);
    if (!s) return;
    const audio = $("audio");
    if (!audio) return;
    clearWatchdog();
    state.playGen = (state.playGen || 0) + 1;
    const gen = state.playGen;
    state.ignoreErr = true;
    state.current = s;
    state.status = t("connecting");
    state.playing = false;
    state.failed = false;
    state.buffering = true;
    state.retries = 0;
    state.listenMs = 0;
    state.listenTick = 0;
    remember(s);
    pushRecent(s);
    bumpStats(s);
    audio.pause();
    try {
      audio.src = s.url_resolved || s.url;
      state.audioUrl = audio.src;
      audio.load();
    } catch (_) {
      state.audioUrl = s.url_resolved || s.url;
    }
    getJSON("/json/url/" + encodeURIComponent(s.stationuuid), { noCache: true }).catch(function () {});
    renderPlayer();
    markCurrent();
    if (navigator.mediaSession && navigator.mediaSession.playbackState) {
      try { navigator.mediaSession.playbackState = "playing"; } catch (_) {}
    }
    const go = audio.play();
    const failed = function (err) {
      if (gen !== state.playGen) return;
      if (err && err.name === "NotAllowedError") {
        state.ignoreErr = false;
        state.playing = false;
        state.buffering = false;
        state.status = t("tapPlay");
        renderPlayer();
        return;
      }
      if (tryFallback(gen)) return;
      failSkip();
    };
    if (go && go.then) go.then(function () { onAudioStarted(gen); }).catch(failed);
    else setTimeout(function () { onAudioStarted(gen); }, 250);
    state.watchdog = setTimeout(function () {
      if (gen !== state.playGen || state.playing) return;
      if (tryFallback(gen)) return;
      state.ignoreErr = false;
      failSkip();
    }, 15000);
    setTimeout(function () {
      if (gen === state.playGen) state.ignoreErr = false;
    }, 1800);
  }

  function failSkip() {
    clearWatchdog();
    state.playing = false;
    state.failed = true;
    state.buffering = false;
    clockListen(false);
    state.status = t("failed");
    renderPlayer();
    setMediaSession(state.current);
    if (state.scanning) return;
    state.fails = (state.fails || 0) + 1;
    if (state.fails < 3) {
      setTimeout(function () {
        if (!state.playing) playRel(1);
      }, 900);
    }
  }

  function playRel(dir) {
    const list = state.stations;
    if (!list.length) return;
    if (!state.current) {
      play(list[0]);
      return;
    }
    const i = list.findIndex(function (s) { return s.stationuuid === state.current.stationuuid; });
    const n = (i < 0 ? 0 : i + dir + list.length) % list.length;
    play(list[n]);
  }

  function playRandom() {
    const list = state.stations;
    if (!list.length) {
      toast(t("empty"));
      return;
    }
    let pick = list[Math.floor(Math.random() * list.length)];
    if (state.current && list.length > 1) {
      let guard = 0;
      while (pick.stationuuid === state.current.stationuuid && guard < 12) {
        pick = list[Math.floor(Math.random() * list.length)];
        guard += 1;
      }
    }
    play(pick);
  }

  function toggle() {
    const audio = $("audio");
    if (!audio) return;
    if (!state.current) {
      if (state.stations[0]) play(state.stations[0]);
      else toast(t("empty"));
      return;
    }
    if (state.playing) {
      audio.pause();
      state.playing = false;
      state.buffering = false;
      clockListen(false);
      renderPlayer();
      saveStats(true);
      return;
    }
    if (state.status === t("failed") || !state.audioUrl) {
      play(state.current);
      return;
    }
    state.buffering = true;
    state.status = t("connecting");
    renderPlayer();
    audio
      .play()
      .then(function () { onAudioStarted(state.playGen); })
      .catch(function () { failSkip(); });
  }

  function setVol(v, silent) {
    v = Math.min(1, Math.max(0, Number(v) || 0));
    const audio = $("audio");
    if (audio) audio.volume = v;
    document.querySelectorAll("[data-vol]").forEach(function (el) {
      el.value = String(v);
    });
    if (v > 0.01) state.prevVol = v;
    if (!silent) {
      state.userVol = v;
      lsSet("freq-vol", String(v));
    }
    setText("vol-n", String(Math.round(v * 100)));
    const muteBtn = $("mute-btn");
    if (muteBtn) muteBtn.classList.toggle("muted", v < 0.01);
  }
  function toggleMute() {
    const audio = $("audio");
    const cur = audio ? audio.volume : state.userVol;
    if (cur < 0.01) setVol(state.prevVol || 0.85);
    else setVol(0);
  }
  function setSleep(m) {
    state.sleepMin = m;
    state.sleepAt = m ? Date.now() + m * 60000 : 0;
    renderSleep();
    updateSleepLeft();
    syncDockSleep();
  }
  function cycleSleep() {
    const order = [0, 15, 30, 60, 90];
    const i = order.indexOf(state.sleepMin);
    setSleep(order[(i + 1) % order.length]);
    toast(state.sleepMin ? t("sleep") + " " + state.sleepMin : t("sleepOff"));
  }
  function syncDockSleep() {
    const b = $("dock-sleep");
    if (!b) return;
    b.textContent = state.sleepMin ? t("sleep") + " " + state.sleepMin : t("sleep");
    b.classList.toggle("on", !!state.sleepMin);
    b.setAttribute("aria-pressed", state.sleepMin ? "true" : "false");
  }

  const layers = [];
  const focusStack = [];
  let ignorePop = 0;
  const LAYER_SELECTOR = {
    stage: "#stage .cabinet",
    sheet: "#sheet",
    filters: "#filters .drawer-card",
    settings: "#settings .drawer-card",
    about: "#about .about-card",
    help: "#help .about-card",
    stand: "#stand",
    map: "#map",
    car: "#car",
    themes: "#themes .themes-card",
    wrap: "#wrap .themes-card",
    playerstyles: "#playerstyles .themes-card",
  };

  function layerContainer(id) {
    const selector = LAYER_SELECTOR[id];
    return selector ? document.querySelector(selector) : null;
  }
  function focusablesIn(root) {
    if (!root) return [];
    return Array.prototype.filter.call(
      root.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ),
      function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
      }
    );
  }
  function focusFirstIn(id) {
    const box = layerContainer(id);
    if (!box) return;
    if (!box.hasAttribute("tabindex")) box.setAttribute("tabindex", "-1");
    try {
      box.focus({ preventScroll: true });
    } catch (_) {
      box.focus();
    }
  }
  function pushLayer(id) {
    if (layers[layers.length - 1] === id) return;
    layers.push(id);
    if (!focusStack.some(function (f) { return f.id === id; })) {
      focusStack.push({ id: id, prev: document.activeElement });
    }
    setTimeout(function () {
      if (layers[layers.length - 1] === id) focusFirstIn(id);
    }, 30);
  }
  function dropLayer(id) {
    const i = layers.lastIndexOf(id);
    if (i >= 0) layers.splice(i, 1);
    const box = layerContainer(id);
    const index = focusStack.map(function (f) { return f.id; }).lastIndexOf(id);
    if (index >= 0) {
      const rec = focusStack.splice(index, 1)[0];
      const active = document.activeElement;
      if (!active || active === document.body || (box && box.contains(active))) {
        if (rec && rec.prev && rec.prev.isConnected && rec.prev.focus) {
          try {
            rec.prev.focus({ preventScroll: true });
          } catch (_) {}
        }
      }
    }
  }
  function trapTab(e) {
    if (e.key !== "Tab" || !layers.length) return;
    const id = layers[layers.length - 1];
    const box = layerContainer(id);
    if (!box) return;
    const items = focusablesIn(box);
    if (!items.length) {
      e.preventDefault();
      box.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || document.activeElement === box || !box.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last || document.activeElement === box || !box.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  }
  function consumeBack() {
    const id = layers[layers.length - 1];
    if (!id) return false;
    if (id === "stage") closeStage(true);
    else if (id === "sheet") closeSheet(true);
    else if (id === "filters") closeFilters(true);
    else if (id === "settings") closeSettings(true);
    else if (id === "about") closeAbout(true);
    else if (id === "help") closeHelp(true);
    else if (id === "stand") closeStand(true);
    else if (id === "map") closeMap(true);
    else if (id === "car") closeCar(true);
    else if (id === "themes") closeThemes(true);
    else if (id === "wrap") closeWrap(true);
    else if (id === "playerstyles") closePlayerStyles(true);
    else dropLayer(id, true);
    return true;
  }
  function bindBack() {
    try { history.scrollRestoration = "manual"; } catch (_) {}
    try {
      if (!history.state || !history.state.keep) history.replaceState({ keep: "root" }, "");
      history.pushState({ keep: "live" }, "");
    } catch (_) {}
    addEventListener("popstate", () => {
      if (ignorePop) { ignorePop -= 1; return; }
      if (consumeBack()) {
        try { history.pushState({ keep: "live" }, ""); } catch (_) {}
      }
    });
    document.addEventListener("backbutton", (e) => {
      if (consumeBack()) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    addEventListener("keydown", (e) => {
      if (e.keyCode === 4 && consumeBack()) e.preventDefault();
    });
    window.AndroidBack = consumeBack;
    window.onBackPressed = consumeBack;
    try {
      const cap = window.Capacitor;
      if (cap && cap.Plugins && cap.Plugins.App) {
        cap.Plugins.App.addListener("backButton", function () {
          if (!consumeBack() && cap.Plugins.App.exitApp) cap.Plugins.App.exitApp();
        });
      }
    } catch (_) {}
  }
  function openStage() {
    const was = !!state.stageOpen;
    state.stageOpen = true;
    const stage = $("stage");
    if (stage) {
      stage.hidden = false;
      stage.classList.add("open");
    }
    document.body.classList.add("stage-open");
    renderPlayer();
    setTimeout(resizeFx, 80);
    if (!was) pushLayer("stage");
  }
  function closeStage(fromPop) {
    const was = !!state.stageOpen;
    state.stageOpen = false;
    const stage = $("stage");
    if (stage) {
      stage.classList.remove("open");
      stage.hidden = true;
    }
    document.body.classList.remove("stage-open");
    renderPlayer();
    if (was) dropLayer("stage", fromPop);
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
    state.homeAll = true;
    state.q = "";
    state.tag = "";
    state.band = "";
    if ($("q")) $("q").value = "";
    renderCountries();
    renderGenres();
    renderBands();
    closeFilters();
    loadStations().catch(function () {});
    syncUrl();
  }
  function renderBands() {
    const box = $("bands");
    if (!box) return;
    box.innerHTML = BANDS.map(function (g) {
      const on = state.mode === "browse" && g.tag === state.band ? "on" : "";
      const label = state.lang === "fa" ? g.fa : g.en;
      return (
        '<button type="button" class="' + on + '" data-band="' + esc(g.tag) + '" aria-pressed="' +
        (on ? "true" : "false") + '">' + esc(label) + "</button>"
      );
    }).join("");
  }
  function renderPresets() {
    const html = state.presets
      .map(function (s, i) {
        const on = s && state.current && s.stationuuid === state.current.stationuuid ? "on" : "";
        const has = s ? "has" : "";
        const name = s ? (s.name || "P" + (i + 1)).slice(0, 12) : "P" + (i + 1);
        return (
          '<button type="button" class="' +
          on +
          " " +
          has +
          '" data-preset="' +
          i +
          '" title="' +
          esc(s ? s.name : t("emptyPreset")) +
          '" aria-label="P' +
          (i + 1) +
          (s ? ": " + esc(s.name) : "") +
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
    state.presets[i] = normalizeStation(state.current) || state.current;
    lsSet("freq-presets", JSON.stringify(state.presets));
    renderPresets();
    toast(t("saved") + " P" + (i + 1));
  }
  function playPreset(i) {
    const s = state.presets[i];
    if (s) play(s);
    else toast(t("emptyPreset"));
  }
  function toast(msg, opts) {
    const el = $("toast");
    if (!el) return;
    const msgEl = $("toast-msg") || el;
    const act = $("toast-act");
    const options = opts || {};
    msgEl.textContent = msg;
    if (act) {
      if (options.action) {
        act.hidden = false;
        act.textContent = options.action;
        act.onclick = function () {
          el.hidden = true;
          act.hidden = true;
          if (typeof options.onAction === "function") options.onAction();
        };
      } else {
        act.hidden = true;
        act.onclick = null;
      }
    }
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
      if (act) act.hidden = true;
    }, options.duration || 2200);
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
    if (!station || !station.stationuuid) return;
    if (!state.stats.hits) state.stats.hits = {};
    if (!state.stats.tags) state.stats.tags = {};
    if (!state.stats.names) state.stats.names = {};
    state.stats.hits[station.stationuuid] = (state.stats.hits[station.stationuuid] || 0) + 1;
    state.stats.names[station.stationuuid] = station.name || "";
    String(station.tags || "")
      .split(",")
      .forEach(function (raw) {
        const tag = raw.trim().toLowerCase();
        if (!tag || tag.length > 32) return;
        state.stats.tags[tag] = (state.stats.tags[tag] || 0) + 1;
      });
    if (!state.stats.since) state.stats.since = Date.now();
    saveStats(true);
  }
  function saveStats(force) {
    const now = Date.now();
    if (!force && now - (state.statsSaveAt || 0) < 10000) return;
    state.statsSaveAt = now;
    lsSet("freq-stats", JSON.stringify(state.stats));
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
    if (!s || !s.stationuuid) return base;
    return base + "?s=" + encodeURIComponent(s.stationuuid);
  }
  async function copyText(value) {
    if (!value) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (_) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.insetInlineStart = "-9999px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand && document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch (_) {
      return false;
    }
  }
  async function copyStation(s) {
    if (!s) return;
    const url = stationUrl(s);
    const ok = await copyText(url);
    toast(ok ? t("copied") : url, { duration: ok ? 2200 : 6000 });
  }
  async function shareStation(s) {
    if (!s) return;
    const url = stationUrl(s);
    const title = (s.name || "FREQ") + " — FREQ";
    if (navigator.share) {
      try {
        await navigator.share({ title: title, text: title, url: url });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    const ok = await copyText(url);
    toast(ok ? t("shared") : url, { duration: ok ? 2200 : 6000 });
  }
  function voteStation(s) {
    if (!s) return;
    getJSON("/json/vote/" + encodeURIComponent(s.stationuuid), { noCache: true })
      .then(function () { toast(t("voted")); })
      .catch(function () { toast(t("voted")); });
  }
  function exportFavs() {
    const payload = {
      app: "FREQ",
      v: 3,
      exportedAt: new Date().toISOString(),
      favs: state.favs,
      presets: state.presets.filter(Boolean),
      folders: state.folders,
      recents: state.recents.slice(0, 40),
      stats: state.stats,
      settings: {
        theme: state.theme,
        playerStyle: state.playerStyle,
        lang: state.lang,
        sort: state.sort,
        wave: state.wave,
        hd: state.hd,
      },
    };
    if (typeof URL === "undefined" || !URL.createObjectURL) return;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "freq-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 800);
    toast(t("saved"));
  }
  function importFavs(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        if (Array.isArray(data.favs)) {
          state.favs = uniqueStations(normalizeStations(data.favs).concat(state.favs)).slice(0, 200);
          saveFavs();
        }
        if (Array.isArray(data.presets)) {
          state.presets = padPresets(
            data.presets.map(function (s) { return normalizeStation(s); })
          );
          lsSet("freq-presets", JSON.stringify(state.presets));
        }
        if (Array.isArray(data.folders)) {
          state.folders = data.folders
            .map(function (f) {
              return {
                id: String((f && f.id) || "f" + Math.random().toString(36).slice(2)),
                name: String((f && f.name) || "").slice(0, 24),
                ids: Array.isArray(f && f.ids) ? f.ids.filter(function (x) { return typeof x === "string"; }) : [],
              };
            })
            .slice(-20);
          saveFolders();
        }
        if (Array.isArray(data.recents)) {
          state.recents = uniqueStations(normalizeStations(data.recents).concat(state.recents)).slice(0, 40);
          lsSet("freq-recents", JSON.stringify(state.recents));
        }
        if (data.stats && typeof data.stats.ms === "number") {
          state.stats = {
            ms: Math.max(0, data.stats.ms),
            hits: data.stats.hits && typeof data.stats.hits === "object" ? data.stats.hits : {},
            tags: data.stats.tags && typeof data.stats.tags === "object" ? data.stats.tags : {},
            names: data.stats.names && typeof data.stats.names === "object" ? data.stats.names : {},
            since: Number(data.stats.since) || 0,
          };
          saveStats(true);
        }
        if (data.settings) {
          if (data.settings.theme) constThemeExists(data.settings.theme);
          if (data.settings.playerStyle) {
            state.playerStyle = playerStyleById(data.settings.playerStyle).id;
            lsSet("freq-player-style", state.playerStyle);
          }
          if (data.settings.sort) state.sort = String(data.settings.sort);
          if (data.settings.wave) state.wave = String(data.settings.wave);
          if (typeof data.settings.hd === "boolean") state.hd = data.settings.hd;
          if (data.settings.lang === "fa" || data.settings.lang === "en") {
            state.lang = data.settings.lang;
            lsSet("freq-lang", state.lang);
            applyI18n();
          }
        }
        renderPresets();
        renderFolders();
        renderLangs();
        renderSorts();
        syncHdBtn();
        applyTheme();
        applyPlayerStyle();
        if (state.mode === "fav") state.stations = state.favs.slice();
        renderList();
        toast(t("saved"));
      } catch (_) {
        toast(t("badLink"));
      }
    };
    reader.readAsText(file);
  }
  function constThemeExists(id) {
    const th = THEMES.find(function (x) { return x.id === id; });
    if (th) {
      state.theme = th.id;
      lsSet("freq-theme", th.id);
    }
  }
  function resetAllData() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.indexOf("freq-") === 0) keys.push(key);
      }
      keys.forEach(function (key) { localStorage.removeItem(key); });
    } catch (_) {}
    toast(t("resetDone"));
    setTimeout(function () { location.reload(); }, 500);
  }
  function openAbout() {
    const el = $("about");
    if (el && el.hidden) pushLayer("about");
    if (el) el.hidden = false;
  }
  function closeAbout(fromPop) {
    const el = $("about");
    const was = el && !el.hidden;
    if (el) el.hidden = true;
    if (was) dropLayer("about", fromPop);
  }
  function openHelp() {
    const el = $("help");
    if (el && el.hidden) pushLayer("help");
    if (el) el.hidden = false;
  }
  function closeHelp(fromPop) {
    const el = $("help");
    const was = el && !el.hidden;
    if (el) el.hidden = true;
    if (was) dropLayer("help", fromPop);
  }
  function setRds(s) {
    const tags = s && s.tags ? String(s.tags).split(",").filter(Boolean).slice(0, 8).join("  ·  ") : "";
    const line = s ? [s.name, s.country, s.codec, tags].filter(Boolean).join("   ·   ") : "";
    setText("p-rds", line);
    setText("s-rds", line);
  }
  async function applyDeepLink() {
    if (!state.deepLinkStation) return;
    const sid = state.deepLinkStation;
    let s = findStation(sid);
    if (!s) {
      try {
        const data = await getJSON("/json/stations/byuuid/" + encodeURIComponent(sid), { ttl: 10 * 60 * 1000 });
        if (Array.isArray(data) && data[0]) s = normalizeStation(data[0]);
      } catch (_) {}
    }
    if (!s) {
      toast(t("notFound"));
      return;
    }
    play(s);
  }


  function renderWaves() {
    const box = $("waves");
    if (!box) return;
    box.innerHTML = ["am", "fm", "sw"]
      .map(function (id) {
        const on = state.wave === id;
        return (
          '<button type="button" class="' + (on ? "on" : "") + '" data-wave="' + id +
          '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(t(id)) + "</button>"
        );
      })
      .join("");
  }
  function setWave(id) {
    state.wave = id === "am" || id === "sw" ? id : "fm";
    lsSet("freq-wave", state.wave);
    renderWaves();
    if (state.mode === "browse") loadStations().catch(function () {});
    syncUrl();
  }
  function syncHdBtn() {
    const b = $("hd-btn");
    if (!b) return;
    b.classList.toggle("on", !!state.hd);
    b.setAttribute("aria-pressed", state.hd ? "true" : "false");
  }
  function toggleHd() {
    state.hd = !state.hd;
    lsSet("freq-hd", state.hd ? "1" : "0");
    syncHdBtn();
    if (state.mode === "browse") loadStations().catch(function () {});
  }
  function hideStation(s) {
    const station = normalizeStation(s);
    if (!station) return;
    if (state.hidden.indexOf(station.stationuuid) < 0) state.hidden.push(station.stationuuid);
    state.hidden = state.hidden.slice(-500);
    lsSet("freq-hidden", JSON.stringify(state.hidden));
    state.stations = state.stations.filter(function (x) { return x.stationuuid !== station.stationuuid; });
    renderList();
    closeSheet();
    toast(t("hidden"), {
      action: t("undo"),
      duration: 5200,
      onAction: function () {
        state.hidden = state.hidden.filter(function (id) { return id !== station.stationuuid; });
        lsSet("freq-hidden", JSON.stringify(state.hidden));
        if (state.mode === "fav" || state.mode === "recent" || state.mode === "folder") applyLocalMode();
        else loadStations().catch(function () {});
      },
    });
  }
  function stopScan() {
    state.scanning = false;
    state.scanGen = (state.scanGen || 0) + 1;
    if (state.scanTimer) {
      clearTimeout(state.scanTimer);
      state.scanTimer = 0;
    }
  }
  function startScan() {
    if (state.scanning) {
      stopScan();
      toast(t("sleepOff"));
      return;
    }
    if (!state.stations.length) {
      toast(t("empty"));
      return;
    }
    stopScan();
    state.scanning = true;
    const gen = state.scanGen;
    toast(t("scanning"), { duration: 1800 });
    function step() {
      if (!state.scanning || gen !== state.scanGen) return;
      playRel(1);
      state.scanTimer = setTimeout(function () {
        if (!state.scanning || gen !== state.scanGen) return;
        if (state.playing) {
          stopScan();
          toast(t("tuned"));
        } else {
          step();
        }
      }, 2800);
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
      syncDockSleep();
      const audio = $("audio");
      if (audio) audio.pause();
      state.playing = false;
      state.buffering = false;
      state.status = "";
      setVol(state.userVol || 0.85, true);
      renderPlayer();
      saveStats(true);
      toast(t("sleepOff"));
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
    closeStand();
    toast(t("snooze"));
  }
  function openStand() {
    const was = !!state.night;
    state.night = true;
    const el = $("stand");
    if (el) el.hidden = false;
    document.body.classList.add("stand-on");
    tickStand();
    if (!was) pushLayer("stand");
  }
  function closeStand(fromPop) {
    const was = !!state.night;
    state.night = false;
    const el = $("stand");
    if (el) el.hidden = true;
    document.body.classList.remove("stand-on");
    if (was) dropLayer("stand", fromPop);
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
    state.weather = weatherText();
    setText("stand-wx", state.weather || "");
    setText("stand-st", (state.current && state.current.name) || "FREQ");
    setText("s-wx", state.weather || "");
  }
  function weatherSky(code) {
    const fa = state.lang === "fa";
    if (code === 0) return fa ? "آفتابی" : "clear";
    if (code < 4) return fa ? "کمی ابری" : "partly cloudy";
    if (code < 50) return fa ? "ابری" : "cloudy";
    if (code < 70) return fa ? "باران" : "rain";
    if (code < 80) return fa ? "برف" : "snow";
    return fa ? "رعد" : "storm";
  }
  function weatherText() {
    const wx = state.wx;
    if (!wx || !Number.isFinite(Number(wx.temp))) return "";
    return Math.round(Number(wx.temp)) + "° · " + weatherSky(Number(wx.code) || 0);
  }
  async function loadWeather(force) {
    const cached = safeParse("freq-wx", null);
    if (!force && cached && Number.isFinite(Number(cached.at)) && Date.now() - Number(cached.at) < 30 * 60 * 1000) {
      state.wx = cached.wx;
      state.weather = weatherText();
      tickStand();
      return;
    }
    let lat = null;
    let lon = null;
    if (state.geo && Number.isFinite(state.geo.lat) && Number.isFinite(state.geo.lon)) {
      lat = state.geo.lat;
      lon = state.geo.lon;
    } else {
      const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
      if (tz.indexOf("tehran") >= 0) {
        lat = 35.6892;
        lon = 51.389;
      }
    }
    if (lat === null || lon === null) return;
    try {
      const url =
        "https://api.open-meteo.com/v1/forecast?latitude=" +
        encodeURIComponent(lat) +
        "&longitude=" +
        encodeURIComponent(lon) +
        "&current=temperature_2m,weather_code&timezone=auto";
      const res = await fetch(url, { credentials: "omit" });
      if (!res.ok) return;
      const json = await res.json();
      const current = (json && json.current) || {};
      state.wx = { temp: Number(current.temperature_2m), code: Number(current.weather_code) || 0 };
      lsSet("freq-wx", JSON.stringify({ at: Date.now(), wx: state.wx }));
      state.weather = weatherText();
      tickStand();
    } catch (_) {}
  }
  function shareTelegram(station) {
    if (!station) return;
    const url =
      "https://t.me/share/url?url=" +
      encodeURIComponent(stationUrl(station)) +
      "&text=" +
      encodeURIComponent((station.name || "FREQ") + " — FREQ");
    try {
      window.open(url, "_blank", "noopener");
    } catch (_) {}
  }

  function saveFolders() {
    lsSet("freq-folders", JSON.stringify(state.folders || []));
  }
  function renderFolders() {
    const box = $("folders");
    if (!box) return;
    const items = (state.folders || []).map(function (f) {
      const on = state.mode === "folder" && state.folderId === f.id ? "on" : "";
      return (
        '<button type="button" class="' + on + '" data-folder="' + esc(f.id) + '" aria-pressed="' +
        (on ? "true" : "false") + '">' + esc(f.name) + "</button>"
      );
    }).join("");
    box.innerHTML = items;
  }
  function newFolder() {
    const inp = $("folder-name");
    const name = ((inp && inp.value) || "").trim();
    if (!name) { toast(t("folderPh")); return; }
    if (state.folders.length >= 20) { toast(t("noFolder")); return; }
    const id = "f" + Date.now().toString(36);
    state.folders = (state.folders || []).concat([{ id: id, name: name, ids: [] }]).slice(-20);
    state.folderId = id;
    saveFolders();
    if (inp) inp.value = "";
    renderFolders();
    toast(t("saved"));
  }
  function addToFolder() {
    if (!state.current) {
      toast(t("empty"));
      return;
    }
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
    state.homeAll = false;
    closeFilters();
    renderFolders();
    loadStations().catch(function () {});
    syncUrl();
  }
  function toggleMap() {
    if (state.mapOpen) closeMap();
    else openMap();
  }
  function closeMap(fromPop) {
    const was = !!state.mapOpen;
    state.mapOpen = false;
    const el = $("map");
    if (el) el.hidden = true;
    if (was) dropLayer("map", fromPop);
  }
  async function openMap() {
    const was = !!state.mapOpen;
    state.mapOpen = true;
    closeCar();
    const el = $("map");
    if (el) el.hidden = false;
    if (!was) pushLayer("map");
    await loadMapPts();
    drawMap();
  }
  async function loadMapPts() {
    let pts = (state.stations || [])
      .filter(function (s) { return s.geo_lat !== null && s.geo_long !== null; })
      .map(function (s) { return { lat: Number(s.geo_lat), lon: Number(s.geo_long), s: s }; });
    if (pts.length < 60) {
      try {
        const extra = await getJSON(
          "/json/stations/search?hidebroken=true&is_https=true&has_geo_info=true&limit=400&order=clickcount&reverse=true",
          { ttl: 5 * 60 * 1000 }
        );
        const seen = Object.create(null);
        pts.forEach(function (p) { seen[p.s.stationuuid] = 1; });
        normalizeStations(extra || []).forEach(function (st) {
          if (seen[st.stationuuid] || st.geo_lat === null) return;
          seen[st.stationuuid] = 1;
          pts.push({ lat: Number(st.geo_lat), lon: Number(st.geo_long), s: st });
        });
        remember(pts.map(function (p) { return p.s; }));
      } catch (_) {}
    }
    state.mapPts = pts.slice(0, 500);
    const hint = $("map-hint");
    if (hint) hint.textContent = state.mapPts.length ? t("mapHint") : t("mapEmpty");
  }
  function mapXY(lat, lon, w, h) {
    return { x: ((lon + 180) / 360) * w, y: ((90 - lat) / 180) * h };
  }
  function drawMap() {
    const c = $("map-c");
    if (!c || !c.getContext) return;
    const ctx = c.getContext("2d");
    const host = c.parentElement;
    const w = (host && host.clientWidth) || window.innerWidth;
    const h = Math.max(280, ((host && host.clientHeight) || window.innerHeight) - 90);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    c.width = Math.max(1, Math.round(w * dpr));
    c.height = Math.max(1, Math.round(h * dpr));
    c.style.width = w + "px";
    c.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const col = themeCols();
    const wash = ctx.createRadialGradient(w * 0.5, h * 0.35, 20, w * 0.5, h * 0.4, Math.max(w, h) * 0.72);
    wash.addColorStop(0, "rgba(" + col.accRgb + ",0.14)");
    wash.addColorStop(1, col.bg);
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(" + col.iceRgb + ",0.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= 12; x += 1) {
      ctx.beginPath();
      ctx.moveTo((x / 12) * w, 0);
      ctx.lineTo((x / 12) * w, h);
      ctx.stroke();
    }
    for (let y = 0; y <= 6; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, (y / 6) * h);
      ctx.lineTo(w, (y / 6) * h);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(" + col.accRgb + ",0.24)";
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    const pts = state.mapPts || [];
    pts.forEach(function (pt) {
      const xy = mapXY(pt.lat, pt.lon, w, h);
      const on = sameStation(state.current, pt.s);
      if (on) {
        ctx.beginPath();
        ctx.arc(xy.x, xy.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + col.accRgb + ",0.22)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(xy.x, xy.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = col.acc;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(xy.x, xy.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + col.iceRgb + ",0.72)";
        ctx.fill();
      }
    });
    if (state.geo) {
      const me = mapXY(state.geo.lat, state.geo.lon, w, h);
      ctx.beginPath();
      ctx.arc(me.x, me.y, 9, 0, Math.PI * 2);
      ctx.strokeStyle = col.ice;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(me.x, me.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = col.ice;
      ctx.fill();
    }
    if (!pts.length) {
      ctx.fillStyle = "rgba(" + col.iceRgb + ",0.6)";
      ctx.font = "600 14px " + (window.getComputedStyle(document.body).fontFamily || "sans-serif");
      ctx.textAlign = "center";
      ctx.fillText(t("mapEmpty"), w / 2, h / 2 + 4);
    }
  }
  function hitMap(ev) {
    const c = $("map-c");
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    let best = null;
    let bestD = 26;
    (state.mapPts || []).forEach(function (pt) {
      const xy = mapXY(pt.lat, pt.lon, r.width, r.height);
      const d = Math.hypot(xy.x - x, xy.y - y);
      if (d < bestD) {
        bestD = d;
        best = pt;
      }
    });
    if (best) {
      play(best.s);
      closeMap();
    }
  }
  function toggleCar() {
    if (state.carOpen) closeCar();
    else openCar();
  }
  function openCar() {
    const was = !!state.carOpen;
    state.carOpen = true;
    closeMap();
    const el = $("car");
    if (el) el.hidden = false;
    renderPlayer();
    if (!was) pushLayer("car");
  }
  function closeCar(fromPop) {
    const was = !!state.carOpen;
    state.carOpen = false;
    const el = $("car");
    if (el) el.hidden = true;
    if (was) dropLayer("car", fromPop);
  }


  function themeById(id) {
    return THEMES.find(function (x) { return x.id === id; }) || THEMES[0];
  }
  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  let colsCache = null;
  function themeCols() {
    if (colsCache) return colsCache;
    colsCache = {
      acc: cssVar("--acc", "#ff4d2e"),
      ice: cssVar("--ice", "#7dd3fc"),
      accRgb: cssVar("--acc-rgb", "255,77,46"),
      iceRgb: cssVar("--ice-rgb", "125,211,252"),
      bgRgb: cssVar("--bg-rgb", "9,9,11"),
      bg: cssVar("--bg", "#09090b"),
    };
    return colsCache;
  }
  function applyTheme() {
    const th = themeById(state.theme);
    state.theme = th.id;
    const r = document.documentElement;
    r.setAttribute("data-theme", th.id);
    r.setAttribute("data-skin", th.light ? "light" : "dark");
    r.style.setProperty("--bg", th.bg);
    r.style.setProperty("--panel", th.panel);
    r.style.setProperty("--acc", th.acc);
    r.style.setProperty("--ice", th.ice);
    r.style.setProperty("--text", th.text);
    r.style.setProperty("--muted", th.muted);
    r.style.setProperty("--line", th.line);
    r.style.setProperty("--player", th.player);
    r.style.setProperty("--cabinet", th.cabinet);
    r.style.setProperty("--ink", th.ink);
    r.style.setProperty("--wash", th.wash);
    r.style.setProperty("--acc-rgb", hexRgb(th.acc));
    r.style.setProperty("--ice-rgb", hexRgb(th.ice));
    r.style.setProperty("--bg-rgb", hexRgb(th.bg));
    r.style.colorScheme = th.light ? "light" : "dark";
    colsCache = null;
    lsSet("freq-theme", th.id);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", th.bg);
    const btn = $("theme-btn");
    const themeName = state.lang === "fa" ? th.fa : th.en;
    if (btn) {
      btn.textContent = t("theme") + " · " + themeName;
      btn.setAttribute("aria-label", t("theme") + ": " + themeName);
    }
    renderThemeGrid();
    if (state.mapOpen) drawMap();
  }
  function renderThemeGrid() {
    const box = $("theme-grid");
    if (!box) return;
    box.innerHTML = THEMES.map(function (th) {
      const on = th.id === state.theme ? "on" : "";
      const name = state.lang === "fa" ? th.fa : th.en;
      const sub = state.lang === "fa" ? th.en : th.fa;
      return (
        '<button type="button" class="theme-tile ' + on + '" data-tid="' + th.id + '" aria-pressed="' + (on ? "true" : "false") + '">' +
        '<div class="theme-preview" style="--tp-bg:' + th.bg + ";--tp-acc:" + th.acc + ";--tp-ice:" + th.ice + '"><em></em></div>' +
        "<b>" + esc(name) + "</b><span>" + esc(sub) + "</span></button>"
      );
    }).join("");
    const countText = t("themeCount");
    setText(
      "theme-count",
      typeof countText === "function"
        ? countText(formatNumber(THEMES.length, state.lang === "fa" ? "fa-IR" : "en-US"))
        : String(countText)
    );
  }
  function openThemes() {
    const el = $("themes");
    if (el && el.hidden) pushLayer("themes");
    if (el) el.hidden = false;
    const b = $("theme-btn");
    if (b) b.classList.add("on");
    renderThemeGrid();
    if (b) {
      b.classList.add("on");
      b.setAttribute("aria-expanded", "true");
    }
  }
  function closeThemes(fromPop) {
    const el = $("themes");
    const was = el && !el.hidden;
    if (el) el.hidden = true;
    const b = $("theme-btn");
    if (b) {
      b.classList.remove("on");
      b.setAttribute("aria-expanded", "false");
    }
    if (was) dropLayer("themes", fromPop);
  }
  function toggleThemes() {
    const el = $("themes");
    if (el && !el.hidden) closeThemes();
    else openThemes();
  }
  function setTheme(id) {
    const th = themeById(id);
    const commit = function () {
      state.theme = th.id;
      applyTheme();
    };
    try {
      if (document.startViewTransition && !prefersReducedMotion()) {
        document.startViewTransition(commit);
      } else {
        commit();
      }
    } catch (_) {
      commit();
    }
    toast(state.lang === "fa" ? th.fa : th.en);
  }
  function applyPlayerStyle() {
    const style = playerStyleById(state.playerStyle);
    state.playerStyle = style.id;
    document.documentElement.setAttribute("data-player-style", style.id);
    const player = $("player");
    const stage = $("stage");
    if (player) player.setAttribute("data-player-style", style.id);
    if (stage) stage.setAttribute("data-player-style", style.id);
    lsSet("freq-player-style", style.id);
    const name = state.lang === "fa" ? style.fa : style.en;
    const button = $("player-style-btn");
    if (button) button.setAttribute("aria-label", t("playerStyle") + ": " + name);
    setText("player-style-current", name);
    renderPlayerStyleGrid();
    syncChrome();
  }
  function renderPlayerStyleGrid() {
    const box = $("player-style-grid");
    if (box) {
      box.innerHTML = PLAYER_STYLES.map(function (style) {
        const on = style.id === state.playerStyle;
        const name = state.lang === "fa" ? style.fa : style.en;
        const hint = state.lang === "fa" ? style.faHint : style.enHint;
        return (
          '<button type="button" class="player-style-tile ' + (on ? "on" : "") + '" data-style-id="' +
          esc(style.id) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
          '<span class="player-preview" data-player-preview="' + esc(style.id) + '" aria-hidden="true">' +
          '<i class="pp-art"></i><span class="pp-meta"><i></i><i></i></span>' +
          '<span class="pp-controls"><i></i><b></b><i></i></span></span>' +
          '<b class="player-style-name">' + esc(name) + '</b><span class="player-style-hint">' + esc(hint) +
          "</span></button>"
        );
      }).join("");
    }
    const countText = t("playerStyleCount");
    setText(
      "player-style-count",
      typeof countText === "function"
        ? countText(formatNumber(PLAYER_STYLES.length, state.lang === "fa" ? "fa-IR" : "en-US"))
        : String(countText)
    );
  }
  function openPlayerStyles() {
    const el = $("playerstyles");
    if (el && el.hidden) pushLayer("playerstyles");
    if (el) el.hidden = false;
    const button = $("player-style-btn");
    if (button) {
      button.classList.add("on");
      button.setAttribute("aria-expanded", "true");
    }
    renderPlayerStyleGrid();
  }
  function closePlayerStyles(fromPop) {
    const el = $("playerstyles");
    const was = el && !el.hidden;
    if (el) el.hidden = true;
    const button = $("player-style-btn");
    if (button) {
      button.classList.remove("on");
      button.setAttribute("aria-expanded", "false");
    }
    if (was) dropLayer("playerstyles", fromPop);
  }
  function togglePlayerStyles() {
    const el = $("playerstyles");
    if (el && !el.hidden) closePlayerStyles();
    else openPlayerStyles();
  }
  function setPlayerStyle(id) {
    const style = playerStyleById(id);
    const commit = function () {
      state.playerStyle = style.id;
      applyPlayerStyle();
    };
    try {
      if (document.startViewTransition && !prefersReducedMotion()) {
        document.startViewTransition(commit);
      } else {
        commit();
      }
    } catch (_) {
      commit();
    }
    toast(state.lang === "fa" ? style.fa : style.en);
  }
  function topEntries(obj, n) {
    return Object.keys(obj || {})
      .map(function (k) { return [k, Number(obj[k]) || 0]; })
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, n);
  }
  function renderWrap() {
    const box = $("wrap-body");
    if (!box) return;
    if (!state.stats.tags || typeof state.stats.tags !== "object") state.stats.tags = {};
    if (!state.stats.names || typeof state.stats.names !== "object") state.stats.names = {};
    const hours = ((state.stats.ms || 0) / 3600000).toFixed(1);
    const n = Object.keys(state.stats.hits || {}).length;
    const favn = (state.favs || []).length;
    const th = themeById(state.theme);
    const tops = topEntries(state.stats.hits, 6)
      .map(function (pair) {
        const id = pair[0];
        const s = findStation(id);
        const name = (s && s.name) || state.stats.names[id] || id.slice(0, 10);
        return (
          '<li><button type="button" class="wrap-play" data-play="' + esc(id) + '">' +
          esc(name) + "</button><span>" + formatNumber(pair[1]) + "</span></li>"
        );
      })
      .join("");
    const gens = topEntries(state.stats.tags, 8)
      .map(function (pair) {
        return "<em>" + esc(pair[0]) + " · " + formatNumber(pair[1]) + "</em>";
      })
      .join("");
    const since = state.stats.since
      ? '<p class="themes-sub">' +
        esc(t("since")) +
        " " + esc(new Date(state.stats.since).toLocaleDateString(state.lang === "fa" ? "fa-IR" : "en-GB")) +
        "</p>"
      : "";
    box.innerHTML =
      '<div class="wrap-nums">' +
      "<div><b>" + esc(hours) + "</b><span>" + esc(t("hours")) + "</span></div>" +
      "<div><b>" + formatNumber(n) + "</b><span>" + esc(t("heard")) + "</span></div>" +
      "<div><b>" + formatNumber(favn) + "</b><span>" + esc(t("fav")) + "</span></div>" +
      "</div>" +
      '<div class="wrap-theme">' + esc(t("theme")) + " · " + esc(state.lang === "fa" ? th.fa : th.en) + "</div>" +
      since +
      (tops ? "<h4>" + esc(t("topStations")) + '</h4><ol class="wrap-ol">' + tops + "</ol>" : "") +
      (gens ? "<h4>" + esc(t("topGenres")) + '</h4><div class="wrap-tags">' + gens + "</div>" : "") +
      (!tops && !gens ? '<p class="themes-sub">' + esc(t("wrapEmpty")) + "</p>" : "") +
      '<div class="wrap-actions"><button type="button" class="ghost wide" data-reset-stats="1">' +
      esc(t("resetStats")) + "</button></div>";
  }
  function openWrap() {
    const el = $("wrap");
    if (!el) return;
    if (el.hidden) pushLayer("wrap");
    renderWrap();
    el.hidden = false;
    const b = $("wrap-btn");
    if (b) {
      b.classList.add("on");
      b.setAttribute("aria-expanded", "true");
    }
  }
  function closeWrap(fromPop) {
    const el = $("wrap");
    const was = el && !el.hidden;
    if (el) el.hidden = true;
    const b = $("wrap-btn");
    if (b) {
      b.classList.remove("on");
      b.setAttribute("aria-expanded", "false");
    }
    if (was) dropLayer("wrap", fromPop);
  }
  function toggleWrap() {
    const el = $("wrap");
    if (!el) return;
    if (!el.hidden) {
      closeWrap();
      return;
    }
    closeSettings();
    openWrap();
  }
  function startVoice() {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      toast(t("noVoice"));
      return;
    }
    try {
      if (state.rec) {
        state.rec.stop();
        state.rec = null;
      }
    } catch (_) {}
    const rec = new Rec();
    rec.lang = state.lang === "fa" ? "fa-IR" : "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    const btn = $("mic-btn");
    if (btn) {
      btn.classList.add("on");
      btn.setAttribute("aria-pressed", "true");
    }
    rec.onresult = function (e) {
      const said = (e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript) || "";
      if ($("q")) $("q").value = said;
      state.q = said;
      state.mode = "browse";
      state.homeAll = !!String(said).trim();
      loadStations().catch(function () {});
      syncUrl();
    };
    rec.onend = function () {
      if (btn) {
        btn.classList.remove("on");
        btn.setAttribute("aria-pressed", "false");
      }
      state.rec = null;
    };
    rec.onerror = function () {
      if (btn) {
        btn.classList.remove("on");
        btn.setAttribute("aria-pressed", "false");
      }
      toast(t("noVoice"));
    };
    state.rec = rec;
    try {
      rec.start();
      toast(t("listening"));
    } catch (_) {
      if (btn) {
        btn.classList.remove("on");
        btn.setAttribute("aria-pressed", "false");
      }
      toast(t("noVoice"));
    }
  }
  function syncFiltersBtn() {
    const b = $("filters-btn");
    const box = $("filters");
    if (b) {
      b.classList.toggle("on", !!state.filtersOpen);
      b.setAttribute("aria-expanded", state.filtersOpen ? "true" : "false");
    }
    if (box) box.hidden = !state.filtersOpen;
  }
  function closeFilters(fromPop) {
    const was = !!state.filtersOpen;
    state.filtersOpen = false;
    syncFiltersBtn();
    if (was) dropLayer("filters", fromPop);
  }
  function hideExploreTip() {
    document.querySelectorAll(".neon-tip").forEach(function (el) { el.hidden = true; });
    lsSet("freq-seen-filter", "1");
  }
  function toggleFilters() {
    hideExploreTip();
    if (state.filtersOpen) {
      closeFilters();
      return;
    }
    closeSettings();
    state.filtersOpen = true;
    syncFiltersBtn();
    pushLayer("filters");
  }
  function closeSettings(fromPop) {
    const el = $("settings");
    const was = el && !el.hidden;
    if (el) el.hidden = true;
    const b = $("settings-btn");
    if (b) {
      b.classList.remove("on");
      b.setAttribute("aria-expanded", "false");
    }
    if (was) dropLayer("settings", fromPop);
  }
  function toggleSettings() {
    const el = $("settings");
    if (!el) return;
    if (!el.hidden) {
      closeSettings();
      return;
    }
    closeFilters();
    el.hidden = false;
    const b = $("settings-btn");
    if (b) {
      b.classList.add("on");
      b.setAttribute("aria-expanded", "true");
    }
    pushLayer("settings");
  }
  async function loadDiscover() {
    const entries = []
      .concat((state.favs || []).map(function (s) { return { tags: s.tags, weight: 3 }; }))
      .concat((state.recents || []).map(function (s) { return { tags: s.tags, weight: 2 }; }))
      .concat(
        topEntries(state.stats.tags || {}, 10).map(function (pair) {
          return { tags: pair[0], weight: Math.min(6, pair[1]) };
        })
      );
    const tags = topTags(entries, 3);
    if (!tags.length) return;
    const tag = tags[0].tag;
    try {
      const data = await getJSON(
        "/json/stations/search?hidebroken=true&is_https=true&limit=30&order=clickcount&reverse=true&tag=" +
          encodeURIComponent(tag),
        { ttl: 5 * 60 * 1000 }
      );
      const exclude = Object.create(null);
      [state.current].concat(state.favs, state.recents).forEach(function (s) {
        if (s && s.stationuuid) exclude[s.stationuuid] = 1;
      });
      state.forYou = normalizeStations(data)
        .filter(function (s) { return !exclude[s.stationuuid]; })
        .slice(0, 12);
      state.forYouTag = tag;
      remember(state.forYou);
      if (isHome()) renderList();
    } catch (_) {}
  }

  function requestGeo(timeout) {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        function () { resolve(null); },
        { timeout: timeout || 9000, maximumAge: 10 * 60 * 1000, enableHighAccuracy: false }
      );
    });
  }
  function storeGeo(coords) {
    if (!coords) return;
    state.geo = { lat: Number(coords.lat), lon: Number(coords.lon), at: Date.now() };
    lsSet("freq-geo", JSON.stringify(state.geo));
    syncGeoBtn();
  }
  function syncGeoBtn() {
    const b = $("geo-btn");
    if (!b) return;
    b.textContent = state.geo ? t("location") + " ✓" : t("useLocation");
    b.classList.toggle("on", !!state.geo);
  }
  async function enableGeo() {
    if (!navigator.geolocation) {
      toast(t("locationUnsupported"));
      return null;
    }
    const pos = await requestGeo();
    if (!pos) {
      toast(t("locationDenied"));
      return null;
    }
    storeGeo(pos);
    toast(t("locationOn"));
    loadWeather(true).catch(function () {});
    loadNear(true).catch(function () {});
    return pos;
  }

  async function loadNear(force) {
    if (!state.geo) {
      if (!force) return;
      const pos = await enableGeo();
      if (!pos) return;
    }
    const lat = state.geo.lat;
    const lon = state.geo.lon;
    try {
      const data = await getJSON(
        "/json/stations/search?hidebroken=true&is_https=true&has_geo_info=true&limit=300&order=clickcount&reverse=true",
        { ttl: 10 * 60 * 1000 }
      );
      const list = normalizeStations(data)
        .filter(function (s) { return s.geo_lat !== null && s.geo_long !== null; })
        .map(function (s) {
          const dy = s.geo_lat - lat;
          const dx = (s.geo_long - lon) * Math.cos((lat * Math.PI) / 180);
          s._d = dx * dx + dy * dy;
          return s;
        })
        .sort(function (a, b) { return a._d - b._d; })
        .slice(0, 20);
      state.nearList = list;
      remember(list);
      if (isHome()) renderList();
    } catch (_) {}
  }
  async function goNear() {
    if (!state.geo) {
      const pos = await enableGeo();
      if (!pos) return;
    }
    if (state.nearList && state.nearList.length) {
      state.mode = "browse";
      state.homeAll = true;
      state.cc = "";
      state.tag = "";
      state.band = "";
      state.q = "";
      if ($("q")) $("q").value = "";
      state.stations = state.nearList.slice();
      state.hasMore = false;
      state.error = false;
      renderCountries();
      renderGenres();
      renderBands();
      renderList();
      closeFilters();
      toast(t("near"));
      syncUrl();
      return;
    }
    closeFilters();
    state.mode = "browse";
    state.homeAll = true;
    await loadNear(true);
    if (state.nearList.length) {
      state.stations = state.nearList.slice();
      state.hasMore = false;
      renderList();
    } else {
      toast(t("nearEmpty"));
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

  function prefersReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (_) {
      return false;
    }
  }

  const fx = {
    raf: 0,
    t: 0,
    last: 0,
    motes: [],
    viz: null,
    wave: null,
    ring: null,
    w: 0,
    h: 0,
    waveW: 0,
    ringW: 0,
  };

  function fitCanvas(canvas, width, height) {
    if (!canvas) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function resizeFx() {
    const vizCanvas = $("viz");
    if (vizCanvas) {
      fx.w = window.innerWidth;
      fx.h = window.innerHeight;
      vizCanvas.style.width = fx.w + "px";
      vizCanvas.style.height = fx.h + "px";
      fx.viz = fitCanvas(vizCanvas, fx.w, fx.h);
    }
    const waveCanvas = $("p-wave");
    if (waveCanvas && waveCanvas.parentElement) {
      fx.waveW = Math.max(1, waveCanvas.parentElement.clientWidth);
      waveCanvas.style.width = fx.waveW + "px";
      fx.wave = fitCanvas(waveCanvas, fx.waveW, 26);
    }
    const ringCanvas = $("s-ring");
    if (ringCanvas) {
      const size = Math.round(ringCanvas.getBoundingClientRect().width) || 240;
      fx.ringW = size;
      fx.ring = fitCanvas(ringCanvas, size, size);
    }
    drawFx(true);
  }

  function drawViz() {
    const ctx = fx.viz;
    if (!ctx) return;
    const w = fx.w;
    const h = fx.h;
    const col = themeCols();
    const cx = w / 2;
    const cy = h * 0.38;
    const t = fx.t;
    ctx.clearRect(0, 0, w, h);
    const lamp = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.55);
    lamp.addColorStop(0, state.playing ? "rgba(" + col.accRgb + ",0.18)" : "rgba(" + col.iceRgb + ",0.07)");
    lamp.addColorStop(1, "rgba(" + col.bgRgb + ",0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, w, h);
    for (let i = 7; i >= 1; i -= 1) {
      const r = 28 + i * 38 + Math.sin(t * 1.4 + i) * (state.playing ? 10 : 3);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle =
        i % 2
          ? "rgba(" + col.accRgb + "," + (0.05 + i * 0.02) + ")"
          : "rgba(" + col.iceRgb + "," + (0.04 + i * 0.015) + ")";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 7 + (state.playing ? 3 : 0), 0, Math.PI * 2);
    ctx.fillStyle = state.playing ? col.acc : col.ice;
    ctx.shadowColor = state.playing ? col.acc : col.ice;
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
    fx.motes.forEach(function (m) {
      m.y -= m.s * 0.00035;
      if (m.y < 0) m.y = 1;
      ctx.beginPath();
      ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
    });
  }

  function drawWave() {
    const ctx = fx.wave;
    if (!ctx) return;
    const w = fx.waveW;
    const h = 26;
    const t = fx.t;
    const col = themeCols();
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    const amp = state.playing ? 7.5 : 2.2;
    for (let x = 0; x <= w; x += 3) {
      const y = h * 0.55 + Math.sin(x * 0.045 + t) * amp + Math.sin(x * 0.11 + t * 1.7) * (amp * 0.45);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "rgba(" + col.iceRgb + ",0)");
    gradient.addColorStop(0.2, "rgba(" + col.iceRgb + ",0.55)");
    gradient.addColorStop(0.55, "rgba(" + col.accRgb + ",0.85)");
    gradient.addColorStop(1, "rgba(" + col.iceRgb + ",0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  function drawRing() {
    const ctx = fx.ring;
    if (!ctx || !state.stageOpen) return;
    const size = fx.ringW;
    const t = fx.t;
    const cx = size / 2;
    const cy = size / 2;
    const col = themeCols();
    ctx.clearRect(0, 0, size, size);
    const bars = 64;
    const r0 = size * 0.42;
    for (let i = 0; i < bars; i += 1) {
      const a = (i / bars) * Math.PI * 2 - Math.PI / 2 + t * 0.15;
      const pulse = state.playing
        ? 10 + Math.abs(Math.sin(t * 3 + i * 0.45)) * 18 + Math.abs(Math.sin(t * 1.4 + i)) * 8
        : 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * (r0 + pulse), cy + Math.sin(a) * (r0 + pulse));
      ctx.strokeStyle = i % 2 ? "rgba(" + col.accRgb + ",0.72)" : "rgba(" + col.iceRgb + ",0.5)";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r0 - 6, 0, Math.PI * 2);
    ctx.strokeStyle = state.playing ? "rgba(" + col.accRgb + ",0.35)" : "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawFx(force) {
    if (!force && document.hidden) return;
    drawViz();
    drawWave();
    if (state.stageOpen) drawRing();
  }

  function startFx() {
    fx.motes = Array.from({ length: 40 }, function () {
      return {
        x: Math.random(),
        y: Math.random(),
        r: 0.4 + Math.random() * 1.4,
        s: 0.15 + Math.random() * 0.4,
      };
    });
    resizeFx();
    let resizeTimer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeFx, 120);
    });
    document.addEventListener("visibilitychange", function () {
      fx.last = 0;
      if (!document.hidden) drawFx(true);
    });
    function loop(now) {
      fx.raf = window.requestAnimationFrame(loop);
      if (document.hidden) return;
      const reduced = prefersReducedMotion();
      const interval = reduced ? 240 : 32;
      if (!fx.last) fx.last = now;
      if (now - fx.last < interval) return;
      fx.last = now;
      if (!reduced) fx.t += state.playing ? 0.018 : 0.006;
      drawFx();
    }
    fx.raf = window.requestAnimationFrame(loop);
  }

  function remember(list) {
    const extra = Array.isArray(list) ? list : list ? [list] : [];
    const have = {};
    (state.pool || []).forEach(function (s) {
      if (s && s.stationuuid) have[s.stationuuid] = s;
    });
    extra.forEach(function (s) {
      if (s && s.stationuuid) have[s.stationuuid] = s;
    });
    state.pool = Object.keys(have).slice(-400).map(function (k) { return have[k]; });
  }
  function findStation(id) {
    if (!id) return null;
    return (
      state.stations.find((x) => x.stationuuid === id) ||
      state.favs.find((x) => x.stationuuid === id) ||
      state.recents.find((x) => x.stationuuid === id) ||
      (state.forYou || []).find((x) => x.stationuuid === id) ||
      (state.nearList || []).find((x) => x.stationuuid === id) ||
      (state.pool || []).find((x) => x.stationuuid === id) ||
      (state.presets || []).find((x) => x && x.stationuuid === id) ||
      (state.current && state.current.stationuuid === id ? state.current : null)
    );
  }
  function closeSheet(fromPop) {
    const el = $("sheet");
    const was = el && !el.hidden;
    if (el) el.hidden = true;
    if (was) dropLayer("sheet", fromPop);
  }
  function openSheet(raw) {
    const s = normalizeStation(raw);
    if (!s) return;
    state.sheet = s;
    const el = $("sheet");
    if (!el) return;
    if (el.hidden) pushLayer("sheet");
    el.hidden = false;
    setText("sh-name", s.name || "—");
    setText(
      "sh-meta",
      [flag(s.countrycode), s.country, s.codec, s.bitrate ? s.bitrate + " kbps" : "", s.votes ? t("votes") + " " + formatNumber(s.votes) : ""]
        .filter(Boolean)
        .join(" · ")
    );
    setText("sh-tags", (s.tags || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 8).join(" · "));
    setArt($("sh-ico"), $("sh-ph"), s);
    const home = s.homepage && isWebUrl(s.homepage) ? s.homepage : "";
    const link = $("sh-home");
    if (link) {
      link.hidden = !home;
      if (home) link.href = home;
      else link.removeAttribute("href");
    }
    const play = $("sh-play");
    if (play) play.textContent = state.playing && sameStation(state.current, s) ? t("pause") : t("play");
  }

  /* ---------------------------------------------------------------------
     Real directory numbers, network state, URL state and PWA plumbing
     --------------------------------------------------------------------- */

  function renderDirectoryStats() {
    const countEl = $("live-n");
    const pill = $("live-pill");
    const stats = state.dirStats;
    const total = stats && Number.isFinite(Number(stats.stations)) ? Number(stats.stations) : 0;
    if (countEl) countEl.textContent = total ? formatNumber(total, "en-US") : "—";
    if (pill) {
      const label = t("stationsLiveTitle") + (total ? " · " + formatNumber(total, "en-US") : "");
      pill.setAttribute("aria-label", label);
      pill.setAttribute("title", label);
    }
  }
  async function loadDirectoryStats() {
    if (
      state.dirStats &&
      Number.isFinite(Number(state.dirStats.at)) &&
      Date.now() - Number(state.dirStats.at) < DIRSTATS_TTL
    ) {
      renderDirectoryStats();
      return;
    }
    if (state.offline) {
      renderDirectoryStats();
      return;
    }
    try {
      const data = await getJSON("/json/stats", { ttl: DIRSTATS_TTL });
      if (data && Number.isFinite(Number(data.stations))) {
        state.dirStats = {
          stations: Number(data.stations),
          countries: Number(data.countries) || 0,
          at: Date.now(),
        };
        lsSet("freq-dirstats", JSON.stringify(state.dirStats));
      }
    } catch (_) {}
    renderDirectoryStats();
  }

  function setNetBar(offline, back) {
    const bar = $("offline");
    if (!bar) return;
    bar.hidden = !offline;
    bar.classList.toggle("is-back", !!back);
    const text = $("offline-text");
    if (text) text.textContent = offline ? t("offlineBody") : t("onlineNow");
  }

  function retryLoad() {
    state.error = false;
    state.offline = typeof navigator !== "undefined" && navigator.onLine === false;
    const loader = $("loader");
    if (loader && loader.classList.contains("failed")) {
      loader.classList.remove("failed");
      setText("load-sub", t("loading"));
      const retry = $("load-retry");
      if (retry) retry.hidden = true;
    }
    loadStations().catch(function () {});
    loadDirectoryStats();
    loadCountries();
  }

  function rememberSearch(value) {
    const q = String(value || "").trim();
    if (q.length < 2) return;
    state.searches = [q]
      .concat(state.searches.filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); }))
      .slice(0, 6);
    lsSet("freq-searches", JSON.stringify(state.searches));
    renderSearchHints();
  }
  function renderSearchHints() {
    const box = $("search-hints");
    if (!box) return;
    box.innerHTML = state.searches.map(function (q) {
      return '<option value="' + esc(q) + '"></option>';
    }).join("");
  }

  function readUrlState() {
    const params = new URLSearchParams(location.search);
    const f = parseFilters(params);
    if (f.view === "fav" || f.view === "recent") state.mode = f.view;
    if (f.cc) {
      state.cc = f.cc;
      state.homeAll = true;
    }
    if (f.tag) {
      state.tag = f.tag;
      state.band = f.tag;
      state.homeAll = true;
    }
    if (f.language) {
      state.langFilter = f.language;
      state.homeAll = true;
    }
    if (f.q) {
      state.q = f.q;
      const field = $("q");
      if (field) field.value = f.q;
      state.homeAll = true;
    }
    if (f.sort) state.sort = f.sort;
    if (f.wave) state.wave = f.wave;
    state.deepLinkStation = f.station || "";
    state.deepLinkPending = !!f.station;
    state.wantsRandom = !!f.random;
  }

  let urlTimer = 0;
  function syncUrl() {
    if (state.deepLinkPending) return;
    clearTimeout(urlTimer);
    urlTimer = setTimeout(function () {
      if (!history || !history.replaceState) return;
      const query = filtersToQuery({
        mode: state.mode,
        cc: state.cc,
        tag: state.tag,
        langFilter: state.langFilter,
        q: state.q,
        sort: state.sort,
        wave: state.wave,
      });
      const next = location.pathname + (query ? "?" + query : "") + location.hash;
      if (next !== location.pathname + location.search + location.hash) {
        try {
          history.replaceState(null, "", next);
        } catch (_) {}
      }
    }, 320);
  }

  function hideExploreTipIfSeen() {
    if (lsGet("freq-seen-filter", "") !== "1") return;
    document.querySelectorAll(".neon-tip").forEach(function (el) { el.hidden = true; });
  }

  function syncVersion() {
    setText("set-ver", "FREQ · v" + APP_VERSION);
    setText("about-ver", "v" + APP_VERSION);
  }

  function syncInstallUi() {
    const btn = $("install-btn");
    const standalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
    state.installed = !!standalone;
    if (!btn) return;
    if (standalone) {
      btn.hidden = true;
      return;
    }
    btn.hidden = !state.installPrompt;
  }
  async function installApp() {
    if (state.installPrompt) {
      const prompt = state.installPrompt;
      state.installPrompt = null;
      try {
        prompt.prompt();
        await prompt.userChoice;
      } catch (_) {}
      syncInstallUi();
      return;
    }
    toast(state.installed ? t("installed") : t("installHint"), { duration: 5200 });
  }

  async function registerSW() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
    try {
      const reg = await navigator.serviceWorker.register("./sw.js", {
        scope: "./",
        updateViaCache: "none",
      });
      state.swReg = reg;
      const announce = function () {
        if (!reg.waiting || !navigator.serviceWorker.controller) return;
        state.swWaiting = reg.waiting;
        toast(t("updateReady"), { action: t("refresh"), duration: 15000, onAction: applyUpdate });
      };
      if (reg.waiting) announce();
      reg.addEventListener("updatefound", function () {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", function () {
          if (worker.state === "installed") announce();
        });
      });
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (state.swReloading) {
          state.swReloading = false;
          location.reload();
        }
      });
      let lastCheck = 0;
      document.addEventListener("visibilitychange", function () {
        if (document.hidden || Date.now() - lastCheck < 30 * 60 * 1000) return;
        lastCheck = Date.now();
        reg.update().catch(function () {});
      });
    } catch (_) {}
  }
  function applyUpdate() {
    const worker = state.swWaiting || (state.swReg && state.swReg.waiting);
    if (worker) {
      state.swReloading = true;
      try {
        worker.postMessage({ type: "SKIP_WAITING" });
      } catch (_) {}
      setTimeout(function () {
        if (state.swReloading) location.reload();
      }, 1600);
      return;
    }
    location.reload();
  }
  async function checkForUpdates() {
    if (!state.swReg) {
      toast(t("upToDate"));
      return;
    }
    toast(t("updateCheck"), { duration: 1300 });
    try {
      await state.swReg.update();
    } catch (_) {}
    setTimeout(function () {
      if (!state.swWaiting) toast(t("upToDate"));
    }, 1600);
  }

  /* ---------------------------------------------------------------------
     Wiring
     --------------------------------------------------------------------- */

  function bind() {
    bindBack();

    /* Search ------------------------------------------------------------ */
    const form = $("search-form");
    const field = $("q");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        state.q = field ? field.value || "" : "";
        state.mode = "browse";
        state.homeAll = !!state.q.trim();
        rememberSearch(state.q);
        loadStations().catch(function () {});
        syncUrl();
      });
    }
    let searchTimer = 0;
    if (field) {
      field.addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          const value = field.value || "";
          if (value.trim() === state.q.trim() && state.mode === "browse") return;
          state.q = value;
          state.mode = "browse";
          state.homeAll = !!value.trim();
          loadStations().catch(function () {});
          syncUrl();
        }, 360);
      });
      field.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && field.value) {
          e.stopPropagation();
          field.value = "";
          state.q = "";
          state.homeAll = false;
          loadStations().catch(function () {});
          syncUrl();
        }
      });
    }

    /* Drawer + filter controls ----------------------------------------- */
    const countryQ = $("country-q");
    if (countryQ) {
      countryQ.addEventListener("input", function () {
        state.countryQ = countryQ.value || "";
        renderCountries();
      });
      countryQ.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && countryQ.value) {
          e.stopPropagation();
          countryQ.value = "";
          state.countryQ = "";
          renderCountries();
        }
      });
    }
    const countries = $("countries");
    if (countries) {
      countries.addEventListener("click", function (e) {
        if (e.target.closest("[data-here]")) {
          goHere();
          return;
        }
        const modeBtn = e.target.closest("[data-mode]");
        if (modeBtn) {
          state.mode = modeBtn.dataset.mode;
          state.homeAll = false;
          state.folderId = "";
          closeFilters();
          loadStations().catch(function () {});
          syncUrl();
          return;
        }
        const btn = e.target.closest("[data-cc]");
        if (!btn) return;
        state.mode = "browse";
        state.cc = btn.dataset.cc || "";
        state.homeAll = !!state.cc;
        state.folderId = "";
        closeFilters();
        loadStations().catch(function () {});
        syncUrl();
      });
    }
    const genres = $("genres");
    if (genres) {
      genres.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-tag]");
        if (btn) setGenre(btn.dataset.tag || "");
      });
    }
    const langs = $("langs");
    if (langs) {
      langs.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-langf]");
        if (!btn) return;
        state.mode = "browse";
        state.langFilter = btn.dataset.langf || "";
        state.homeAll = true;
        closeFilters();
        loadStations().catch(function () {});
        syncUrl();
      });
    }
    const sorts = $("sorts");
    if (sorts) {
      sorts.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-sort]");
        if (!btn) return;
        state.sort = btn.dataset.sort;
        lsSet("freq-sort", state.sort);
        renderSorts();
        if (state.mode === "browse") loadStations().catch(function () {});
        syncUrl();
      });
    }
    const bands = $("bands");
    if (bands) {
      bands.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-band]");
        if (!btn) return;
        state.mode = "browse";
        state.band = btn.dataset.band || "";
        state.tag = state.band;
        state.homeAll = true;
        closeFilters();
        renderGenres();
        loadStations().catch(function () {});
        syncUrl();
      });
    }
    const waves = $("waves");
    if (waves) {
      waves.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-wave]");
        if (btn) setWave(btn.dataset.wave);
      });
    }
    const folders = $("folders");
    if (folders) {
      folders.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-folder]");
        if (btn) openFolder(btn.dataset.folder);
      });
    }
    const folderName = $("folder-name");
    if (folderName) {
      folderName.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          newFolder();
        }
      });
    }

    /* Map --------------------------------------------------------------- */
    const mapc = $("map-c");
    if (mapc) {
      mapc.addEventListener("click", hitMap);
      addEventListener("resize", function () {
        if (state.mapOpen) drawMap();
      });
      mapc.addEventListener("pointerdown", function (e) {
        const rect = mapc.getBoundingClientRect();
        if (e.clientX - rect.left < 0) e.preventDefault();
      });
    }

    /* Wrap stats -------------------------------------------------------- */
    const wrapBody = $("wrap-body");
    if (wrapBody) {
      wrapBody.addEventListener("click", function (e) {
        if (e.target.closest("[data-reset-stats]")) {
          state.stats = { ms: 0, hits: {}, tags: {}, names: {}, since: 0 };
          saveStats(true);
          renderWrap();
          tickClock();
          toast(t("statsReset"));
          return;
        }
        const hit = e.target.closest("[data-play]");
        if (!hit) return;
        const s = findStation(hit.dataset.play);
        if (s) {
          closeWrap();
          play(s);
        }
      });
    }

    /* Graceful artwork fallbacks ---------------------------------------- */
    document.addEventListener(
      "error",
      function (e) {
        const img = e.target;
        if (!img || img.tagName !== "IMG" || !img.dataset.art) return;
        img.hidden = true;
        const ph = img.nextElementSibling;
        if (ph && ph.classList && ph.classList.contains("ph")) ph.hidden = false;
      },
      true
    );

    /* Backdrops --------------------------------------------------------- */
    [
      ["filters", closeFilters],
      ["settings", closeSettings],
      ["sheet", closeSheet],
      ["help", closeHelp],
      ["about", closeAbout],
      ["themes", closeThemes],
      ["wrap", closeWrap],
      ["playerstyles", closePlayerStyles],
      ["stage", closeStage],
      ["map", closeMap],
      ["car", closeCar],
      ["stand", closeStand],
    ].forEach(function (pair) {
      const el = $(pair[0]);
      if (!el) return;
      el.addEventListener("click", function (e) {
        if (e.target === el) pair[1]();
      });
    });

    /* Station list ------------------------------------------------------ */
    const list = $("list");
    if (list) {
      if (!list.hasAttribute("tabindex")) list.setAttribute("tabindex", "-1");
      list.addEventListener("click", function (e) {
        const gtile = e.target.closest("[data-gtag]");
        if (gtile) {
          setGenre(gtile.dataset.gtag || "");
          list.scrollTop = 0;
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
        const s = findStation(hit.dataset.play || hit.dataset.id);
        if (!s) return;
        if (sameStation(s, state.current)) toggle();
        else play(s);
      });
      list.addEventListener("scroll", function () {
        if (list.scrollTop + list.clientHeight > list.scrollHeight - 280) {
          if (state.hasMore && !state.loadingMore && !state.error && state.mode === "browse" && !isHome()) {
            loadStations(true).catch(function () {});
          }
        }
      }, { passive: true });
    }

    /* Sheet ------------------------------------------------------------- */
    const on = function (id, fn) {
      const el = $(id);
      if (el) el.addEventListener("click", fn);
    };
    on("sheet-x", function () { closeSheet(); });
    on("sh-play", function () {
      if (!state.sheet) return;
      if (sameStation(state.sheet, state.current)) toggle();
      else play(state.sheet);
      renderPlayer();
    });
    on("sh-share", function () { shareStation(state.sheet); });
    on("sh-copy", function () { copyStation(state.sheet); });
    on("sh-vote", function () { voteStation(state.sheet); });
    on("sh-hide", function () { hideStation(state.sheet); });
    on("sh-similar", function () {
      const tag = ((state.sheet && state.sheet.tags) || "").split(",")[0].trim();
      if (!tag) {
        toast(t("empty"));
        return;
      }
      state.mode = "browse";
      state.tag = tag;
      state.homeAll = true;
      closeSheet();
      renderGenres();
      loadStations().catch(function () {});
      syncUrl();
    });

    /* About / help / themes -------------------------------------------- */
    on("about-btn", openAbout);
    on("about-close", function () { closeAbout(); });
    on("help-close", function () { closeHelp(); });
    const themeGrid = $("theme-grid");
    if (themeGrid) {
      themeGrid.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-tid]");
        if (btn) setTheme(btn.dataset.tid);
      });
    }
    const playerStyleGrid = $("player-style-grid");
    if (playerStyleGrid) {
      playerStyleGrid.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-style-id]");
        if (btn) setPlayerStyle(btn.dataset.styleId);
      });
    }

    /* Player controls --------------------------------------------------- */
    const audio = $("audio");
    if (audio) {
      audio.addEventListener("playing", function () {
        if (!state.current) return;
        if (state.playing) return;
        onAudioStarted(state.playGen);
      });
      audio.addEventListener("pause", function () {
        if (state.ignoreErr) return;
        state.playing = false;
        state.buffering = false;
        clockListen(false);
        renderPlayer();
        saveStats();
      });
      audio.addEventListener("waiting", function () {
        if (!state.current || state.status === t("failed")) return;
        state.buffering = true;
        renderPlayer();
      });
      audio.addEventListener("canplay", function () {
        if (!state.buffering) return;
        state.buffering = false;
        renderPlayer();
      });
      audio.addEventListener("error", function () {
        if (state.ignoreErr || state.scanning) return;
        failSkip();
      });
      audio.addEventListener("ended", function () {
        if (state.scanning) return;
        failSkip();
      });
      audio.addEventListener("loadedmetadata", function () {
        if (state.ignoreErr) return;
        clearWatchdog();
      });
    }
    document.querySelectorAll("[data-vol]").forEach(function (el) {
      el.addEventListener("input", function () { setVol(el.value); });
      el.addEventListener("change", function () { setVol(el.value); });
    });
    document.querySelectorAll("[data-preset], [data-act='seeall']").forEach(function (el) {
      el.setAttribute("draggable", "false");
    });

    /* Presets: tap to play, hold to store ------------------------------- */
    let hold = 0;
    let held = false;
    let holdTarget = null;
    function startHold(e) {
      const btn = e.target.closest("[data-preset]");
      if (!btn) return;
      holdTarget = btn;
      held = false;
      clearTimeout(hold);
      hold = setTimeout(function () {
        held = true;
        savePreset(Number(btn.dataset.preset));
        if (navigator.vibrate) {
          try { navigator.vibrate(20); } catch (_) {}
        }
      }, 620);
    }
    function endHold() {
      clearTimeout(hold);
      hold = 0;
      holdTarget = null;
    }
    document.addEventListener("pointerdown", startHold, { passive: true });
    document.addEventListener("pointerup", endHold, { passive: true });
    document.addEventListener("pointercancel", endHold, { passive: true });
    document.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-preset]");
      if (!btn) return;
      if (held && holdTarget === btn) {
        held = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const i = Number(btn.dataset.preset);
      if (e.shiftKey || e.altKey) savePreset(i);
      else playPreset(i);
    });

    /* Sleep / alarm ----------------------------------------------------- */
    const chips = $("sleep-chips");
    if (chips) {
      chips.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-sleep]");
        if (btn) setSleep(Number(btn.dataset.sleep));
      });
    }
    const alarmOn = $("alarm-on");
    if (alarmOn) {
      alarmOn.addEventListener("change", function () {
        readAlarmUi();
        if (state.alarm.on && typeof Notification !== "undefined" && Notification.permission === "default") {
          try { Notification.requestPermission(); } catch (_) {}
        }
      });
    }
    const alarmTime = $("alarm-time");
    if (alarmTime) alarmTime.addEventListener("change", readAlarmUi);

    /* Import / install / language --------------------------------------- */
    const file = $("import-file");
    if (file) {
      file.addEventListener("change", function () {
        const picked = file.files && file.files[0];
        importFavs(picked);
        file.value = "";
      });
    }
    addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      state.installPrompt = e;
      syncInstallUi();
    });
    addEventListener("appinstalled", function () {
      state.installed = true;
      state.installPrompt = null;
      syncInstallUi();
      toast(t("installed"));
    });
    document.addEventListener("click", function (e) {
      const langBtn = e.target.closest("[data-lang]");
      if (langBtn) setLang(langBtn.dataset.lang);
    });

    /* One delegated action handler -------------------------------------- */
    function onAct(e) {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "toggle") toggle();
      else if (act === "prev") playRel(-1);
      else if (act === "next") playRel(1);
      else if (act === "rand") playRandom();
      else if (act === "fav") toggleFav(state.current);
      else if (act === "expand") {
        closeFilters();
        closeSettings();
        openStage();
      }
      else if (act === "collapse") closeStage();
      else if (act === "mute") toggleMute();
      else if (act === "share") shareStation(state.current);
      else if (act === "copy") copyStation(state.current);
      else if (act === "vote") voteStation(state.current);
      else if (act === "export") exportFavs();
      else if (act === "import") {
        const input = $("import-file");
        if (input) input.click();
      } else if (act === "help") openHelp();
      else if (act === "scan") startScan();
      else if (act === "stand") toggleStand();
      else if (act === "snooze") snooze();
      else if (act === "hd") toggleHd();
      else if (act === "tg") shareTelegram(state.current);
      else if (act === "map") {
        closeFilters();
        closeSettings();
        toggleMap();
      } else if (act === "car") {
        closeFilters();
        closeSettings();
        toggleCar();
      }
      else if (act === "newfolder") newFolder();
      else if (act === "addfolder") addToFolder();
      else if (act === "filters") toggleFilters();
      else if (act === "settings") toggleSettings();
      else if (act === "clearf") clearFilters();
      else if (act === "near") goNear();
      else if (act === "theme") {
        closeSettings();
        toggleThemes();
      } else if (act === "playerstyles") {
        closeSettings();
        togglePlayerStyles();
      } else if (act === "wrap") {
        closeSettings();
        toggleWrap();
      } else if (act === "voice") startVoice();
      else if (act === "sleeptog") cycleSleep();
      else if (act === "seeall") {
        state.homeAll = true;
        renderList();
        const box = $("list");
        if (box) box.scrollTop = 0;
      } else if (act === "install") installApp();
      else if (act === "geo") enableGeo();
      else if (act === "retry") retryLoad();
      else if (act === "update") checkForUpdates();
      else if (act === "reset") {
        if (window.confirm(t("resetTitle") + "\n" + t("resetBody"))) resetAllData();
      }
    }
    document.addEventListener("click", onAct);

    /* Gestures ---------------------------------------------------------- */
    function swipe(el, opts) {
      if (!el) return;
      let x0 = 0;
      let y0 = 0;
      let active = false;
      el.addEventListener("touchstart", function (e) {
        const first = e.touches[0];
        x0 = first.clientX;
        y0 = first.clientY;
        active = !opts.topOnly || y0 < 110;
      }, { passive: true });
      el.addEventListener("touchend", function (e) {
        if (!active) return;
        active = false;
        const first = e.changedTouches[0];
        const dx = first.clientX - x0;
        const dy = first.clientY - y0;
        if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.25) {
          const rtl = document.documentElement.dir === "rtl";
          playRel((dx > 0) === rtl ? 1 : -1);
        } else if (opts.downToClose && dy > 108 && Math.abs(dy) > Math.abs(dx)) {
          opts.downToClose();
        }
      }, { passive: true });
    }
    swipe($("player"), {});
    swipe($("stage"), { topOnly: true, downToClose: closeStage });

    /* Keyboard ---------------------------------------------------------- */
    addEventListener("keydown", function (e) {
      trapTab(e);
      if (e.defaultPrevented) return;
      if (e.key === "Escape") {
        if (consumeBack()) e.preventDefault();
        return;
      }
      const tag = (e.target && e.target.tagName) || "";
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target && e.target.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " || e.code === "Space") {
        if (tag === "BUTTON" || tag === "A") return;
        e.preventDefault();
        toggle();
      } else if (e.key === "/") {
        e.preventDefault();
        const q = $("q");
        if (q) q.focus();
      } else if (e.key === "n" || e.key === "N") playRel(1);
      else if (e.key === "p" || e.key === "P") playRel(-1);
      else if (e.key === "r" || e.key === "R") playRandom();
      else if (e.key === "f" || e.key === "F") toggleFav(state.current);
      else if (e.key === "s" || e.key === "S") shareStation(state.current);
      else if (e.key === "h" || e.key === "H") goHere();
      else if (e.key === "?") openHelp();
      else if (e.key === "k" || e.key === "K") startScan();
      else if (e.key === "c" || e.key === "C") toggleStand();
      else if (e.key === "m" || e.key === "M") toggleMap();
      else if (e.key === "v" || e.key === "V") toggleCar();
      else if (e.key === "t" || e.key === "T") { closeSettings(); toggleThemes(); }
      else if (e.key === "y" || e.key === "Y") { closeSettings(); toggleWrap(); }
      else if (e.key >= "1" && e.key <= "6") {
        const i = Number(e.key) - 1;
        if (e.shiftKey) savePreset(i);
        else playPreset(i);
      }
    });

    /* Media session ----------------------------------------------------- */
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", function () { if (!state.playing) toggle(); });
        navigator.mediaSession.setActionHandler("pause", function () { if (state.playing) toggle(); });
        navigator.mediaSession.setActionHandler("nexttrack", function () { playRel(1); });
        navigator.mediaSession.setActionHandler("previoustrack", function () { playRel(-1); });
        navigator.mediaSession.setActionHandler("stop", function () {
          const audio = $("audio");
          if (audio) audio.pause();
        });
      } catch (_) {}
    }

    /* Network state ----------------------------------------------------- */
    addEventListener("online", function () {
      markOnline();
      retryLoad();
    });
    addEventListener("offline", function () { markOffline(); });

    /* Persistence + clock ----------------------------------------------- */
    addEventListener("pagehide", function () { saveStats(true); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) saveStats(true);
    });
    setInterval(function () {
      if (state.sleepAt) sleepTick();
      if (state.playing) {
        flushListen();
        saveStats();
      }
      tickClock();
      if (state.night) tickStand();
      updateSleepLeft();
      checkAlarm();
    }, 1000);
    setInterval(renderDirectoryStats, 60000);
  }

  function hideLoader() {
    const el = $("loader");
    if (!el || el.hidden) return;
    el.classList.remove("failed");
    el.classList.add("off");
    el.setAttribute("aria-hidden", "true");
    setTimeout(function () {
      if (el.classList.contains("off")) el.hidden = true;
    }, 700);
  }
  function showLoadError() {
    const el = $("loader");
    if (!el) return;
    el.hidden = false;
    el.classList.remove("off");
    el.classList.add("failed");
    el.removeAttribute("aria-hidden");
    setText("load-sub", t("loadError"));
    const retry = $("load-retry");
    if (retry) retry.hidden = false;
  }

  async function boot() {
    const bootAt = Date.now();
    setTimeout(function () {
      if (!state.stations.length) hideLoader();
    }, 12000);
    try {
      applyTheme();
      readUrlState();
      applyI18n();
      syncVersion();
      syncAlarmUi();
      renderPresets();
      renderWaves();
      renderBands();
      syncHdBtn();
      renderFolders();
      renderLangs();
      renderSorts();
      renderGenres();
      renderCountries();
      renderSleep();
      renderDirectoryStats();
      renderSearchHints();
      syncGeoBtn();
      if (state.offline) setNetBar(true);
      setVol(state.userVol, true);
      renderPlayer();
      tickClock();
      tickStand();
      updateSleepLeft();
      syncDockSleep();
      hideExploreTipIfSeen();
      bind();
      startFx();
      syncChrome();
      if (typeof ResizeObserver !== "undefined" && $("player")) {
        const ro = new ResizeObserver(function () { syncChrome(); });
        ro.observe($("player"));
      }
      addEventListener("resize", syncChrome);
    } catch (err) {
      showLoadError();
      if (window.console && console.error) console.error("FREQ boot", err);
      return;
    }

    try {
      await loadStations();
    } catch (_) {}
    if (state.error && !state.stations.length) {
      if (Date.now() - bootAt < 12000) showLoadError();
    } else {
      hideLoader();
    }
    renderPlayer();
    renderPresets();
    if (state.deepLinkStation) {
      try {
        await applyDeepLink();
      } catch (_) {}
      state.deepLinkPending = false;
      state.deepLinkStation = "";
    }
    if (state.wantsRandom) {
      state.wantsRandom = false;
      setTimeout(playRandom, 600);
    }
    loadDirectoryStats();
    loadCountries();
    loadWeather();
    loadDiscover();
    if (state.geo) loadNear();
    registerSW();
  }

  boot();
})();
