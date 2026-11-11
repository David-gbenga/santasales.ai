// Early years (ages 3–6): themed activity packs, pencil control, shapes,
// first phonics.

import { icon } from "../icons.mjs";
import { THEMES, dotGroup, hwRows, iconRow, maze, rng, shuffle, trace } from "../lib.mjs";

const big = (name, colour) => `<div style="flex:1;display:flex;align-items:center;justify-content:center">${icon(name, 640, colour, 3.5)}</div>`;

/** A themed activity pack: tracing, counting, mazes, patterns, matching, colouring. */
function activityPack({ theme, seriesIcons, words, seed }) {
  const t = THEMES[theme];
  const r = rng(seed);
  const pages = [];
  const [main, second, third] = seriesIcons;

  // Trace the words.
  for (let i = 0; i < words.length; i += 2) {
    pages.push({
      section: "Tracing",
      title: "Trace the words",
      intro: "Follow the dots with your pencil. Then write the word on your own.",
      body: words
        .slice(i, i + 2)
        .map((w) => `<div class="soft" style="display:flex;align-items:center;gap:6mm">${icon(w.icon, 70, t.line, 7)}<div style="font:400 30pt Gloock">${w.word}</div></div>${hwRows(4, w.word.toLowerCase())}`)
        .join(""),
    });
  }
  // Count and write.
  for (let p = 0; p < 4; p++) {
    const rows = [1, 2, 3, 4, 5].map((k) => {
      const n = Math.min(10, Math.max(1, Math.round(r() * (p < 2 ? 5 : 9)) + 1));
      const ic = seriesIcons[(k + p) % seriesIcons.length];
      return `<div class="box" style="flex:1;display:flex;align-items:center;justify-content:space-between;gap:4mm"><div style="display:flex;flex-wrap:wrap;gap:2mm;max-width:130mm">${iconRow(ic, n, n > 6 ? 46 : 58, t.line)}</div><div style="display:flex;align-items:center;gap:3mm"><span class="muted">How many?</span><span style="display:inline-block;width:22mm;height:20mm;border:.6mm solid #9aa6b8;border-radius:3mm"></span></div></div>`;
    });
    pages.push({ section: "Counting", title: p < 2 ? "Count to 5" : "Count to 10", intro: "Count the pictures in each row. Write the number in the box.", body: rows.join("") });
  }
  // Number tracing 1–10.
  pages.push({
    section: "Numbers",
    title: "Trace the numbers 1 to 5",
    intro: "Say each number out loud as you trace it.",
    body: [1, 2, 3, 4, 5].map((n) => `<div style="display:flex;align-items:center;gap:5mm"><div style="width:16mm;font:400 30pt Gloock">${n}</div><div style="flex:1">${trace(`${n}  ${n}  ${n}  ${n}  ${n}  ${n}`, { size: 44 })}</div><div>${dotGroup(n, t.line, 6)}</div></div>`).join(""),
  });
  pages.push({
    section: "Numbers",
    title: "Trace the numbers 6 to 10",
    intro: "Say each number out loud as you trace it.",
    body: [6, 7, 8, 9, 10].map((n) => `<div style="display:flex;align-items:center;gap:5mm"><div style="width:16mm;font:400 30pt Gloock">${n}</div><div style="flex:1">${trace(`${n}  ${n}  ${n}  ${n}  ${n}`, { size: 44 })}</div></div>`).join(""),
  });
  // Mazes.
  [[6, 7], [8, 9], [10, 11]].forEach(([w, h], i) =>
    pages.push({
      section: "Mazes",
      title: `Maze ${i + 1}: find the way`,
      intro: `Help the ${words[i % words.length].word.toLowerCase()} get from start to finish.`,
      body: `<div style="display:flex;align-items:center;justify-content:center;gap:6mm">${icon(words[i % words.length].icon, 80, t.line, 7)}</div><div class="center" style="flex:1;display:flex;align-items:center;justify-content:center">${maze(w, h, seed + i, { size: 178 })}</div>`,
    }),
  );
  // What comes next?
  const patterns = [
    [main, second, main, second, main],
    [main, main, second, main, main],
    [second, third, third, second, third],
    [third, main, second, third, main],
  ];
  pages.push({
    section: "Patterns",
    title: "What comes next?",
    intro: "Look at each pattern. Draw what comes next in the empty box.",
    body: patterns.map((row) => `<div class="box" style="flex:1;display:flex;align-items:center;gap:4mm">${row.map((n) => icon(n, 78, t.line, 7)).join("")}<span style="display:inline-block;width:30mm;height:30mm;border:.6mm dashed #9aa6b8;border-radius:3mm;margin-left:auto"></span></div>`).join(""),
  });
  // Match the numbers.
  const nums = [1, 2, 3, 4, 5];
  const right = shuffle(r, nums);
  pages.push({
    section: "Matching",
    title: "Draw a line to match",
    intro: "Count the pictures, then draw a line to the right number.",
    body: `<div style="flex:1;display:grid;grid-template-columns:1.4fr 1fr;align-items:center">${nums.map((n, i) => `<div style="display:flex;align-items:center;gap:2mm">${iconRow(seriesIcons[i % 3], n, 48, t.line)} <span style="display:inline-block;width:4mm;height:4mm;border-radius:50%;background:#13233f;margin-left:4mm"></span></div><div style="display:flex;align-items:center;gap:4mm;justify-content:flex-end"><span style="display:inline-block;width:4mm;height:4mm;border-radius:50%;background:#13233f"></span><span style="font:400 48pt Gloock">${right[i]}</span></div>`).join("")}</div>`,
  });
  // Big and small.
  pages.push({
    section: "Thinking",
    title: "Circle the biggest",
    intro: "In each row, circle the biggest picture. Put a cross on the smallest.",
    body: [main, second, third, main].map((n) => `<div class="box" style="flex:1;display:flex;align-items:center;justify-content:space-around">${shuffle(r, [60, 120, 90]).map((s) => icon(n, s, t.line, 6)).join("")}</div>`).join(""),
  });
  // Colouring pages.
  for (const w of words.slice(0, 4))
    pages.push({ section: "Colouring", title: `Colour the ${w.word.toLowerCase()}`, intro: "Use your favourite colours. Add a background too!", body: big(w.icon, "#1b2433") });
  // Draw your own + certificate.
  pages.push({
    section: "Drawing",
    title: "Draw your own",
    intro: "Draw your favourite thing from this book. Give it a name!",
    body: `<div class="box" style="flex:1"></div><div class="write"></div>`,
  });
  return pages;
}

export const certPage = (theme, title, iconName) => ({
  section: "Well done",
  title: "",
  body: (() => {
    const t = THEMES[theme];
    return `<div style="flex:1;border:3mm double ${t.line};border-radius:6mm;padding:12mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6mm;background:${t.soft}">${icon(iconName, 120, t.line, 6)}<div class="label">Certificate</div><div style="font:400 36pt/1.05 Gloock;color:#13233f">${title}</div><div style="font-size:13pt;color:#4a5568">Awarded to</div><div style="width:70%;border-bottom:.6mm solid #13233f;height:14mm"></div><div style="font-size:13pt;color:#4a5568">for finishing every page. Brilliant work!</div></div>`;
  })(),
});

export const products = [
  {
    slug: "dinosaur-activity-pack",
    title: "Dino Discovery Activity Pack",
    kicker: "Roar into learning",
    subtitle: "Trace, count, solve mazes and colour with friendly dinosaurs.",
    series: "Little learners",
    ages: "Ages 3–6",
    theme: "pine",
    motif: "dots",
    seed: 11,
    heroIcons: ["dino", "leaf", "footprint"],
    price: 199,
    tagline: "Big roars, bigger smiles: dino-mite learning on every page.",
    description:
      "Trace dinosaur words, count footprints, find the way through mazes and colour friendly dinos. Gentle practice for pencil control, numbers 1 to 10 and patterns.",
    pages: () => [
      ...activityPack({
        theme: "pine",
        seriesIcons: ["dino", "leaf", "footprint"],
        words: [
          { word: "Dino", icon: "dino" },
          { word: "Leaf", icon: "leaf" },
          { word: "Tree", icon: "tree" },
          { word: "Sun", icon: "sun" },
          { word: "Cloud", icon: "cloud" },
          { word: "Moon", icon: "moon" },
        ],
        seed: 11,
      }),
      certPage("pine", "Dino Explorer", "dino"),
    ],
  },
  {
    slug: "unicorn-rainbow-activity-pack",
    title: "Unicorns & Rainbows Activity Pack",
    kicker: "A sprinkle of magic",
    subtitle: "Tracing, counting, mazes and colouring with unicorns, stars and rainbows.",
    series: "Little learners",
    ages: "Ages 3–6",
    theme: "plum",
    motif: "stars",
    seed: 12,
    heroIcons: ["unicorn", "rainbow", "star"],
    price: 199,
    tagline: "Magic on every page: trace, count and colour with unicorns.",
    description:
      "A sparkly practice pack: trace magical words, count stars and hearts, solve rainbow mazes and colour unicorns. Builds early writing, counting to 10 and pattern spotting.",
    pages: () => [
      ...activityPack({
        theme: "plum",
        seriesIcons: ["unicorn", "star", "heart"],
        words: [
          { word: "Star", icon: "star" },
          { word: "Moon", icon: "moon" },
          { word: "Cloud", icon: "cloud" },
          { word: "Heart", icon: "heart" },
          { word: "Unicorn", icon: "unicorn" },
          { word: "Rainbow", icon: "rainbow" },
        ],
        seed: 12,
      }),
      certPage("plum", "Magic Learner", "unicorn"),
    ],
  },
  {
    slug: "trucks-diggers-activity-pack",
    title: "Trucks & Diggers Activity Pack",
    kicker: "Beep beep, let's learn",
    subtitle: "Trace, count and race through mazes with trucks, diggers and rockets.",
    series: "Little learners",
    ages: "Ages 3–6",
    theme: "ember",
    motif: "grid",
    seed: 13,
    heroIcons: ["truck", "digger", "car"],
    price: 199,
    tagline: "Full speed ahead: busy-vehicle learning fun on every page.",
    description:
      "Trace vehicle words, count cars and trucks, steer through mazes and colour diggers and rockets. Perfect for little ones who love things that go.",
    pages: () => [
      ...activityPack({
        theme: "ember",
        seriesIcons: ["truck", "car", "digger"],
        words: [
          { word: "Truck", icon: "truck" },
          { word: "Car", icon: "car" },
          { word: "Digger", icon: "digger" },
          { word: "Rocket", icon: "rocket" },
          { word: "Plane", icon: "plane" },
          { word: "Ball", icon: "ball" },
        ],
        seed: 13,
      }),
      certPage("ember", "Super Driver", "truck"),
    ],
  },
];
