// School age (5–11): times tables, KS1 spellings, telling the time, mazes,
// word search, sudoku, feelings journal.

import { icon } from "../icons.mjs";
import { THEMES, hwRows, maze, rng, shuffle, sudoku, sudokuHtml, wordSearch, wordSearchHtml, writeLines } from "../lib.mjs";
import { certPage } from "./01-early-years.mjs";

// ---------------------------------------------------------------------------
// Times tables.

function timesTables() {
  const r = rng(51);
  const pages = [];
  const order = [2, 5, 10, 3, 4, 8, 6, 7, 9, 11, 12];
  for (const n of order) {
    pages.push({
      section: `${n} times table`,
      title: `The ${n} times table`,
      intro: "Read it, say it, then cover the answers and test yourself.",
      body: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:3mm 10mm;flex:1;align-content:space-evenly">${Array.from({ length: 12 }, (_, i) => `<div style="font:400 22pt Gloock;display:flex;justify-content:space-between;border-bottom:.3mm solid #dde3ec;padding:1.5mm 0"><span>${i + 1} × ${n} =</span><b style="color:${THEMES.berry.line}">${(i + 1) * n}</b></div>`).join("")}</div>`,
    });
    const qs = shuffle(r, [...Array(12).keys()].map((i) => i + 1));
    pages.push({
      section: `${n} times table`,
      title: `Practise the ${n}s`,
      intro: "Fill in each answer. Time yourself and beat your record next time!",
      body: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4mm 12mm;flex:1;align-content:space-evenly">${qs.map((q, i) => `<div style="font:400 20pt Gloock;display:flex;align-items:center;gap:3mm">${i % 3 === 2 ? `${n * q} ÷ ${n} =` : `${q} × ${n} =`}<span style="flex:1;border-bottom:.5mm solid #9aa6b8;height:9mm"></span></div>`).join("")}</div><div class="soft" style="display:flex;gap:10mm"><span>My time: ________</span><span>Score: ____ / 12</span></div>`,
    });
  }
  for (let p = 0; p < 6; p++) {
    const max = p < 3 ? 6 : 12;
    const qs = Array.from({ length: 24 }, () => [2 + Math.floor(r() * (max - 1)), 2 + Math.floor(r() * 11)]);
    pages.push({
      section: "Mixed practice",
      title: `Mixed tables challenge ${p + 1}`,
      intro: p < 3 ? "Tables up to 6 × 12." : "All tables up to 12 × 12. You've got this!",
      body: `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm 8mm;flex:1;align-content:space-evenly">${qs.map(([a, b]) => `<div style="font:400 17pt Gloock;display:flex;align-items:center;gap:2mm">${a} × ${b} =<span style="flex:1;border-bottom:.5mm solid #9aa6b8;height:8mm"></span></div>`).join("")}</div>`,
    });
  }
  pages.push({
    section: "Grid",
    title: "The big times table grid",
    intro: "Fill in the whole grid. Colour the square numbers (1, 4, 9, 16…).",
    body: `<table style="border-collapse:collapse;align-self:center;font:600 11pt Figtree">${Array.from({ length: 13 }, (_, y) => `<tr>${Array.from({ length: 13 }, (_, x) => `<td style="width:12.5mm;height:12.5mm;border:.3mm solid #b6c0cf;text-align:center;${!x || !y ? "background:#fdecef;color:#c8324a" : ""}">${!x && !y ? "×" : !x ? y : !y ? x : ""}</td>`).join("")}</tr>`).join("")}</table>`,
  });
  pages.push({
    section: "Answers",
    title: "Answers: the full grid",
    intro: "Check your grid and your mixed challenges here.",
    body: `<table style="border-collapse:collapse;align-self:center;font:600 11pt Figtree">${Array.from({ length: 13 }, (_, y) => `<tr>${Array.from({ length: 13 }, (_, x) => `<td style="width:12.5mm;height:12.5mm;border:.3mm solid #b6c0cf;text-align:center;${!x || !y ? "background:#fdecef;color:#c8324a" : x === y ? "background:#fff3c4" : ""}">${!x && !y ? "×" : !x ? y : !y ? x : x * y}</td>`).join("")}</tr>`).join("")}</table>`,
  });
  return pages;
}

// ---------------------------------------------------------------------------
// KS1 common exception words (National Curriculum, Years 1 and 2).

const Y1 = "the a do to today of said says are were was is his has I you your they be he me she we no go so by my here there where love come some one once ask friend school put push pull full house our".split(" ");
const Y2 = "door floor poor because find kind mind behind child children wild climb most only both old cold gold hold told every everybody even great break steak pretty beautiful after fast last past father class grass pass plant path bath hour move prove improve sure sugar eye could should would who whole any many clothes busy people water again half money Mr Mrs parents Christmas".split(" ");

function spellings() {
  const pages = [];
  const lists = [];
  for (let i = 0; i < Y1.length; i += 8) lists.push(["Year 1", Y1.slice(i, i + 8)]);
  for (let i = 0; i < Y2.length; i += 8) lists.push(["Year 2", Y2.slice(i, i + 8)]);
  lists.forEach(([year, words], i) => {
    pages.push({
      section: `${year} words`,
      title: `Spelling list ${i + 1}`,
      intro: "Look, say, cover, write, check. Tick each word when you spell it right.",
      body: `<table class="t"><tr><th>Look &amp; say</th><th>Write</th><th>Write again</th><th>✓</th></tr>${words.map((w) => `<tr><td style="font:400 20pt Gloock;height:20mm">${w}</td><td></td><td></td><td><span class="check"></span></td></tr>`).join("")}</table>`,
    });
  });
  for (let i = 0; i < 4; i++) {
    const words = shuffle(rng(60 + i), [...Y1, ...Y2]).slice(0, 4);
    pages.push({
      section: "Handwriting",
      title: "Trace and write",
      intro: "Trace each word neatly, then write it on your own.",
      body: words.map((w) => hwRows(2, w)).join(""),
    });
  }
  for (let i = 0; i < 3; i++) {
    const words = shuffle(rng(70 + i), [...Y1, ...Y2].filter((w) => w.length > 2)).slice(0, 6);
    pages.push({
      section: "Sentences",
      title: "Use it in a sentence",
      intro: "Write a sentence using each word. Remember capital letters and full stops!",
      body: words.map((w) => `<div><span class="pill">${w}</span>${writeLines(2, 11)}</div>`).join(""),
    });
  }
  return pages;
}

// ---------------------------------------------------------------------------
// Telling the time.

function clock(h, m, { hands = true, size = 62 } = {}) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `<text x="${50 + Math.sin(a) * 36}" y="${50 - Math.cos(a) * 36 + 3.6}" font-family="Figtree" font-weight="600" font-size="10" text-anchor="middle" fill="#13233f">${i || 12}</text>`;
  }).join("");
  const minA = (m / 60) * 2 * Math.PI, hourA = (((h % 12) + m / 60) / 12) * 2 * Math.PI;
  const hand = (a, len, w) => `<line x1="50" y1="50" x2="${50 + Math.sin(a) * len}" y2="${50 - Math.cos(a) * len}" stroke="#13233f" stroke-width="${w}" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 100 100" width="${size}mm" height="${size}mm"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#13233f" stroke-width="2.5"/>${ticks}${hands ? hand(hourA, 20, 3.5) + hand(minA, 31, 2.2) : ""}<circle cx="50" cy="50" r="2.5" fill="#c8324a"/></svg>`;
}
const timeWords = (h, m) => (m === 0 ? `${h} o’clock` : m === 30 ? `half past ${h}` : m === 15 ? `quarter past ${h}` : m === 45 ? `quarter to ${(h % 12) + 1}` : `${m} minutes past ${h}`);

function tellingTime() {
  const r = rng(81);
  const pages = [];
  const sets = [
    ["O’clock", [0]],
    ["Half past", [30]],
    ["Quarter past", [15]],
    ["Quarter to", [45]],
    ["Mixed: o’clock and half past", [0, 30]],
    ["Mixed: quarters", [15, 45]],
    ["Five-minute times", [5, 10, 20, 25, 35, 40, 50, 55]],
    ["All mixed up", [0, 15, 30, 45, 5, 20, 40, 55]],
  ];
  for (const [title, mins] of sets) {
    const times = Array.from({ length: 6 }, () => [1 + Math.floor(r() * 12), pick(mins)]);
    function pick(a) {
      return a[Math.floor(r() * a.length)];
    }
    pages.push({
      section: "Read the clock",
      title: `What time is it? ${title}`,
      intro: "Read each clock and write the time.",
      body: `<div class="grid3" style="flex:1;align-items:center">${times.map(([h, m]) => `<div class="center">${clock(h, m, { size: 50 })}<div class="write" style="margin:3mm 4mm 0"></div></div>`).join("")}</div>`,
    });
    const draw = Array.from({ length: 6 }, () => [1 + Math.floor(r() * 12), pick(mins)]);
    pages.push({
      section: "Draw the hands",
      title: `Draw the hands: ${title.toLowerCase()}`,
      intro: "Draw the hour hand short and the minute hand long.",
      body: `<div class="grid3" style="flex:1;align-items:center">${draw.map(([h, m]) => `<div class="center">${clock(h, m, { hands: false, size: 50 })}<div style="font:600 13pt Figtree;margin-top:2mm">${timeWords(h, m)}</div></div>`).join("")}</div>`,
    });
  }
  pages.push({
    section: "My day",
    title: "My day in times",
    intro: "Draw the hands to show when you do each thing.",
    body: `<div class="grid3" style="flex:1;align-items:center">${["I wake up", "I eat lunch", "School ends", "I have dinner", "Bath time", "I go to bed"].map((t) => `<div class="center">${clock(0, 0, { hands: false, size: 50 })}<div style="font:600 13pt Figtree;margin-top:2mm">${t}</div></div>`).join("")}</div>`,
  });
  return pages;
}

// ---------------------------------------------------------------------------
// Mazes book, word search, sudoku.

function mazeBook() {
  const pages = [];
  const levels = [
    ["Warm-up", 8, 10, 6],
    ["Tricky", 12, 15, 10],
    ["Super tricky", 16, 20, 10],
    ["Expert", 20, 26, 8],
  ];
  let n = 1;
  const icons = ["rocket", "fish", "car", "cat", "dog", "star", "balloon", "plane", "dino", "unicorn"];
  for (const [level, w, h, count] of levels)
    for (let i = 0; i < count; i++, n++)
      pages.push({
        section: `${level} mazes`,
        title: `Maze ${n}`,
        intro: `${level} level. Find the path from start to finish without crossing a wall.`,
        body: `<div style="display:flex;justify-content:center">${icon(icons[n % icons.length], 56, THEMES.night.line, 7)}</div><div style="flex:1;display:flex;align-items:center;justify-content:center">${maze(w, h, 900 + n, { size: 178 })}</div>`,
      });
  return pages;
}

const KID_THEMES = [
  ["Animals", ["lion", "tiger", "zebra", "monkey", "panda", "rabbit", "horse", "camel", "koala", "otter"]],
  ["Space", ["planet", "comet", "rocket", "moon", "star", "orbit", "galaxy", "alien", "meteor", "astronaut"]],
  ["Ocean", ["whale", "shark", "coral", "octopus", "crab", "dolphin", "seal", "turtle", "starfish", "wave"]],
  ["Food", ["pizza", "apple", "banana", "pasta", "carrot", "cheese", "bread", "grapes", "soup", "melon"]],
  ["Sports", ["football", "tennis", "rugby", "cricket", "netball", "golf", "hockey", "boxing", "rowing", "judo"]],
  ["Weather", ["rain", "snow", "sunny", "cloud", "storm", "wind", "frost", "fog", "thunder", "rainbow"]],
  ["Colours", ["red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "black", "white"]],
  ["Dinosaurs", ["fossil", "bones", "egg", "claw", "tail", "roar", "jungle", "volcano", "scales", "teeth"]],
  ["School", ["pencil", "ruler", "teacher", "lesson", "reading", "maths", "lunch", "friend", "playground", "book"]],
  ["Transport", ["train", "bus", "lorry", "bike", "boat", "plane", "tram", "scooter", "taxi", "ferry"]],
  ["Garden", ["flower", "worm", "seeds", "spade", "bee", "tree", "grass", "pond", "snail", "tulip"]],
  ["Body", ["head", "arms", "legs", "knees", "elbow", "hand", "nose", "mouth", "ears", "toes"]],
  ["Birthday", ["cake", "party", "candles", "balloon", "presents", "games", "music", "friends", "hats", "card"]],
  ["Farm", ["cow", "sheep", "pig", "goat", "duck", "hen", "tractor", "barn", "horse", "field"]],
  ["Jobs", ["doctor", "nurse", "chef", "pilot", "farmer", "baker", "vet", "builder", "artist", "teacher"]],
  ["Music", ["drum", "piano", "guitar", "violin", "song", "dance", "flute", "choir", "band", "trumpet"]],
  ["Seasons", ["spring", "summer", "autumn", "winter", "leaves", "snow", "sunshine", "puddle", "blossom", "harvest"]],
  ["Bugs", ["ant", "beetle", "spider", "moth", "ladybird", "wasp", "fly", "cricket", "snail", "caterpillar"]],
  ["Fairy tales", ["castle", "dragon", "knight", "queen", "king", "giant", "wizard", "magic", "forest", "tower"]],
  ["Toys", ["teddy", "blocks", "puzzle", "doll", "kite", "robot", "yoyo", "marbles", "train", "ball"]],
  ["Kitchen", ["spoon", "fork", "plate", "bowl", "oven", "kettle", "fridge", "cup", "pan", "knife"]],
  ["Holidays", ["beach", "tent", "suitcase", "map", "hotel", "camera", "postcard", "ice cream", "sandcastle", "passport"]],
];

function wordSearchBook(count, { size, diagonal, backwards, cellMm, fontPt, themes, seedBase, wordsPerGrid = 10 }) {
  const pages = [];
  const answers = [];
  themes.slice(0, count).forEach(([name, words], i) => {
    const ws = wordSearch(words.slice(0, wordsPerGrid), size, seedBase + i, { diagonal, backwards });
    pages.push({
      section: "Puzzles",
      title: `${i + 1}. ${name}`,
      intro: `Find all ${ws.placed.length} words. They go ${backwards ? "in any direction" : diagonal ? "across, down and diagonally" : "across and down"}.`,
      body: `${wordSearchHtml(ws, { cellMm, fontPt })}<div style="display:flex;flex-wrap:wrap;gap:3mm 6mm;justify-content:center;font:600 ${fontPt - 1}pt Figtree;text-transform:uppercase;letter-spacing:.05em">${ws.placed.map((w) => `<span><span class="check" style="width:4mm;height:4mm"></span> ${w}</span>`).join("")}</div>`,
    });
    answers.push([name, ws]);
  });
  for (let i = 0; i < answers.length; i += 4)
    pages.push({
      section: "Answers",
      title: "Answers",
      intro: "",
      body: `<div class="grid2" style="flex:1">${answers.slice(i, i + 4).map(([name, ws]) => `<div><div class="label">${name}</div>${wordSearchHtml(ws, { cellMm: 76 / size, fontPt: Math.max(6, 70 / size), showAnswers: true })}</div>`).join("")}</div>`,
    });
  return pages;
}

function sudokuBook() {
  const pages = [];
  const sols = [];
  const plan = [
    [4, 8, 6, "Starter 4×4"],
    [6, 16, 10, "Medium 6×6"],
    [9, 38, 8, "Big 9×9"],
  ];
  let n = 1;
  for (const [size, clues, count, label] of plan) {
    for (let i = 0; i < count; i += 2) {
      const a = sudoku(size, 300 + n, clues), b = sudoku(size, 301 + n, clues);
      const cell = size === 4 ? 22 : size === 6 ? 16 : 11;
      pages.push({
        section: label,
        title: `Puzzles ${n} and ${n + 1}`,
        intro: `Fill every row, column and box with the numbers 1 to ${size}, once each.`,
        body: `<div style="flex:1;display:flex;flex-direction:column;justify-content:space-around">${sudokuHtml(a, { cellMm: cell, fontPt: size === 9 ? 15 : 22 })}${sudokuHtml(b, { cellMm: cell, fontPt: size === 9 ? 15 : 22 })}</div>`,
      });
      sols.push([n, a], [n + 1, b]);
      n += 2;
    }
  }
  for (let i = 0; i < sols.length; i += 6)
    pages.push({
      section: "Answers",
      title: "Answers",
      body: `<div class="grid3" style="flex:1;align-content:start;gap:6mm">${sols.slice(i, i + 6).map(([k, s]) => `<div><div class="label">Puzzle ${k}</div>${sudokuHtml({ puzzle: s.solution, br: s.br, bc: s.bc }, { cellMm: 54 / s.solution.length, fontPt: 8, small: true })}</div>`).join("")}</div>`,
    });
  return pages;
}

// ---------------------------------------------------------------------------
// Feelings journal.

function feelings() {
  const pages = [];
  const feelingsList = [
    ["Happy", "smile", "What made you smile today?"],
    ["Sad", "sad", "What helps you when you feel sad?"],
    ["Worried", "cloud", "What could you tell a grown-up you trust?"],
    ["Angry", "sun", "What can you do to cool down? Breathe in for 4, out for 4."],
    ["Excited", "star", "What are you looking forward to?"],
    ["Calm", "leaf", "Where is your calm, cosy place?"],
    ["Proud", "crown", "What did you do that you are proud of?"],
    ["Brave", "rocket", "When were you brave?"],
  ];
  pages.push({
    section: "About me",
    title: "All about me",
    intro: "This journal is a safe place for your thoughts and feelings.",
    body: `<div class="box" style="height:80mm;display:flex;align-items:center;justify-content:center" class="muted">Draw yourself here</div>${["My name is", "I am … years old", "Three things I love", "Something I’m good at", "Someone who makes me feel safe"].map((q) => `<div><div class="label">${q}</div>${writeLines(1, 11)}</div>`).join("")}`,
  });
  for (const [name, ic, q] of feelingsList)
    pages.push({
      section: "My feelings",
      title: `Feeling ${name.toLowerCase()}`,
      intro: q,
      body: `<div style="display:flex;gap:6mm;align-items:center">${icon(ic, 120, THEMES.lime.line, 6)}<div style="flex:1">${writeLines(3, 11)}</div></div><div class="label">Draw how ${name.toLowerCase()} looks and feels</div><div class="box" style="flex:1"></div>`,
    });
  for (let d = 1; d <= 10; d++)
    pages.push({
      section: "Daily check-in",
      title: `Check-in day ${d}`,
      intro: "Circle how you feel, then write about your day.",
      body: `<div style="display:flex;justify-content:space-around">${["smile", "sad", "cloud", "star", "leaf"].map((i) => icon(i, 70, "#1b2433", 6)).join("")}</div><div class="label">Today I felt … because …</div>${writeLines(4, 11)}<div class="label">One kind thing I did</div>${writeLines(2, 11)}<div class="label">Three good things</div>${writeLines(3, 11)}`,
    });
  pages.push({
    section: "Calm tools",
    title: "My calm-down toolbox",
    intro: "Try these when big feelings come. Tick the ones that work for you.",
    body: ["Breathe slowly: in for 4, hold for 4, out for 4", "Squeeze a cushion, then let go", "Count five things you can see", "Have a drink of water", "Talk to someone you trust", "Draw or colour for a while", "Move: jump, stretch or dance", "Hug a pet or a teddy"].map((t) => `<div class="box" style="display:flex;align-items:center;gap:4mm;font-size:14pt"><span class="check"></span>${t}</div>`).join(""),
  });
  return pages;
}

export const products = [
  {
    slug: "times-tables-practice-book",
    title: "Times Tables Superstar",
    kicker: "From 2s to 12s",
    subtitle: "Learn, practise and race through every times table up to 12 × 12.",
    series: "School skills",
    ages: "Ages 6–11",
    theme: "berry",
    motif: "grid",
    seed: 41,
    heroIcons: ["star", "rocket", "crown"],
    glyphs: "×",
    price: 299,
    tagline: "12 × 12 = superstar. Times tables made fast, fun and confident.",
    description:
      "Every table from 2 to 12: learn pages, practice pages, timed mixed challenges and a full 12 × 12 grid with answers. Great for the Year 4 multiplication check.",
    pages: () => [...timesTables(), certPage("berry", "Times Tables Superstar", "crown")],
  },
  {
    slug: "ks1-spelling-practice",
    title: "Tricky Words Spelling Book",
    kicker: "Year 1 & Year 2",
    subtitle: "All the KS1 common exception words, ready to learn, trace and use.",
    series: "School skills",
    ages: "Ages 5–7",
    theme: "teal",
    motif: "letters",
    seed: 42,
    heroIcons: ["pencil", "book", "star"],
    glyphs: "Aa",
    price: 249,
    tagline: "Said, because, people: master every tricky KS1 word.",
    description:
      "Look-say-cover-write-check lists for every Year 1 and Year 2 common exception word in the National Curriculum, plus handwriting and sentence practice.",
    pages: () => [...spellings(), certPage("teal", "Spelling Champion", "pencil")],
  },
  {
    slug: "telling-the-time-workbook",
    title: "Tick Tock: Telling the Time",
    kicker: "O’clock to five past",
    subtitle: "Read clocks, draw the hands and plan your day.",
    series: "School skills",
    ages: "Ages 5–8",
    theme: "ember",
    motif: "dots",
    seed: 43,
    heroIcons: ["sun", "moon", "star"],
    price: 199,
    tagline: "Tick tock, learn the clock! From o’clock to five-minute times.",
    description:
      "Step-by-step clock practice: o’clock, half past, quarter past and to, then five-minute times. Read the clock, draw the hands and map out your own day.",
    pages: () => [...tellingTime(), certPage("ember", "Time Teller", "sun")],
  },
  {
    slug: "amazing-mazes-book",
    title: "Amazing Mazes",
    kicker: "34 mazes, four levels",
    subtitle: "From warm-up paths to expert labyrinths. Can you find the way?",
    series: "Puzzle time",
    ages: "Ages 5–10",
    theme: "night",
    motif: "grid",
    seed: 44,
    heroIcons: ["map", "rocket", "star"],
    price: 299,
    tagline: "34 mazes, four levels, one big question: can you find the way?",
    description:
      "34 printable mazes that grow with your child: warm-up, tricky, super tricky and expert. Perfect for car journeys, rainy days and quiet time.",
    pages: () => [...mazeBook(), certPage("night", "Maze Master", "map")],
  },
  {
    slug: "kids-word-search",
    title: "Super Word Search for Kids",
    kicker: "20 themed puzzles",
    subtitle: "Animals, space, dinosaurs and more, with answers at the back.",
    series: "Puzzle time",
    ages: "Ages 6–10",
    theme: "lime",
    motif: "letters",
    seed: 45,
    heroIcons: ["magnifier", "star", "book"],
    glyphs: "ABC",
    price: 249,
    tagline: "Spot it, circle it, shout it! 20 word hunts kids love.",
    description:
      "20 themed word searches (animals, space, ocean, food, sport and more) with words going across, down and diagonally. Answer pages included.",
    pages: () => [
      ...wordSearchBook(20, { size: 12, diagonal: true, backwards: false, cellMm: 13, fontPt: 16, themes: KID_THEMES, seedBase: 500 }),
      certPage("lime", "Word Search Wizard", "magnifier"),
    ],
  },
  {
    slug: "kids-sudoku",
    title: "Sudoku for Smart Kids",
    kicker: "4×4 to 9×9",
    subtitle: "24 number puzzles that build logic, step by step, with answers.",
    series: "Puzzle time",
    ages: "Ages 7–12",
    theme: "plum",
    motif: "grid",
    seed: 46,
    heroIcons: ["brain", "star", "lightbulb"],
    glyphs: "123",
    price: 249,
    tagline: "Small grids, big brains: 24 sudokus that grow with your child.",
    description:
      "Start with 4×4 grids, move to 6×6 and finish with real 9×9 sudoku. Every puzzle has one solution, and the answers are at the back.",
    pages: () => [...sudokuBook(), certPage("plum", "Sudoku Star", "brain")],
  },
  {
    slug: "kids-feelings-journal",
    title: "My Feelings Journal",
    kicker: "Big feelings, kind words",
    subtitle: "Name feelings, check in daily and build a calm-down toolbox.",
    series: "Growing minds",
    ages: "Ages 5–10",
    theme: "lime",
    motif: "waves",
    seed: 47,
    heroIcons: ["heart", "smile", "leaf"],
    price: 199,
    tagline: "Help little hearts find the words for big feelings.",
    description:
      "A gentle journal for children: all-about-me pages, eight feelings to explore, ten daily check-ins and a calm-down toolbox. Lovely to fill in together.",
    pages: () => [...feelings(), certPage("lime", "Feelings Explorer", "heart")],
  },
];

export { wordSearchBook, KID_THEMES };
