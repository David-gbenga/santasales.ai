// Vector artwork for the launch card designs. Rendered to 1500×2100 PNG
// (5×7 in at 300 dpi) by render-card-art.mjs. Each design leaves a clear
// text area; its coordinates are the `layout` stored in card_designs.

const W = 1500;
const H = 2100;

/** Deterministic PRNG so the snow lands in the same place every render. */
function rand(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function snow(
  seed,
  count,
  { minR = 2, maxR = 7, color = "#ffffff", opacity = [0.35, 0.9], area = [0, 0, W, H] } = {},
) {
  const r = rand(seed);
  const [x0, y0, x1, y1] = area;
  let out = "";
  for (let i = 0; i < count; i++) {
    const cx = x0 + r() * (x1 - x0);
    const cy = y0 + r() * (y1 - y0);
    const rad = minR + r() * (maxR - minR);
    const op = opacity[0] + r() * (opacity[1] - opacity[0]);
    out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}" fill="${color}" opacity="${op.toFixed(2)}"/>`;
  }
  return out;
}

function pine(x, baseY, h, color) {
  const w = h * 0.42;
  const tiers = 4;
  let d = "";
  for (let i = 0; i < tiers; i++) {
    const top = baseY - h + (i * h) / (tiers + 0.6);
    const bottom = top + h / 2.6;
    const half = (w / 2) * (0.45 + (i / tiers) * 0.65);
    d += `M${x} ${top.toFixed(1)} L${(x - half).toFixed(1)} ${bottom.toFixed(1)} L${(x + half).toFixed(1)} ${bottom.toFixed(1)} Z `;
  }
  d += `M${x - h * 0.03} ${baseY - h * 0.08} h${h * 0.06} v${h * 0.1} h${-h * 0.06} z`;
  return `<path d="${d}" fill="${color}"/>`;
}

function star(cx, cy, r, color, points = 5) {
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI * i) / points - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    d += `${i ? "L" : "M"}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)} `;
  }
  return `<path d="${d}Z" fill="${color}"/>`;
}

// ---------------------------------------------------------------------------

const snowyNight = {
  slug: "snowy-night",
  name: "Snowy night",
  layout: {
    text: { x: 190, y: 480, width: 1120, height: 820 },
    align: "center",
    font: "serif",
    color: "#eef3f7",
    accentColor: "#f2a541",
  },
  svg: `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1730"/>
      <stop offset="0.55" stop-color="#1b335e"/>
      <stop offset="1" stop-color="#3a5a8c"/>
    </linearGradient>
    <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff6dc" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fff6dc" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="1180" cy="250" r="260" fill="url(#moonGlow)"/>
  <circle cx="1180" cy="250" r="105" fill="#fff4d6"/>
  <circle cx="1220" cy="225" r="105" fill="#132649" opacity="0.18"/>
  ${snow(7, 240, { minR: 1.5, maxR: 6 })}
  <path d="M0 1650 Q 380 1530 760 1640 T 1500 1600 V 2100 H 0 Z" fill="#26416f"/>
  ${[120, 260, 395, 1090, 1230, 1380].map((x, i) => pine(x, 1700 + (i % 2) * 30, 360 + (i % 3) * 70, "#16294b")).join("")}
  <path d="M0 1780 Q 420 1690 820 1790 T 1500 1760 V 2100 H 0 Z" fill="#e9f0f7"/>
  ${[60, 200, 1300, 1450].map((x, i) => pine(x, 1880 + (i % 2) * 25, 300 + (i % 2) * 60, "#0f1f3a")).join("")}
  <path d="M0 1930 Q 500 1860 1000 1930 T 1500 1910 V 2100 H 0 Z" fill="#ffffff"/>
  ${snow(19, 60, { minR: 3, maxR: 9, area: [0, 0, W, 1500] })}`,
};

const hollyWreath = {
  slug: "holly-sprig",
  name: "Holly sprig",
  layout: {
    text: { x: 230, y: 470, width: 1040, height: 1000 },
    align: "center",
    font: "serif",
    color: "#13233f",
    accentColor: "#b2283f",
  },
  svg: (() => {
    const leaf = (x, y, rot, s, fill) =>
      `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C 30 -40 60 -10 90 -35 C 95 -10 120 0 150 -12 C 140 15 160 35 185 40 C 150 55 140 80 150 105 C 120 90 95 100 90 125 C 60 100 30 130 0 90 C 20 70 10 30 0 0 Z" fill="${fill}"/><path d="M8 45 L 170 45" stroke="#0f3a2c" stroke-width="5" stroke-linecap="round" opacity="0.6"/></g>`;
    const berries = (x, y) =>
      `<circle cx="${x}" cy="${y}" r="30" fill="#c8324a"/><circle cx="${x + 46}" cy="${y + 18}" r="27" fill="#b2283f"/><circle cx="${x + 12}" cy="${y + 50}" r="28" fill="#d23b52"/><circle cx="${x - 8}" cy="${y - 8}" r="8" fill="#ffffff" opacity="0.6"/><circle cx="${x + 38}" cy="${y + 10}" r="7" fill="#ffffff" opacity="0.5"/>`;
    return `
  <rect width="${W}" height="${H}" fill="#f7f9fb"/>
  <rect x="70" y="70" width="${W - 140}" height="${H - 140}" rx="18" fill="none" stroke="#b2283f" stroke-width="10"/>
  <rect x="100" y="100" width="${W - 200}" height="${H - 200}" rx="10" fill="none" stroke="#2f6b5a" stroke-width="3"/>
  ${leaf(140, 300, -30, 1.7, "#2f6b5a")}${leaf(330, 140, 40, 1.5, "#245746")}${leaf(170, 470, 10, 1.25, "#3b7d69")}
  ${berries(380, 330)}
  ${leaf(1360, 1800, 150, 1.7, "#2f6b5a")}${leaf(1170, 1960, 220, 1.5, "#245746")}${leaf(1330, 1630, 190, 1.25, "#3b7d69")}
  ${berries(1080, 1730)}
  ${snow(31, 45, { minR: 3, maxR: 8, color: "#9fb3c8", opacity: [0.25, 0.55], area: [140, 140, 1360, 1960] })}`;
  })(),
};

const goldenBaubles = {
  slug: "golden-baubles",
  name: "Golden baubles",
  layout: {
    text: { x: 210, y: 900, width: 1080, height: 980 },
    align: "center",
    font: "serif",
    color: "#f8efdc",
    accentColor: "#f2c46b",
  },
  svg: (() => {
    const bauble = (cx, stringTop, len, r, c1, c2) => `
      <line x1="${cx}" y1="${stringTop}" x2="${cx}" y2="${stringTop + len}" stroke="#e9c27a" stroke-width="4" opacity="0.8"/>
      <rect x="${cx - r * 0.22}" y="${stringTop + len - 6}" width="${r * 0.44}" height="${r * 0.3}" rx="6" fill="#e9c27a"/>
      <circle cx="${cx}" cy="${stringTop + len + r * 1.12}" r="${r}" fill="url(#${c1})"/>
      <path d="M${cx - r * 0.98} ${stringTop + len + r * 1.12} Q ${cx} ${stringTop + len + r * 1.42} ${cx + r * 0.98} ${stringTop + len + r * 1.12}" fill="none" stroke="${c2}" stroke-width="${r * 0.08}" opacity="0.85"/>
      <ellipse cx="${cx - r * 0.38}" cy="${stringTop + len + r * 0.72}" rx="${r * 0.22}" ry="${r * 0.13}" transform="rotate(-35 ${cx - r * 0.38} ${stringTop + len + r * 0.72})" fill="#ffffff" opacity="0.45"/>`;
    return `
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.25" r="0.9">
      <stop offset="0" stop-color="#2b6553"/>
      <stop offset="1" stop-color="#11372c"/>
    </radialGradient>
    <radialGradient id="gold" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#fff0c2"/><stop offset="0.45" stop-color="#e3ae4c"/><stop offset="1" stop-color="#8a5a1c"/>
    </radialGradient>
    <radialGradient id="red" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#ff8a99"/><stop offset="0.45" stop-color="#c8324a"/><stop offset="1" stop-color="#5e1222"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <path d="M0 0 H ${W} V 40 Q ${W * 0.75} 130 ${W / 2} 60 Q ${W * 0.25} -10 0 90 Z" fill="#0d2e25" opacity="0.6"/>
  ${bauble(330, 0, 260, 120, "red", "#ffd0d7")}
  ${bauble(750, 0, 380, 155, "gold", "#fff6dc")}
  ${bauble(1170, 0, 220, 110, "red", "#ffd0d7")}
  ${bauble(540, 0, 110, 70, "gold", "#fff6dc")}
  ${bauble(980, 0, 130, 75, "gold", "#fff6dc")}
  ${[
    [200, 760, 14],
    [1320, 700, 18],
    [1250, 1950, 12],
    [240, 1980, 16],
    [120, 1300, 10],
    [1400, 1250, 11],
  ]
    .map(([x, y, r]) => star(x, y, r, "#f2c46b"))
    .join("")}
  ${snow(53, 90, { minR: 1.5, maxR: 4.5, color: "#f8efdc", opacity: [0.2, 0.6] })}
  <rect x="160" y="2000" width="${W - 320}" height="3" fill="#e9c27a" opacity="0.6"/>`;
  })(),
};

const paperVillage = {
  slug: "paper-village",
  name: "Paper village",
  layout: {
    text: { x: 200, y: 250, width: 1100, height: 960 },
    align: "center",
    font: "serif",
    color: "#13233f",
    accentColor: "#b2283f",
  },
  svg: (() => {
    const house = (x, y, w, h, roof, body, win) => `
      <g filter="url(#paper)">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${body}"/>
        <path d="M${x - 18} ${y + 4} L ${x + w / 2} ${y - h * 0.55} L ${x + w + 18} ${y + 4} Z" fill="${roof}"/>
        <rect x="${x + w * 0.18}" y="${y + h * 0.22}" width="${w * 0.22}" height="${h * 0.26}" rx="4" fill="${win}"/>
        <rect x="${x + w * 0.6}" y="${y + h * 0.22}" width="${w * 0.22}" height="${h * 0.26}" rx="4" fill="${win}"/>
        <rect x="${x + w * 0.4}" y="${y + h * 0.58}" width="${w * 0.2}" height="${h * 0.42}" rx="6" fill="#5b3b2a"/>
      </g>`;
    return `
  <defs>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dbe6f3"/>
      <stop offset="0.6" stop-color="#c7d5ea"/>
      <stop offset="1" stop-color="#a9bcda"/>
    </linearGradient>
    <filter id="paper" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#1b2c4a" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#dusk)"/>
  ${snow(77, 150, { minR: 2, maxR: 7, color: "#ffffff", opacity: [0.5, 0.95], area: [0, 0, W, 1500] })}
  <path d="M0 1380 Q 300 1260 650 1360 T 1500 1320 V 2100 H 0 Z" fill="#8fa6cc" filter="url(#paper)"/>
  ${[180, 1300].map((x) => pine(x, 1430, 330, "#5e7aa8")).join("")}
  <path d="M0 1520 Q 420 1420 820 1520 T 1500 1490 V 2100 H 0 Z" fill="#6f8bb9" filter="url(#paper)"/>
  ${house(260, 1500, 240, 210, "#b2283f", "#f4ead8", "#f7c461")}
  ${house(640, 1440, 300, 260, "#2f6b5a", "#efe2cb", "#f7c461")}
  ${house(1060, 1510, 230, 200, "#13233f", "#f4ead8", "#f7c461")}
  <path d="M0 1720 Q 500 1640 1000 1720 T 1500 1700 V 2100 H 0 Z" fill="#f7f9fb" filter="url(#paper)"/>
  ${[90, 1420].map((x) => pine(x, 1820, 280, "#2f6b5a")).join("")}
  <path d="M0 1880 Q 600 1820 1100 1890 T 1500 1870 V 2100 H 0 Z" fill="#ffffff" filter="url(#paper)"/>
  ${star(750, 130, 30, "#f2a541")}`;
  })(),
};

export const designs = [snowyNight, hollyWreath, goldenBaubles, paperVillage];
export const SIZE = { width: W, height: H };
