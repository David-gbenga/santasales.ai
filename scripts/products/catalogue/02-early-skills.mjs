// Early skills (ages 3–6): pencil control, shapes & colours, first phonics.

import { icon } from "../icons.mjs";
import { THEMES, hwRows, rng, shuffle, trace } from "../lib.mjs";
import { certPage } from "./01-early-years.mjs";

// ---------------------------------------------------------------------------
// Pencil control: dotted paths from a picture to a picture.

const PATHS = {
  straight: (y) => `M10 ${y}H190`,
  zigzag: (y) => `M10 ${y}` + Array.from({ length: 9 }, (_, i) => `L${10 + (i + 1) * 20} ${i % 2 ? y : y - 14}`).join(""),
  waves: (y) => `M10 ${y}` + Array.from({ length: 6 }, (_, i) => `Q${25 + i * 30} ${i % 2 ? y + 16 : y - 16} ${40 + i * 30} ${y}`).join(""),
  bumps: (y) => `M10 ${y}` + Array.from({ length: 6 }, (_, i) => `A15 15 0 0 1 ${40 + i * 30} ${y}`).join(""),
  mountains: (y) => `M10 ${y}` + Array.from({ length: 6 }, (_, i) => `L${25 + i * 30} ${y - 18}L${40 + i * 30} ${y}`).join(""),
  loops: (y) => `M10 ${y}` + Array.from({ length: 7 }, (_, i) => `c10 -22 24 -22 18 -4 -6 10 -14 8 -8 4`).join(""),
  steps: (y) => `M10 ${y}` + Array.from({ length: 6 }, (_, i) => `v-12h15v12h15`).join(""),
  spiral: () => {
    let d = "M100 100";
    for (let a = 0; a < Math.PI * 8; a += 0.2) d += `L${100 + Math.cos(a) * a * 3.2} ${100 + Math.sin(a) * a * 3.2}`;
    return d;
  },
};

function pathPage(kind, title, from, to, line) {
  const rows = kind === "spiral" ? [100] : [40, 90, 140, 190];
  const svg = rows
    .map((y) => `<path d="${PATHS[kind](y)}" fill="none" stroke="#8d99ad" stroke-width="2.2" stroke-dasharray="4 4" stroke-linecap="round"/>${kind === "spiral" ? "" : `<circle cx="10" cy="${y}" r="3" fill="${line}"/>`}`)
    .join("");
  return {
    section: "Pencil control",
    title,
    intro: kind === "spiral" ? "Start in the middle and follow the dots round and round." : `Start at the dot. Help the ${from} get to the ${to}.`,
    body: `<div style="display:flex;justify-content:space-between;align-items:center">${icon(from, 64, line, 7)}${icon(to, 64, line, 7)}</div><svg viewBox="0 ${kind === "spiral" ? 0 : 15} 200 ${kind === "spiral" ? 200 : 190}" style="flex:1;width:100%">${svg}</svg>`,
  };
}

function pencilControl() {
  const line = THEMES.sky.line;
  const plan = [
    ["straight", "Straight lines", "car", "house"],
    ["straight", "More straight lines", "rocket", "moon"],
    ["zigzag", "Zigzag lines", "fish", "star"],
    ["zigzag", "Zigzags again", "plane", "cloud"],
    ["waves", "Wavy lines", "fish", "sun"],
    ["waves", "Ocean waves", "fish", "house"],
    ["bumps", "Bouncy bumps", "ball", "gift"],
    ["bumps", "Bunny hops", "cat", "flower"],
    ["mountains", "Mountain peaks", "car", "tree"],
    ["mountains", "Over the hills", "truck", "house"],
    ["loops", "Loopy loops", "balloon", "sun"],
    ["loops", "Curly loops", "star", "moon"],
    ["steps", "Step it up", "dog", "bone"],
    ["steps", "Castle walls", "crown", "star"],
    ["spiral", "Snail spiral", "leaf", "leaf"],
    ["spiral", "Swirly spiral", "star", "star"],
  ];
  const pages = plan.map(([k, title, a, b]) => pathPage(k, title, a, b === "bone" ? "heart" : b, line));
  // Shapes to trace and letters-ready strokes.
  for (const [title, text] of [["Up and down strokes", "| | | | | | | | | |"], ["Circles", "o o o o o o o o"], ["Little lines", "/ / / / \\ \\ \\ \\"], ["Crosses", "+ + + + x x x x"]])
    pages.push({ section: "Pre-writing", title, intro: "Trace each row, then try a row on your own.", body: hwRows(8, text) });
  for (const word of ["mum", "dad", "cat", "sun", "me"])
    pages.push({ section: "First words", title: `Trace “${word}”`, intro: "Your pencil is ready for real letters now!", body: hwRows(8, `${word} ${word} ${word} ${word}`) });
  return pages;
}

// ---------------------------------------------------------------------------
// Shapes & colours.

const SHAPES = {
  circle: `<circle cx="100" cy="100" r="70"/>`,
  square: `<rect x="35" y="35" width="130" height="130"/>`,
  triangle: `<path d="M100 25L175 165H25z"/>`,
  rectangle: `<rect x="20" y="55" width="160" height="90"/>`,
  star: `<path d="M100 22l22 50 54 5-41 36 12 53-47-28-47 28 12-53-41-36 54-5z"/>`,
  heart: `<path d="M100 170C35 120 20 85 40 55c18-27 50-22 60 3 10-25 42-30 60-3 20 30 5 65-60 115z"/>`,
  oval: `<ellipse cx="100" cy="100" rx="80" ry="55"/>`,
  diamond: `<path d="M100 20l65 80-65 80-65-80z"/>`,
  hexagon: `<path d="M60 30h80l40 70-40 70H60L20 100z"/>`,
  pentagon: `<path d="M100 22l75 55-28 88H53L25 77z"/>`,
};
const shapeSvg = (name, size, dotted = false, stroke = "#13233f") =>
  `<svg viewBox="0 0 200 200" width="${size}" height="${size}" fill="none" stroke="${dotted ? "#8d99ad" : stroke}" stroke-width="${dotted ? 3.5 : 5}" ${dotted ? 'stroke-dasharray="7 6"' : ""} stroke-linejoin="round">${SHAPES[name]}</svg>`;

const COLOURS = [
  ["Red", "#d93b3b", "apple"],
  ["Orange", "#f28c28", "sun"],
  ["Yellow", "#f5cf2a", "star"],
  ["Green", "#3f9a4b", "leaf"],
  ["Blue", "#2f72d6", "fish"],
  ["Purple", "#8a4fc0", "flower"],
  ["Pink", "#ec79a6", "heart"],
  ["Brown", "#8a5a33", "bear"],
];

function shapesColours() {
  const r = rng(21);
  const pages = [];
  const names = Object.keys(SHAPES);
  for (const name of names)
    pages.push({
      section: "Shapes",
      title: `This is a ${name}`,
      intro: `Trace the big ${name}. Then trace the small ones and draw one of your own.`,
      body: `<div class="center" style="flex:1;display:flex;align-items:center;justify-content:center">${shapeSvg(name, 470, true)}</div><div style="display:flex;justify-content:space-around">${shapeSvg(name, 150, true)}${shapeSvg(name, 150, true)}${shapeSvg(name, 150, true)}</div>${hwRows(2, `${name}`)}`,
    });
  for (const [colour, hex, ic] of COLOURS)
    pages.push({
      section: "Colours",
      title: `<span style="color:${hex}">${colour}</span>`,
      intro: `Colour the picture ${colour.toLowerCase()}. What else is ${colour.toLowerCase()}? Draw it in the box.`,
      body: `<div style="display:flex;align-items:center;gap:8mm"><div style="width:30mm;height:30mm;border-radius:50%;background:${hex}"></div>${trace(colour.toLowerCase(), { size: 64 })}</div><div class="center" style="flex:1;display:flex;align-items:center;justify-content:center">${icon(ic, 470, "#1b2433", 3.5)}</div><div class="box" style="height:55mm"></div>`,
    });
  // Shape counting.
  for (let p = 0; p < 2; p++) {
    const pool = shuffle(r, names).slice(0, 4);
    const scatter = [];
    for (let i = 0; i < 16; i++) scatter.push(pool[Math.floor(r() * 4)]);
    pages.push({
      section: "Counting shapes",
      title: "How many of each shape?",
      intro: "Count each shape and write the number.",
      body: `<div style="flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;align-items:center">${scatter.map((s) => `<div class="center">${shapeSvg(s, 115)}</div>`).join("")}</div><div class="grid4">${pool.map((s) => `<div class="box center">${shapeSvg(s, 54)}<div class="write"></div></div>`).join("")}</div>`,
    });
  }
  pages.push({
    section: "Colours",
    title: "My rainbow",
    intro: "Colour each stripe of the rainbow in the right colour.",
    body: `<div class="center" style="flex:1">${icon("rainbow", 560, "#1b2433", 3)}</div><div class="grid3">${["red", "orange", "yellow", "green", "blue", "purple"].map((c) => `<div class="pill" style="text-align:center">${c}</div>`).join("")}</div>`,
  });
  return pages;
}

// ---------------------------------------------------------------------------
// First phonics: CVC words by vowel.

const CVC = {
  a: ["cat", "hat", "map", "bag", "van", "jam", "pan", "cap"],
  e: ["pen", "bed", "net", "hen", "leg", "web", "jet", "red"],
  i: ["pig", "sit", "bin", "lip", "fin", "zip", "wig", "dig"],
  o: ["dog", "pot", "fox", "log", "box", "top", "mop", "hot"],
  u: ["sun", "bug", "cup", "bus", "mug", "hut", "rug", "nut"],
};

function phonics() {
  const pages = [];
  const sound = (w) => `<div style="display:flex;gap:2mm">${[...w].map((ch) => `<div style="width:16mm;height:16mm;border:.6mm solid #9aa6b8;border-radius:2mm;display:flex;align-items:center;justify-content:center;font:600 20pt Figtree;color:#c3cad6">${ch}</div>`).join("")}</div>`;
  for (const [v, words] of Object.entries(CVC)) {
    pages.push({
      section: `Short ${v}`,
      title: `The short “${v}” sound`,
      intro: `Say each word slowly. Can you hear the “${v}” in the middle?`,
      body: `<div class="grid2" style="flex:1;grid-auto-rows:1fr">${words.map((w) => `<div class="box" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4mm"><span style="font:400 40pt Gloock">${w}</span>${sound(w)}</div>`).join("")}</div>`,
    });
    pages.push({
      section: `Short ${v}`,
      title: `Trace the “${v}” words`,
      intro: "Trace the dotted words, then write them on your own.",
      body: hwRows(9, words.slice(0, 4).join("  ")),
    });
    pages.push({
      section: `Short ${v}`,
      title: `Missing letter: ${v}`,
      intro: "Write the missing letter to finish each word. Read it to a grown-up!",
      body: `<div class="grid2" style="flex:1">${words.map((w) => `<div class="box" style="display:flex;align-items:center;justify-content:center;font:400 34pt Gloock;letter-spacing:4mm">${w[0]}<span style="display:inline-block;width:14mm;border-bottom:.8mm solid #13233f;margin:0 1mm"></span>${w[2]}</div>`).join("")}</div>`,
    });
    pages.push({
      section: `Short ${v}`,
      title: `Read, write and draw`,
      intro: "Choose three words. Write each one and draw a picture of it.",
      body: [1, 2, 3].map(() => `<div class="box" style="flex:1;display:flex;gap:5mm"><div style="flex:1">${hwRows(1)}</div><div style="width:70mm;border:.5mm dashed #b6c0cf;border-radius:3mm"></div></div>`).join(""),
    });
  }
  // Mixed review.
  const all = Object.values(CVC).flat();
  for (let p = 0; p < 3; p++) {
    const words = shuffle(rng(40 + p), all).slice(0, 12);
    pages.push({
      section: "Review",
      title: "Read the words",
      intro: "Read each word out loud. Tick it when you can read it all by yourself.",
      body: `<div class="grid3" style="flex:1">${words.map((w) => `<div class="box" style="display:flex;align-items:center;justify-content:space-between;font:400 26pt Gloock">${w}<span class="check"></span></div>`).join("")}</div>`,
    });
  }
  return pages;
}

export const products = [
  {
    slug: "pencil-control-pre-writing",
    title: "Pencil Power Pre‑Writing Book",
    kicker: "Ready, steady, write",
    subtitle: "Lines, zigzags, waves, loops and spirals that build strong writing hands.",
    series: "Little learners",
    ages: "Ages 3–5",
    theme: "sky",
    motif: "waves",
    seed: 31,
    heroIcons: ["pencil", "star", "rocket"],
    price: 249,
    tagline: "The first step to beautiful handwriting starts with one wiggly line.",
    description:
      "Dotted paths from straight lines to loops and spirals, then first strokes and words. Builds the pencil control children need before letters.",
    pages: () => [...pencilControl(), certPage("sky", "Pencil Power Star", "pencil")],
  },
  {
    slug: "shapes-and-colours-book",
    title: "My Shapes & Colours Book",
    kicker: "See it, say it, colour it",
    subtitle: "Ten shapes and eight colours to trace, find, count and colour.",
    series: "Little learners",
    ages: "Ages 3–5",
    theme: "rose",
    motif: "confetti",
    seed: 32,
    heroIcons: ["heart", "star", "sun"],
    price: 199,
    tagline: "Circles, stars and rainbows: learning shapes has never looked so bright.",
    description:
      "Trace circles, squares, stars and hexagons, colour pictures in each colour, count mixed shapes and finish a rainbow. 22 cheerful pages for curious toddlers.",
    pages: () => [...shapesColours(), certPage("rose", "Shape & Colour Champion", "star")],
  },
  {
    slug: "first-phonics-cvc-words",
    title: "First Phonics: Three-Letter Words",
    kicker: "C-a-t spells cat!",
    subtitle: "40 short-vowel words to sound out, trace, finish and read aloud.",
    series: "Little learners",
    ages: "Ages 4–6",
    theme: "teal",
    motif: "letters",
    seed: 33,
    heroIcons: ["book", "cat", "sun"],
    price: 249,
    tagline: "Watch them light up when they read their very first words.",
    description:
      "Sound buttons, tracing, missing letters and read-and-draw pages for the short a, e, i, o and u sounds, plus mixed reading reviews. Matches what children learn in Reception.",
    pages: () => [...phonics(), certPage("teal", "Super Reader", "book")],
  },
];
