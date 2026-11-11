// Amazon gift ideas for the gallery (2026-11-11). Each links to an Amazon
// UK search for that gift, filtered to £15 and under, carrying the
// Associates tracking ID. No Amazon images, prices or reviews are copied
// (Associates Operating Agreement); the art is our own.

/** Amazon search, max £15.00 (p_36 is in pence), tagged for commission. */
export function amazonSearchUrl(query, tag) {
  const params = new URLSearchParams({ k: query, rh: "p_36:-1500", tag });
  return `https://www.amazon.co.uk/s?${params}`;
}

export const s = (d) => `<path d="${d}"/>`;

// Line icons drawn on a 200×200 grid (stroke only, coloured by the tile).
export const ICONS = {
  socks: s("M70 30h45v70c0 20 15 30 35 40 18 9 15 40-12 40H95c-25 0-35-15-35-35V30z") + s("M70 55h45"),
  cocoa: s("M45 80h95v55a35 35 0 0 1-35 35H80a35 35 0 0 1-35-35z") + s("M140 95h12a18 18 0 0 1 0 36h-12") + s("M75 60c-8-10 8-18 0-30M100 60c-8-10 8-18 0-30M125 60c-8-10 8-18 0-30"),
  candle: s("M60 90h80v80H60z") + s("M60 110h80") + s("M100 90V72") + s("M100 70c-12-10-6-28 0-40 6 12 12 30 0 40z"),
  mug: s("M45 55h95v85a30 30 0 0 1-30 30H75a30 30 0 0 1-30-30z") + s("M140 75h12a18 18 0 0 1 0 36h-12") + s("M72 112c8 12 33 12 41 0") + s("M75 90h0M110 90h0"),
  cream: s("M80 40h40l-6 25H86z") + s("M75 65h50l8 105a10 10 0 0 1-10 10H77a10 10 0 0 1-10-10z") + s("M85 110h30"),
  cards: s("M45 60l55-15 30 105-55 15z") + s("M100 45h50v110h-50") + s("M70 90l15 15 15-15-15-15z"),
  puzzle: s("M50 60h35c-10-25 40-25 30 0h35v35c25-10 25 40 0 30v35h-35c10 25-40 25-30 0H50v-35c-25 10-25-40 0-30z"),
  notebook: s("M55 35h85a10 10 0 0 1 10 10v115a10 10 0 0 1-10 10H55z") + s("M75 35v135") + s("M125 35v135"),
  teapot: s("M55 90h85v45a35 35 0 0 1-35 35H90a35 35 0 0 1-35-35z") + s("M140 100c25-5 25 40-5 40") + s("M55 105L30 85") + s("M80 90c0-25 35-25 35 0") + s("M97 62v-8"),
  chocolate: s("M40 60h120v100H40z") + s("M40 93h120M40 127h120M80 60v100M120 60v100") + s("M100 60c-20-25-45-5-20 0 25-5 0-25 20 0"),
  travel: s("M65 60h70l-8 115H73z") + s("M58 45h84v15H58z") + s("M75 45l5-15h40l5 15") + s("M68 100h64"),
  sprout: s("M60 120h80l-10 55H70z") + s("M100 120V80") + s("M100 95c-30 0-40-25-35-40 25 0 35 15 35 40z") + s("M100 85c25 0 40-20 35-35-25 0-35 15-35 35z"),
  bath: `<circle cx="80" cy="110" r="35"/><circle cx="130" cy="135" r="25"/>` + s("M140 50v30M125 65h30M60 50l10 10M65 160h0"),
  booklight: s("M40 150c25-10 45-10 60 0 15-10 35-10 60 0V85c-25-10-45-10-60 0-15-10-35-10-60 0z") + s("M100 85v65") + s("M100 70V40l25 10") + s("M75 45l-12-10M125 30l12-10"),
  lights: s("M20 60c40 30 60 30 80 0s40-30 80 0") + `<circle cx="45" cy="95" r="12"/><circle cx="100" cy="72" r="12"/><circle cx="155" cy="95" r="12"/>` + s("M45 83v-8M100 60v-8M155 83v-8") + s("M30 140c40 30 60 30 80 0s40-30 80 0") + `<circle cx="70" cy="170" r="10"/><circle cx="130" cy="170" r="10"/>`,
  craft: s("M50 160l90-90 15 15-90 90H50z") + s("M125 85l15 15") + s("M140 40l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z"),
  stocking: s("M80 30h50v80c0 25 10 30 20 40 15 15 0 40-25 30l-45-20c-20-10-20-35 0-50z") + s("M75 30h60v22H75z"),
  comb: s("M40 80h120v25H40z") + s("M55 105v45M75 105v45M95 105v45M115 105v45M135 105v35"),
  trowel: s("M120 40l40 40-45 45c-15 15-45 5-45-25l5-15z") + s("M90 110l-45 45") + s("M40 150l10 10"),
  frame: s("M40 45h120v110H40z") + s("M55 60h90v80H55z") + s("M55 130l30-30 25 25 15-15 20 20") + `<circle cx="125" cy="80" r="8"/>`,
};

export const PALETTES = [
  { bg: "#2f6b5a", fg: "#eef3f7", accent: "#f2c46b" },
  { bg: "#c8324a", fg: "#fff4f0", accent: "#ffd1a8" },
  { bg: "#13233f", fg: "#eef3f7", accent: "#f2a541" },
  { bg: "#f2a541", fg: "#13233f", accent: "#7a2a12" },
  { bg: "#5b3f78", fg: "#f6eefc", accent: "#f2c46b" },
  { bg: "#1f6f78", fg: "#eef7f7", accent: "#ffd27a" },
];

/** Amazon gift ideas. `store` drives the tile file names and the seed script. */
export const gifts = [
  { slug: "fluffy-bed-socks", title: "Fluffy bed socks", query: "fluffy bed socks gift", icon: "socks" },
  { slug: "hot-chocolate-set", title: "Hot chocolate gift set", query: "hot chocolate gift set", icon: "cocoa" },
  { slug: "scented-candle", title: "Scented candle", query: "scented candle gift", icon: "candle" },
  { slug: "funny-mug", title: "A mug that makes them smile", query: "funny mug gift", icon: "mug" },
  { slug: "hand-cream-set", title: "Hand cream gift set", query: "hand cream gift set", icon: "cream" },
  { slug: "family-card-game", title: "Family card game", query: "family card game", icon: "cards" },
  { slug: "jigsaw-puzzle", title: "1000-piece jigsaw puzzle", query: "1000 piece jigsaw puzzle", icon: "puzzle" },
  { slug: "hardback-notebook", title: "Hardback notebook", query: "hardback notebook gift", icon: "notebook" },
  { slug: "tea-gift-set", title: "Tea lover’s gift set", query: "tea gift set", icon: "teapot" },
  { slug: "chocolate-box", title: "Chocolate gift box", query: "chocolate gift box", icon: "chocolate" },
  { slug: "travel-mug", title: "Insulated travel mug", query: "insulated travel mug", icon: "travel" },
  { slug: "grow-your-own-kit", title: "Grow-your-own kit", query: "grow your own kit gift", icon: "sprout" },
  { slug: "bath-bomb-set", title: "Bath bomb set", query: "bath bomb gift set", icon: "bath" },
  { slug: "clip-on-book-light", title: "Clip-on book light", query: "clip on book light", icon: "booklight" },
  { slug: "fairy-lights", title: "Battery fairy lights", query: "battery fairy lights", icon: "lights" },
  { slug: "kids-craft-kit", title: "Kids’ craft kit", query: "kids craft kit", icon: "craft" },
  { slug: "stocking-fillers", title: "Stocking fillers", query: "stocking fillers", icon: "stocking" },
  { slug: "beard-care-kit", title: "Beard care kit", query: "beard care kit", icon: "comb" },
  { slug: "gardening-gift-set", title: "Gardening gift set", query: "gardening gift set", icon: "trowel" },
  { slug: "photo-frame", title: "Photo frame", query: "photo frame gift", icon: "frame" },
].map((g, i) => ({ ...g, store: "amazon", palette: PALETTES[i % PALETTES.length], svg: ICONS[g.icon] }));

export const TILE = { width: 800, height: 1000 };
