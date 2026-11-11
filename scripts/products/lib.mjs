// Design system and generators for Giftpost printable products.
// Each product is HTML pages rendered to an A4 PDF by build.mjs.

import { icon } from "./icons.mjs";

export const DOMAIN = "giftpost.co.uk";

// ---------------------------------------------------------------------------
// Themes: a cover colour plus print-friendly accents for the inside pages.

export const THEMES = {
  berry: { bg: "#c8324a", ink: "#fff6f2", accent: "#ffd27a", soft: "#fdecef", line: "#c8324a" },
  pine: { bg: "#2f6b5a", ink: "#f2fbf6", accent: "#f2c46b", soft: "#e9f3ee", line: "#2f6b5a" },
  night: { bg: "#13233f", ink: "#eef3f7", accent: "#f2a541", soft: "#e9eef6", line: "#13233f" },
  ember: { bg: "#f2a541", ink: "#13233f", accent: "#c8324a", soft: "#fff3e0", line: "#b86b0c" },
  plum: { bg: "#5b3f78", ink: "#f8f0ff", accent: "#ffd27a", soft: "#f2ecf8", line: "#5b3f78" },
  teal: { bg: "#1f6f78", ink: "#effafa", accent: "#ffd27a", soft: "#e6f4f5", line: "#1f6f78" },
  sky: { bg: "#2a78d6", ink: "#f2f8ff", accent: "#ffe08a", soft: "#e8f1fc", line: "#2a78d6" },
  rose: { bg: "#e8798a", ink: "#3a0f1a", accent: "#ffffff", soft: "#fdeef1", line: "#c24a5e" },
  lime: { bg: "#7bb661", ink: "#13233f", accent: "#ffffff", soft: "#eef7ea", line: "#4f8a37" },
  sand: { bg: "#efe2c6", ink: "#3b2a14", accent: "#c8324a", soft: "#faf4e8", line: "#9a6b2f" },
};

// ---------------------------------------------------------------------------
// Seeded randomness, so every build produces identical files.

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = (r, list) => list[Math.floor(r() * list.length)];
export function shuffle(r, list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------------------------------------------------------------------------
// CSS shared by every book. Inside pages are mostly white to save ink.

export function css(theme, { cjk = false } = {}) {
  const t = THEMES[theme];
  return `
@font-face { font-family: Gloock; src: url(../../../assets/fonts/Gloock-Regular.ttf); }
/* Gloock has no maths signs: borrow them (and arrows, ticks) from Figtree. */
@font-face { font-family: Gloock; src: url(../../../assets/fonts/Figtree-Regular.ttf); unicode-range: U+00D7, U+00F7, U+2212, U+00B1, U+2190-2193, U+2713, U+2022; }
@font-face { font-family: Figtree; src: url(../../../assets/fonts/Figtree-Regular.ttf); font-weight: 400; }
@font-face { font-family: Figtree; src: url(../../../assets/fonts/Figtree-SemiBold.ttf); font-weight: 600; }
${cjk ? "@font-face { font-family: NotoSC; src: url(../fonts/NotoSansSC.ttf); }" : ""}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: Figtree, ${cjk ? "NotoSC," : ""} sans-serif; color: #1b2433; }
.cjk { font-family: NotoSC, sans-serif; }
.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always;
  padding: 14mm 15mm 20mm; background: #fff; display: flex; flex-direction: column; }
.page:last-child { page-break-after: auto; }
.head { display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1.4mm solid ${t.line}; padding-bottom: 3mm; margin-bottom: 5mm; }
.series { font: 600 9pt Figtree; letter-spacing: .16em; text-transform: uppercase; color: ${t.line}; }
h1 { font: 400 26pt/1.1 Gloock; color: #13233f; }
h2 { font: 400 17pt/1.15 Gloock; color: #13233f; margin: 4mm 0 2mm; }
.intro { font-size: 12pt; color: #4a5568; margin: 2mm 0 5mm; }
.body { flex: 1; display: flex; flex-direction: column; gap: 4mm; }
.foot { position: absolute; left: 15mm; right: 15mm; bottom: 9mm; display: flex; justify-content: space-between;
  font: 600 8.5pt Figtree; letter-spacing: .08em; text-transform: uppercase; color: #8a94a6;
  border-top: .4mm solid #d9dee7; padding-top: 2.5mm; }
.foot b { color: ${t.line}; }
.soft { background: ${t.soft}; border-radius: 4mm; padding: 5mm; }
.box { border: .5mm solid #c9d1dd; border-radius: 3mm; padding: 4mm; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
.grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; }
.center { text-align: center; }
.muted { color: #6b7587; }
.big { font: 400 40pt Gloock; color: #13233f; }
.label { font: 600 9pt Figtree; letter-spacing: .12em; text-transform: uppercase; color: ${t.line}; }
.write { border-bottom: .5mm solid #9aa6b8; height: 10mm; }
.ic { display: inline-block; vertical-align: middle; }
.lines { display: flex; flex-direction: column; }
.hw { position: relative; height: 18mm; margin-bottom: 3mm; }
.hw i { position: absolute; left: 0; right: 0; border-top: .35mm solid #9aa6b8; }
.hw i.mid { border-top: .35mm dashed #c3cad6; }
.hw i.base { border-top-color: ${t.line}; border-top-width: .5mm; }
.tr { position: absolute; left: 2mm; bottom: 4.2mm; height: 14mm; }
table.t { width: 100%; border-collapse: collapse; font-size: 11pt; }
table.t th { text-align: left; font: 600 9pt Figtree; letter-spacing: .1em; text-transform: uppercase; color: ${t.line};
  border-bottom: .5mm solid ${t.line}; padding: 2mm; }
table.t td { border-bottom: .3mm solid #dde3ec; padding: 2.6mm 2mm; vertical-align: top; }
.card { border: .6mm dashed #b6c0cf; border-radius: 3mm; display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center; padding: 4mm; }
.pill { display: inline-block; border-radius: 99px; padding: 1mm 3.5mm; font: 600 9pt Figtree; letter-spacing: .08em;
  text-transform: uppercase; background: ${t.soft}; color: ${t.line}; }
.check { display: inline-block; width: 5mm; height: 5mm; border: .5mm solid #8a94a6; border-radius: 1mm; vertical-align: middle; }
${COVER_CSS}
`;
}

// ---------------------------------------------------------------------------
// Covers. Sized in container units so the same markup renders as the A4
// first page and as the 4:5 shop picture.

const COVER_CSS = `
.cover { container-type: size; position: relative; overflow: hidden; width: 100%; height: 100%; }
.cover .pat { position: absolute; inset: 0; }
.cover .blob { position: absolute; border-radius: 50%; }
.cover .inner { position: absolute; inset: 6.5cqw; display: flex; flex-direction: column; }
.cover .top { display: flex; justify-content: space-between; align-items: center; }
.cover .brand { font: 600 3cqw Figtree; letter-spacing: .3em; text-transform: uppercase; }
.cover .age { font: 600 3cqw Figtree; letter-spacing: .12em; text-transform: uppercase; padding: 1.4cqw 3.2cqw;
  border-radius: 99cqw; }
.cover .kicker { font: 600 3.4cqw Figtree; letter-spacing: .2em; text-transform: uppercase; margin-top: 7cqw; }
.cover .title { font: 400 12.5cqw/0.98 Gloock; margin-top: 2.5cqw; text-wrap: balance; letter-spacing: -0.01em; }
.cover .title.long { font-size: 9.6cqw; }
.cover .title.xlong { font-size: 8.2cqw; }
.cover .sub { font: 400 4.2cqw/1.3 Figtree; margin-top: 3.5cqw; max-width: 80%; }
.cover .hero { flex: 1; position: relative; min-height: 20cqh; container-type: size; }
.cover .disc { position: absolute; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.cover .bottom { display: flex; justify-content: space-between; align-items: flex-end; gap: 4cqw; }
.cover .pages { font: 400 9cqw/1 Gloock; }
.cover .pages small { display: block; font: 600 2.8cqw Figtree; letter-spacing: .14em; text-transform: uppercase; margin-top: 1cqw; }
.cover .owner { font: 600 2.8cqw Figtree; letter-spacing: .12em; text-transform: uppercase; flex: 1; max-width: 55%; }
.cover .owner span { display: block; border-bottom: .5cqw solid currentColor; height: 6cqw; opacity: .8; }
.cover.shop .owner { display: none; }
`;

function coverPattern(theme, motif, seed) {
  const t = THEMES[theme];
  const r = rng(seed);
  let out = "";
  if (motif === "confetti" || motif === "stars") {
    for (let i = 0; i < 46; i++) {
      const x = r() * 100, y = r() * 100, s = 0.8 + r() * 1.6, rot = r() * 180;
      const col = r() < 0.5 ? t.accent : t.ink;
      out += motif === "stars"
        ? `<path transform="translate(${x} ${y}) scale(${s / 10}) rotate(${rot})" d="M0-10l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="${col}" opacity=".35"/>`
        : `<rect x="${x}" y="${y}" width="${s}" height="${s * 0.45}" rx=".2" transform="rotate(${rot} ${x} ${y})" fill="${col}" opacity=".4"/>`;
    }
  } else if (motif === "dots") {
    for (let y = 4; y < 100; y += 6) for (let x = (y % 12 ? 4 : 7); x < 100; x += 6)
      out += `<circle cx="${x}" cy="${y}" r=".55" fill="${t.ink}" opacity=".18"/>`;
  } else if (motif === "waves") {
    for (let y = 8; y < 100; y += 9)
      out += `<path d="M0 ${y} Q 12.5 ${y - 3} 25 ${y} T 50 ${y} T 75 ${y} T 100 ${y}" stroke="${t.ink}" stroke-width=".35" fill="none" opacity=".18"/>`;
  } else if (motif === "grid") {
    for (let v = 5; v < 100; v += 5)
      out += `<path d="M${v} 0V100M0 ${v}H100" stroke="${t.ink}" stroke-width=".15" opacity=".2"/>`;
  } else if (motif === "letters") {
    const chars = motif.length ? "ABCabc123xyz" : "";
    for (let i = 0; i < 26; i++)
      out += `<text x="${r() * 100}" y="${r() * 100}" font-family="Gloock" font-size="${4 + r() * 6}" fill="${t.ink}" opacity=".12" transform="rotate(${r() * 40 - 20})">${chars[Math.floor(r() * chars.length)]}</text>`;
  }
  return `<svg class="pat" viewBox="0 0 100 100" preserveAspectRatio="none">${out}</svg>`;
}

/**
 * The cover. `heroIcons` (2–3 names) sit in discs; `glyphs` optionally adds
 * big characters (e.g. "Aa", "你好") as artwork.
 */
export function coverHtml(b, { shop = false } = {}) {
  const t = THEMES[b.theme];
  const [i1, i2, i3] = b.heroIcons;
  const disc = (name, x, y, d, bg, fg, rot = 0) =>
    `<div class="disc" style="left:${x}%;top:${y}%;width:min(${d}cqw,${d * 2.4}cqh);height:min(${d}cqw,${d * 2.4}cqh);background:${bg};transform:rotate(${rot}deg)">${icon(name, "62%", fg, 7)}</div>`;
  const glyph = b.glyphs
    ? `<div style="position:absolute;right:-2cqw;bottom:2%;font:400 32cqw/1 ${b.cjk ? "NotoSC" : "Gloock"};color:${t.ink};opacity:.13">${b.glyphs}</div>`
    : "";
  return `<div class="cover${shop ? " shop" : ""}" style="background:${t.bg};color:${t.ink}">
    ${coverPattern(b.theme, b.motif ?? "confetti", b.seed ?? 7)}
    <div class="blob" style="width:95cqw;height:95cqw;right:-38cqw;top:-30cqw;background:${t.accent};opacity:.16"></div>
    <div class="blob" style="width:70cqw;height:70cqw;left:-30cqw;bottom:-22cqw;background:${t.ink};opacity:.08"></div>
    <div class="inner">
      <div class="top"><span class="brand">Giftpost</span><span class="age" style="background:${t.accent};color:${t.bg}">${esc(b.ages)}</span></div>
      <div class="kicker" style="color:${t.accent}">${esc(b.kicker)}</div>
      <div class="title${b.title.length > 34 ? " xlong" : b.title.length > 24 ? " long" : ""}">${esc(b.title)}</div>
      <div class="sub">${esc(b.subtitle)}</div>
      <div class="hero">
        ${glyph}
        ${disc(i1, 2, 8, 38, t.ink, t.bg, -6)}
        ${i2 ? disc(i2, 40, 34, 28, t.accent, t.bg, 5) : ""}
        ${i3 ? disc(i3, 70, 4, 24, "rgba(255,255,255,.18)", t.ink, -4) : ""}
      </div>
      <div class="bottom">
        <div class="pages">${b.pageCount}<small>printable pages</small></div>
        <div class="owner">This book belongs to<span></span></div>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Book assembly.

/**
 * pages: [{ section, title, intro?, body }]. The cover is page 1, so
 * numbering starts at 2 and totals include it.
 */
export function bookHtml(b) {
  const total = b.pages.length + 1;
  // Books built on a supplied PDF: cover + the original pages.
  b.pageCount = b.sourcePages ? b.sourcePages + 1 : total;
  const inside = b.pages
    .map(
      (p, i) => `<section class="page">
  <div class="head"><span class="series">Giftpost · ${esc(b.series)}</span>${icon(b.heroIcons[0], 26, THEMES[b.theme].line, 9)}</div>
  ${p.title ? `<h1>${p.title}</h1>` : ""}
  ${p.intro ? `<p class="intro">${p.intro}</p>` : ""}
  <div class="body">${p.body}</div>
  <div class="foot"><span>${DOMAIN}</span><span>${esc(p.section)} • <b>Page ${i + 2} / ${total}</b></span></div>
</section>`,
    )
    .join("\n");
  return `<!doctype html><html lang="${b.lang ?? "en-GB"}"><head><meta charset="utf-8"><title>${esc(b.title)} | Giftpost</title>
<style>${css(b.theme, { cjk: b.cjk })}</style></head><body>
<section class="page" style="padding:0">${coverHtml(b)}</section>
${inside}
</body></html>`;
}

export function shopCoverHtml(b) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(b.theme, { cjk: b.cjk })}
body{width:800px;height:1000px}</style></head><body>${coverHtml(b, { shop: true })}</body></html>`;
}

// ---------------------------------------------------------------------------
// Writing practice.

/** Dotted text for tracing, as SVG (Figtree). */
export function trace(text, { size = 46, color = "#9aa6b8", font = "Figtree", weight = 400, width = "100%" } = {}) {
  return `<svg width="${width}" height="${size * 1.25}" style="overflow:visible"><text x="0" y="${size}" font-family="${font}" font-weight="${weight}" font-size="${size}" fill="none" stroke="${color}" stroke-width="1.6" stroke-dasharray="3 3" letter-spacing="4">${esc(text)}</text></svg>`;
}

/**
 * Dotted text sitting on a handwriting row: baseline on the base line (13mm),
 * x-height reaching the dashed middle line, capitals reaching the top.
 * Units are millimetres.
 */
function rowTrace(text, size = 17, font = "Figtree") {
  return `<svg viewBox="0 0 180 18" width="100%" height="18mm" preserveAspectRatio="xMinYMin meet" style="position:absolute;left:1mm;top:0"><text x="0" y="13" font-family="${font}" font-size="${size}" fill="none" stroke="#9aa6b8" stroke-width=".28" stroke-dasharray=".9 .7" letter-spacing="1.5">${esc(text)}</text></svg>`;
}

/** Handwriting rows (top, dashed middle, base, descender), optionally with dotted text to trace. */
export function hwRows(n, traceText = "", { size = 17 } = {}) {
  let out = "";
  for (let i = 0; i < n; i++) {
    out += `<div class="hw"><i style="top:0"></i><i class="mid" style="top:5mm"></i><i class="base" style="top:13mm"></i><i class="mid" style="top:18mm;border-top-style:dotted"></i>
      ${traceText && i < Math.ceil(n / 2) ? rowTrace(traceText, size) : ""}</div>`;
  }
  return `<div class="lines">${out}</div>`;
}

/** Plain writing lines. */
export const writeLines = (n, gap = 10) =>
  Array.from({ length: n }, () => `<div class="write" style="height:${gap}mm"></div>`).join("");

/** 田字格 practice squares for Chinese characters; the first `ghosts` show the character to trace. */
export function tianGrid(char, cells = 8, ghosts = 3, size = 21) {
  let out = "";
  for (let i = 0; i < cells; i++) {
    out += `<div style="position:relative;width:${size}mm;height:${size}mm;border:.5mm solid #c24a5e">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0"><path d="M50 0V100M0 50H100M0 0L100 100M100 0L0 100" stroke="#e8a3ad" stroke-width=".8" stroke-dasharray="3 3" fill="none"/></svg>
      ${i < ghosts ? `<span class="cjk" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:${size * 2.3}pt;color:${i === 0 ? "#1b2433" : "#c9d0db"}">${char}</span>` : ""}
    </div>`;
  }
  return `<div style="display:flex;flex-wrap:wrap;gap:1.6mm">${out}</div>`;
}

// ---------------------------------------------------------------------------
// Number and counting.

export function dotGroup(n, color = "#13233f", r = 7) {
  const cols = n <= 5 ? n : Math.ceil(n / 2);
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = 12 + (i % cols) * 22, y = 12 + Math.floor(i / cols) * 22;
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  }
  const w = 12 + cols * 22, h = 12 + Math.ceil(n / cols) * 22;
  return `<svg width="${w * 0.9}" height="${h * 0.9}" viewBox="0 0 ${w} ${h}">${s}</svg>`;
}

export function iconRow(name, n, size = 34, color = "#13233f") {
  return Array.from({ length: n }, () => icon(name, size, color, 8)).join("");
}

// ---------------------------------------------------------------------------
// Mazes (recursive backtracker), drawn as SVG with entry and exit.

export function maze(w, h, seed, { size = 170, color = "#13233f", entry = "start", exit = "finish" } = {}) {
  const r = rng(seed);
  const walls = Array.from({ length: h }, () => Array.from({ length: w }, () => ({ n: 1, s: 1, e: 1, w: 1, v: 0 })));
  const stack = [[0, 0]];
  walls[0][0].v = 1;
  const dirs = [["n", 0, -1, "s"], ["s", 0, 1, "n"], ["e", 1, 0, "w"], ["w", -1, 0, "e"]];
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const options = dirs.filter(([, dx, dy]) => walls[y + dy]?.[x + dx] && !walls[y + dy][x + dx].v);
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [d, dx, dy, back] = pick(r, options);
    walls[y][x][d] = 0;
    walls[y + dy][x + dx][back] = 0;
    walls[y + dy][x + dx].v = 1;
    stack.push([x + dx, y + dy]);
  }
  walls[0][0].w = 0;
  walls[h - 1][w - 1].e = 0;
  const cell = 10;
  let path = "";
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = walls[y][x], X = x * cell, Y = y * cell;
      if (c.n) path += `M${X} ${Y}h${cell}`;
      if (c.w) path += `M${X} ${Y}v${cell}`;
      if (y === h - 1 && c.s) path += `M${X} ${Y + cell}h${cell}`;
      if (x === w - 1 && c.e) path += `M${X + cell} ${Y}v${cell}`;
    }
  const W = w * cell, H = h * cell;
  return `<svg viewBox="-14 -6 ${W + 28} ${H + 12}" width="${size}mm" style="max-height:200mm"><path d="${path}" stroke="${color}" stroke-width="1.2" stroke-linecap="square" fill="none"/>
    <text x="-13" y="4" font-family="Figtree" font-weight="600" font-size="3.2" fill="#c8324a">${entry}</text>
    <text x="${W + 1}" y="${H - 2}" font-family="Figtree" font-weight="600" font-size="3.2" fill="#2f6b5a">${exit}</text></svg>`;
}

// ---------------------------------------------------------------------------
// Word search: places words, fills the rest; returns grid and solution cells.

export function wordSearch(words, size, seed, { diagonal = false, backwards = false } = {}) {
  const r = rng(seed);
  const grid = Array.from({ length: size }, () => Array(size).fill(""));
  const dirs = [[1, 0], [0, 1]];
  if (diagonal) dirs.push([1, 1], [1, -1]);
  if (backwards) dirs.push([-1, 0], [0, -1]);
  const placed = [];
  const solution = new Set();
  for (const raw of [...words].sort((a, b) => b.length - a.length)) {
    const word = raw.toUpperCase().replace(/[^A-Z]/g, "");
    let ok = false;
    for (let tries = 0; tries < 400 && !ok; tries++) {
      const [dx, dy] = pick(r, dirs);
      const x0 = Math.floor(r() * size), y0 = Math.floor(r() * size);
      const cells = [...word].map((ch, i) => [x0 + dx * i, y0 + dy * i, ch]);
      if (cells.every(([x, y, ch]) => x >= 0 && y >= 0 && x < size && y < size && (!grid[y][x] || grid[y][x] === ch))) {
        for (const [x, y, ch] of cells) {
          grid[y][x] = ch;
          solution.add(`${x},${y}`);
        }
        placed.push(raw);
        ok = true;
      }
    }
  }
  const letters = "ABCDEFGHIJKLMNOPRSTUWY";
  for (const row of grid) for (let x = 0; x < size; x++) if (!row[x]) row[x] = pick(r, [...letters]);
  return { grid, placed, solution };
}

export function wordSearchHtml({ grid, solution }, { cellMm = 9, showAnswers = false, fontPt = 15 } = {}) {
  const n = grid.length;
  const cells = grid
    .map((row, y) =>
      row
        .map((ch, x) => {
          const hit = showAnswers && solution.has(`${x},${y}`);
          return `<div style="width:${cellMm}mm;height:${cellMm}mm;display:flex;align-items:center;justify-content:center;font:600 ${fontPt}pt Figtree;${hit ? "background:#ffe08a;border-radius:1.5mm;" : ""}${showAnswers && !hit ? "color:#c3cad6;" : ""}">${ch}</div>`;
        })
        .join(""),
    )
    .join("");
  return `<div style="display:grid;grid-template-columns:repeat(${n},${cellMm}mm);border:.6mm solid #13233f;border-radius:3mm;padding:2mm;align-self:center">${cells}</div>`;
}

// ---------------------------------------------------------------------------
// Sudoku with a unique solution (4×4, 6×6 or 9×9).

const BOXES = { 4: [2, 2], 6: [2, 3], 9: [3, 3] };

export function sudoku(n, seed, clues) {
  const [br, bc] = BOXES[n];
  const r = rng(seed);
  const base = (row, col) => (bc * (row % br) + Math.floor(row / br) + col) % n;
  const bands = shuffle(r, [...Array(n / br).keys()]);
  const rows = bands.flatMap((b) => shuffle(r, [...Array(br).keys()]).map((x) => b * br + x));
  const stacks = shuffle(r, [...Array(n / bc).keys()]);
  const cols = stacks.flatMap((s) => shuffle(r, [...Array(bc).keys()]).map((x) => s * bc + x));
  const digits = shuffle(r, [...Array(n).keys()].map((d) => d + 1));
  const solution = rows.map((row) => cols.map((col) => digits[base(row, col)]));
  const puzzle = solution.map((row) => [...row]);
  const order = shuffle(r, [...Array(n * n).keys()]);
  let filled = n * n;
  for (const k of order) {
    if (filled <= clues) break;
    const y = Math.floor(k / n), x = k % n, keep = puzzle[y][x];
    puzzle[y][x] = 0;
    if (countSolutions(puzzle, n, br, bc, 2) !== 1) puzzle[y][x] = keep;
    else filled--;
  }
  return { puzzle, solution, br, bc };
}

function countSolutions(g, n, br, bc, limit) {
  let count = 0;
  const ok = (y, x, v) => {
    for (let i = 0; i < n; i++) if (g[y][i] === v || g[i][x] === v) return false;
    const y0 = y - (y % br), x0 = x - (x % bc);
    for (let a = 0; a < br; a++) for (let b = 0; b < bc; b++) if (g[y0 + a][x0 + b] === v) return false;
    return true;
  };
  const solve = () => {
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++)
        if (!g[y][x]) {
          for (let v = 1; v <= n; v++)
            if (ok(y, x, v)) {
              g[y][x] = v;
              solve();
              g[y][x] = 0;
              if (count >= limit) return;
            }
          return;
        }
    count++;
  };
  solve();
  return count;
}

export function sudokuHtml({ puzzle, br, bc }, { cellMm = 16, fontPt = 20, small = false } = {}) {
  const n = puzzle.length;
  const cells = puzzle
    .map((row, y) =>
      row
        .map((v, x) => {
          const bt = y % br === 0 ? ".9mm" : ".3mm", bl = x % bc === 0 ? ".9mm" : ".3mm";
          const bb = y === n - 1 ? ".9mm" : "0", brr = x === n - 1 ? ".9mm" : "0";
          return `<div style="width:${cellMm}mm;height:${cellMm}mm;border-style:solid;border-color:#13233f;border-width:${bt} ${brr} ${bb} ${bl};display:flex;align-items:center;justify-content:center;font:600 ${fontPt}pt Figtree;color:${small ? "#4a5568" : "#13233f"}">${v || ""}</div>`;
        })
        .join(""),
    )
    .join("");
  return `<div style="display:grid;grid-template-columns:repeat(${n},${cellMm}mm);align-self:center">${cells}</div>`;
}

// ---------------------------------------------------------------------------
// Certificates and simple charts.

export function certificate(themeName, title, line, iconName) {
  const t = THEMES[themeName];
  return `<div style="flex:1;border:3mm double ${t.line};border-radius:6mm;padding:12mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6mm;background:${t.soft}">
    ${icon(iconName, 120, t.line, 6)}
    <div class="label">Certificate of achievement</div>
    <div style="font:400 34pt/1.05 Gloock;color:#13233f">${title}</div>
    <div style="font-size:13pt;color:#4a5568">This award proudly goes to</div>
    <div style="width:70%;border-bottom:.6mm solid #13233f;height:14mm"></div>
    <div style="font-size:13pt;color:#4a5568;max-width:80%">${line}</div>
    <div style="display:flex;gap:20mm;margin-top:6mm;width:80%"><div style="flex:1"><div class="write"></div><div class="label">Date</div></div><div style="flex:1"><div class="write"></div><div class="label">Signed</div></div></div>
  </div>`;
}

export function chart(rows, cols, labelHead = "") {
  const head = `<tr><th>${labelHead}</th>${cols.map((c) => `<th style="text-align:center">${c}</th>`).join("")}</tr>`;
  const body = rows
    .map((r) => `<tr><td style="font-weight:600;height:24mm;font-size:13pt">${r}</td>${cols.map(() => `<td style="text-align:center;vertical-align:middle"><span style="display:inline-block;width:15mm;height:15mm;border:.5mm dashed #b6c0cf;border-radius:50%"></span></td>`).join("")}</tr>`)
    .join("");
  return `<table class="t">${head}${body}</table>`;
}
