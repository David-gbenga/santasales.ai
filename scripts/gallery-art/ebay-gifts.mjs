// eBay gift ideas for the gallery (2026-11-11). Each links to an eBay UK
// search capped at £15, carrying eBay Partner Network tracking for the
// Giftpost campaign. No listing photos, prices or reviews are copied; the
// art is our own. Picked to suit eBay: vintage, pre-loved, personalised,
// handmade and collectable.

import { ICONS, PALETTES, s } from "./gifts.mjs";

/**
 * eBay UK search, Buy It Now, max £15, with EPN tracking parameters
 * (rotation ID 710-53481-19255-0 is eBay UK).
 */
export function ebaySearchUrl(query, campaignId) {
  const params = new URLSearchParams({
    _nkw: query,
    _udhi: "15",
    LH_BIN: "1",
    mkcid: "1",
    mkrid: "710-53481-19255-0",
    siteid: "3",
    campid: campaignId,
    customid: "giftpost-gallery",
    toolid: "10001",
    mkevt: "1",
  });
  return `https://www.ebay.co.uk/sch/i.html?${params}`;
}

// Extra line icons on the same 200×200 grid.
const EXTRA = {
  record: `<circle cx="100" cy="100" r="65"/><circle cx="100" cy="100" r="18"/>` + s("M100 55a45 45 0 0 1 45 45M100 70a30 30 0 0 1 30 30"),
  keyring: `<circle cx="75" cy="70" r="30"/>` + s("M95 92l55 55M130 127l15-15M145 142l12-12"),
  soap: s("M45 95a20 20 0 0 1 20-20h70a20 20 0 0 1 20 20v40a20 20 0 0 1-20 20H65a20 20 0 0 1-20-20z") + `<circle cx="70" cy="50" r="10"/><circle cx="100" cy="40" r="7"/><circle cx="125" cy="55" r="12"/>` + s("M75 115h50"),
  necklace: s("M45 35c0 60 25 85 55 85s55-25 55-85") + s("M100 120v12") + s("M100 132l18 22-18 22-18-22z"),
  teacup: s("M40 80h100v20a50 50 0 0 1-100 0z") + s("M140 88h10a16 16 0 0 1 0 32h-14") + s("M30 165h120") + s("M75 60c-6-8 6-14 0-22M105 60c-6-8 6-14 0-22"),
  figure: s("M75 30h50v40H75z") + s("M85 50h0M115 50h0") + s("M65 80h70l10 55H55z") + s("M75 135v40M125 135v40") + s("M65 80l-20 40M135 80l20 40"),
  prism: s("M100 30l40 50-40 90-40-90z") + s("M60 80h80M100 30v140") + s("M30 120l20-5M170 120l-20-5M40 155l20-15M160 155l-20-15"),
  hoop: `<circle cx="100" cy="105" r="60"/><circle cx="100" cy="105" r="50"/>` + s("M92 40h16v10H92z") + s("M75 115c15-30 35 10 50-20") + s("M150 160l25 20"),
  postcard: s("M30 55h140v95H30z") + s("M110 70v65") + s("M45 80h50M45 100h50M45 120h35") + s("M130 70h25v25h-25z"),
  hat: s("M45 130c0-50 25-75 55-75s55 25 55 75z") + s("M40 130h120v22H40z") + `<circle cx="100" cy="42" r="14"/>` + s("M75 70l-5 55M100 60v65M125 70l5 55"),
  phone: s("M65 25h70a12 12 0 0 1 12 12v126a12 12 0 0 1-12 12H65a12 12 0 0 1-12-12V37a12 12 0 0 1 12-12z") + s("M88 40h24") + `<circle cx="100" cy="155" r="7"/>`,
  palette: s("M100 35c-45 0-70 30-70 65 0 30 25 50 50 45 15-3 10-20 25-20 20 0 50 5 55-30 4-30-25-60-60-60z") + `<circle cx="70" cy="80" r="9"/><circle cx="100" cy="62" r="9"/><circle cx="132" cy="75" r="9"/><circle cx="145" cy="105" r="8"/>`,
  dice: s("M40 70l60-30 60 30v65l-60 30-60-30z") + s("M40 70l60 30 60-30M100 100v65") + `<circle cx="100" cy="68" r="6"/><circle cx="68" cy="115" r="6"/><circle cx="132" cy="105" r="6"/><circle cx="132" cy="135" r="6"/>`,
  blocks: s("M40 110h55v55H40z") + s("M105 110h55v55h-55z") + s("M72 55h55v55H72z") + s("M58 125l20 25M88 125l-30 25M120 125h25M132 125v28") + s("M90 70h20v25H90z"),
  pin: `<circle cx="100" cy="95" r="55"/>` + s("M100 60l10 22 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3z") + s("M100 150v30"),
  glasses: `<circle cx="65" cy="110" r="30"/><circle cx="135" cy="110" r="30"/>` + s("M95 105c3-8 7-8 10 0") + s("M35 105L22 80M165 105l13-25"),
  speaker: s("M60 30h80a10 10 0 0 1 10 10v120a10 10 0 0 1-10 10H60a10 10 0 0 1-10-10V40a10 10 0 0 1 10-10z") + `<circle cx="100" cy="120" r="30"/><circle cx="100" cy="120" r="8"/><circle cx="100" cy="60" r="12"/>`,
  pettag: s("M100 40c35 0 55 25 55 60s-25 70-55 70-55-35-55-70 20-60 55-60z") + `<circle cx="100" cy="58" r="8"/>` + s("M80 110c0-15 40-15 40 0s-40 15-40 0zM75 95h0M92 85h0M108 85h0M125 95h0"),
  brooch: `<circle cx="100" cy="100" r="50"/><circle cx="100" cy="100" r="22"/>` + s("M100 50v-12M100 162v-12M50 100H38M162 100h-12M65 65l-9-9M135 135l9 9M135 65l9-9M65 135l-9 9"),
  scarf: s("M60 35h80c0 40-20 55-40 55S60 75 60 35z") + s("M80 85l-15 90h30l10-85") + s("M65 160h30M68 145h28"),
  diffuser: s("M70 100h60v65a10 10 0 0 1-10 10H80a10 10 0 0 1-10-10z") + s("M85 85h30v15H85z") + s("M92 85L70 25M100 85V20M108 85l25-60"),
  ball: `<circle cx="100" cy="100" r="65"/>` + s("M100 70l28 20-11 33H83L72 90z") + s("M100 70V35M128 90l33-10M117 123l20 28M83 123l-20 28M72 90l-33-10"),
};
const icons = { ...ICONS, ...EXTRA };

export const ebayGifts = [
  { slug: "vintage-vinyl-record", title: "Vintage vinyl record", query: "vintage vinyl record", icon: "record" },
  { slug: "personalised-keyring", title: "Personalised keyring", query: "personalised keyring", icon: "keyring" },
  { slug: "personalised-mug", title: "Personalised mug", query: "personalised mug", icon: "mug" },
  { slug: "book-bundle", title: "Pre-loved book bundle", query: "book bundle", icon: "notebook" },
  { slug: "handmade-soap", title: "Handmade soap gift set", query: "handmade soap gift set", icon: "soap" },
  { slug: "silver-pendant", title: "Silver pendant necklace", query: "sterling silver pendant necklace", icon: "necklace" },
  { slug: "vintage-teacup", title: "Vintage teacup & saucer", query: "vintage teacup and saucer", icon: "teacup" },
  { slug: "lego-minifigures", title: "LEGO minifigures", query: "lego minifigures", icon: "figure" },
  { slug: "pokemon-cards", title: "Pokémon card pack", query: "pokemon cards pack", icon: "cards" },
  { slug: "wax-melts", title: "Wax melts gift set", query: "wax melts gift set", icon: "candle" },
  { slug: "crystal-suncatcher", title: "Crystal suncatcher", query: "crystal suncatcher", icon: "prism" },
  { slug: "embroidery-kit", title: "Beginner’s embroidery kit", query: "embroidery kit beginners", icon: "hoop" },
  { slug: "vintage-postcards", title: "Vintage postcards", query: "vintage postcards", icon: "postcard" },
  { slug: "retro-sweets", title: "Retro sweets hamper", query: "retro sweets hamper", icon: "chocolate" },
  { slug: "succulent-plant", title: "Succulent plant", query: "succulent plant", icon: "sprout" },
  { slug: "bobble-hat", title: "Knitted bobble hat", query: "knitted bobble hat", icon: "hat" },
  { slug: "phone-case", title: "A fun phone case", query: "phone case", icon: "phone" },
  { slug: "watercolour-set", title: "Watercolour paint set", query: "watercolour paint set", icon: "palette" },
  { slug: "board-game", title: "Pre-loved board game", query: "board game", icon: "dice" },
  { slug: "wooden-blocks", title: "Wooden toy blocks", query: "wooden toy blocks", icon: "blocks" },
  { slug: "enamel-pins", title: "Enamel pin badges", query: "enamel pin badge", icon: "pin" },
  { slug: "retro-sunglasses", title: "Retro sunglasses", query: "retro sunglasses", icon: "glasses" },
  { slug: "mini-speaker", title: "Mini Bluetooth speaker", query: "mini bluetooth speaker", icon: "speaker" },
  { slug: "pet-tag", title: "Personalised pet tag", query: "personalised pet tag", icon: "pettag" },
  { slug: "vintage-brooch", title: "Vintage brooch", query: "vintage brooch", icon: "brooch" },
  { slug: "slipper-socks", title: "Cosy slipper socks", query: "slipper socks", icon: "socks" },
  { slug: "silk-scarf", title: "Silk scarf", query: "silk scarf", icon: "scarf" },
  { slug: "vintage-frame", title: "Vintage photo frame", query: "vintage photo frame", icon: "frame" },
  { slug: "reed-diffuser", title: "Reed diffuser", query: "reed diffuser gift", icon: "diffuser" },
  { slug: "football-gift", title: "Football fan gift", query: "football gifts for men", icon: "ball" },
].map((g, i) => ({
  ...g,
  store: "ebay",
  // Offset the colours so neighbouring Amazon and eBay tiles differ.
  palette: PALETTES[(i + 3) % PALETTES.length],
  svg: icons[g.icon],
}));
