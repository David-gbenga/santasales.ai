// Family & celebrations: baby milestone cards, first-year memory book,
// nursery prints, reward charts, certificates, tooth fairy kit, treasure hunt.

import { icon } from "../icons.mjs";
import { THEMES, certificate, chart, writeLines } from "../lib.mjs";

const PASTELS = ["#f9d9df", "#d8ecf7", "#e2f1dc", "#fbe8c8", "#e8def5", "#d6f0ec"];
const DEEP = ["#c24a5e", "#2a6fa8", "#3f7d3a", "#b86b0c", "#6b4c9a", "#1f6f78"];

/** A full-colour page (keepsake cards and prints), filling the page area. */
const fullColour = (bg, inner) =>
  `<div style="position:absolute;inset:0;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20mm">${inner}</div>`;

// ---------------------------------------------------------------------------

function milestoneCards() {
  const pages = [];
  for (let m = 1; m <= 12; m++) {
    const i = m % PASTELS.length;
    pages.push({
      section: "Monthly cards",
      body: fullColour(
        PASTELS[i],
        `${icon(["star", "moon", "sun", "heart", "cloud", "flower"][i], 120, DEEP[i], 6)}
        <div style="font:600 14pt Figtree;letter-spacing:.3em;text-transform:uppercase;color:${DEEP[i]};margin-top:8mm">Today I am</div>
        <div style="font:400 190pt/0.9 Gloock;color:${DEEP[i]}">${m}</div>
        <div style="font:400 40pt Gloock;color:#13233f">${m === 1 ? "month" : "months"} old</div>
        <div style="margin-top:14mm;width:130mm;text-align:left;font:600 15pt Figtree;color:#13233f;line-height:2.6">
          <div style="border-bottom:.5mm solid ${DEEP[i]}">My name:</div><div style="border-bottom:.5mm solid ${DEEP[i]}">I weigh:</div><div style="border-bottom:.5mm solid ${DEEP[i]}">I love:</div></div>`,
      ),
    });
  }
  const firsts = [
    ["My first smile", "smile"], ["My first bath", "bottle"], ["I rolled over!", "baby"], ["My first tooth", "tooth"], ["I can sit up!", "star"], ["My first food", "bowl"],
    ["I’m crawling!", "footprint"], ["My first word", "speech"], ["My first steps", "footprint"], ["My first holiday", "sun"], ["My first Christmas", "star"], ["Happy 1st birthday!", "gift"],
  ];
  firsts.forEach(([t, ic], k) => {
    const i = k % PASTELS.length;
    pages.push({
      section: "Milestone cards",
      body: fullColour(PASTELS[i], `${icon(ic, 210, DEEP[i], 5)}<div style="font:400 58pt/1.05 Gloock;color:#13233f;margin-top:10mm;max-width:150mm">${t}</div><div style="margin-top:16mm;width:110mm;border-bottom:.6mm solid ${DEEP[i]};font:600 12pt Figtree;color:${DEEP[i]};text-align:left;padding-bottom:2mm">Date:</div>`),
    });
  });
  return pages;
}

function memoryBook() {
  const pages = [];
  const photo = (h, label = "Photo") => `<div style="height:${h}mm;border:.6mm dashed #b6c0cf;border-radius:4mm;display:flex;align-items:center;justify-content:center;color:#9aa6b8;font:600 11pt Figtree;letter-spacing:.12em;text-transform:uppercase">${label}</div>`;
  const prompts = (list) => list.map((q) => `<div><div class="label">${q}</div>${writeLines(1, 11)}</div>`).join("");
  pages.push({ section: "Hello world", title: "Hello, world!", intro: "The day you arrived", body: `${photo(90, "Your first photo")}${prompts(["Name", "Born on", "Time", "Weight", "Length", "Place of birth", "Who was there"])}` });
  pages.push({ section: "Hello world", title: "The story of your birth", intro: "Write down everything you want to remember.", body: `<div class="box" style="flex:1;background:repeating-linear-gradient(#fff 0 11mm,#dde3ec 11mm 11.3mm)"></div>` });
  pages.push({ section: "Family", title: "Your family tree", intro: "The people who love you.", body: `<div style="flex:1;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr 1fr;gap:5mm">${["Grandparent", "Grandparent", "Grandparent", "Grandparent", "", "Parent", "Parent", "", "", "You", null, ""].map((l, i) => (l === null ? "" : l ? `<div class="box center" style="${i === 9 ? "grid-column:2 / span 2" : ""};display:flex;flex-direction:column;justify-content:flex-end"><div class="write"></div><div class="label">${l}</div></div>` : "<div></div>")).join("")}</div>` });
  pages.push({ section: "Family", title: "When you were born…", intro: "A snapshot of the world on your birthday.", body: prompts(["A loaf of bread cost", "The number one song was", "The weather was", "In the news", "Your parents’ favourite things", "Our hopes for you"]) + writeLines(4, 11) });
  for (let m = 1; m <= 12; m++)
    pages.push({
      section: `Month ${m}`,
      title: `Month ${m}`,
      intro: m === 1 ? "Your first month at home." : "Look how much you’ve grown!",
      body: `<div class="grid2">${photo(75)}<div>${prompts(["Weight", "Favourite things", "New things you did", "You made us laugh when"])}</div></div><div class="label">Memories this month</div>${writeLines(7, 11)}`,
    });
  pages.push({
    section: "Firsts",
    title: "Your firsts",
    intro: "Write the date beside each one.",
    body: `<table class="t">${["First smile", "First laugh", "Rolled over", "First tooth", "Sat up", "First food", "Crawled", "First word", "Stood up", "First steps", "First haircut", "First holiday"].map((f) => `<tr><td style="font-size:14pt;height:14mm">${f}</td><td style="width:60mm;border-bottom:.4mm solid #9aa6b8"></td></tr>`).join("")}</table>`,
  });
  pages.push({ section: "Birthday", title: "Your first birthday", intro: "How we celebrated.", body: `${photo(100)}${prompts(["Where we celebrated", "Who came", "Your cake", "Favourite present"])}` });
  pages.push({ section: "Letter", title: "A letter to you", intro: "To read when you’re older.", body: `<div class="box" style="flex:1;background:repeating-linear-gradient(#fff 0 11mm,#dde3ec 11mm 11.3mm)"></div>` });
  return pages;
}

function nurseryPrints() {
  const prints = [
    ["Dream big, little one", "star", 0],
    ["You are so loved", "heart", 1],
    ["Hello, little star", "moon", 2],
    ["Be brave, be kind, be you", "sun", 3],
    ["Sweet dreams", "cloud", 4],
    ["Adventure awaits", "rocket", 5],
  ];
  const pages = prints.map(([quote, ic, i]) => ({
    section: "Wall prints",
    body: fullColour(
      PASTELS[i],
      `<div style="position:absolute;inset:14mm;border:1mm solid ${DEEP[i]};border-radius:6mm;opacity:.35"></div>${icon(ic, 260, DEEP[i], 4)}<div style="font:400 66pt/1.05 Gloock;color:#13233f;margin-top:12mm;max-width:160mm">${quote}</div><div style="width:40mm;height:1.2mm;background:${DEEP[i]};margin-top:12mm;border-radius:1mm"></div>`,
    ),
  }));
  const animals = [["A", "apple", "apple"], ["B", "bear", "bear"], ["C", "cat", "cat"], ["D", "dog", "dog"], ["E", "egg", "star"], ["F", "fish", "fish"], ["G", "gift", "gift"], ["H", "house", "house"], ["I", "ice", "cloud"], ["J", "jet", "plane"], ["K", "key", "key"], ["L", "leaf", "leaf"], ["M", "moon", "moon"], ["N", "nest", "leaf"], ["O", "owl", "owl"], ["P", "paw", "paw"], ["Q", "queen", "crown"], ["R", "rocket", "rocket"], ["S", "sun", "sun"], ["T", "tree", "tree"], ["U", "unicorn", "unicorn"], ["V", "van", "truck"], ["W", "whale", "fish"], ["X", "x marks the spot", "map"], ["Y", "yo-yo", "ball"], ["Z", "zig-zag", "star"]];
  pages.push({
    section: "Alphabet poster",
    body: fullColour(
      "#fffaf2",
      `<div style="font:400 40pt Gloock;color:#13233f;margin-bottom:6mm">A to Z</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:3mm;width:100%">${animals.map(([l, w, ic], k) => `<div style="background:${PASTELS[k % 6]};border-radius:3mm;padding:2mm;text-align:center"><div style="font:400 24pt/1 Gloock;color:${DEEP[k % 6]}">${l}${l.toLowerCase()}</div>${icon(ic, 46, DEEP[k % 6], 7)}<div style="font:600 8pt Figtree;color:#13233f">${w}</div></div>`).join("")}</div>`,
    ),
  });
  return pages;
}

function rewardCharts() {
  const t = THEMES.lime;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const pages = [];
  const name = `<div style="display:flex;gap:4mm;align-items:center;font:600 13pt Figtree">Name: <span style="flex:1;border-bottom:.5mm solid #9aa6b8;height:9mm"></span>My reward: <span style="flex:1;border-bottom:.5mm solid #9aa6b8;height:9mm"></span></div>`;
  const charts = [
    ["Morning routine", "sun", ["Get dressed", "Brush teeth", "Brush hair", "Eat breakfast", "Pack my bag", "Shoes on"]],
    ["Bedtime routine", "moon", ["Tidy toys", "Bath or wash", "Pyjamas on", "Brush teeth", "Story time", "Lights out"]],
    ["Potty training", "star", ["Tried the potty", "Wee in the potty", "Poo in the potty", "Washed my hands", "Dry pants", "Dry at night"]],
    ["My jobs", "house", ["Make my bed", "Tidy my room", "Help lay the table", "Feed the pet", "Put clothes away", "Help with recycling"]],
    ["Reading", "book", ["Read for 10 minutes", "Read to a grown-up", "Learned a new word", "Finished a book", "Read before bed", "Shared a book"]],
    ["Kindness", "heart", ["Shared with someone", "Said something kind", "Helped without asking", "Said sorry", "Included someone", "Said thank you"]],
    ["Healthy habits", "apple", ["Ate fruit or veg", "Drank water", "Played outside", "Brushed teeth twice", "Slept well", "Screen-free time"]],
    ["Homework", "pencil", ["Spellings", "Reading", "Maths", "Times tables", "Project work", "Bag packed"]],
  ];
  for (const [title, ic, rows] of charts)
    pages.push({ section: "Charts", title: `${title} chart`, intro: "Colour a circle or add a sticker each time. Fill a row for a reward!", body: `<div style="display:flex;justify-content:center">${icon(ic, 80, t.line, 6)}</div>${chart(rows, days, "Task")}${name}` });
  pages.push({
    section: "Charts",
    title: "Sticker chart: 30 stars",
    intro: "Colour one star for every good choice. Reach the end for a big reward!",
    body: `<div style="flex:1;display:grid;grid-template-columns:repeat(5,1fr);gap:4mm;align-items:center;justify-items:center">${Array.from({ length: 30 }, (_, i) => `<div style="position:relative">${icon("star", 92, t.line, 5)}<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 13pt Figtree;padding-top:4mm">${i + 1}</span></div>`).join("")}</div>${name}`,
  });
  pages.push({
    section: "Charts",
    title: "Build your own chart",
    intro: "Write your own goals in the first column.",
    body: `${chart(["", "", "", "", "", "", ""], days, "My goal")}${name}`,
  });
  return pages;
}

function certificates() {
  const awards = [
    ["Super Reader", "for brilliant reading and a love of books", "book"], ["Kindness Champion", "for being kind, caring and helpful to others", "heart"], ["Star of the Week", "for shining brightly all week long", "star"],
    ["Brilliant Behaviour", "for making great choices", "smile"], ["Amazing Artist", "for wonderful, creative artwork", "pencil"], ["Maths Wizard", "for super-smart number skills", "brain"],
    ["Spelling Superstar", "for fantastic spelling", "pencil"], ["Great Helper", "for always lending a hand", "heart"], ["Brave Heart", "for being so brave", "crown"],
    ["Fantastic Friend", "for being a wonderful friend", "smile"], ["Top Tidier", "for keeping things neat and tidy", "house"], ["Sporting Star", "for skill, effort and teamwork", "ball"],
    ["Potty Pro", "for using the potty like a superstar", "star"], ["Sleep Champion", "for brilliant bedtimes", "moon"], ["Super Sibling", "for being the best brother or sister", "heart"],
    ["Fabulous Effort", "for trying really hard", "rocket"], ["Birthday Star", "for being totally awesome on your special day", "gift"], ["End of Term Superstar", "for a fantastic term", "crown"],
  ];
  const themes = ["berry", "sky", "pine", "plum", "ember", "teal"];
  return awards.map(([title, line, ic], i) => ({ section: "Certificates", body: certificate(themes[i % themes.length], title, line, ic) }));
}

function toothFairy() {
  const t = THEMES.plum;
  const letter = (heading, paras) => `<div style="flex:1;border:2.5mm double ${t.line};border-radius:6mm;padding:14mm;background:#fbf8ff;display:flex;flex-direction:column;gap:5mm">
    <div style="display:flex;justify-content:space-between;align-items:center"><div style="font:600 10pt Figtree;letter-spacing:.3em;text-transform:uppercase;color:${t.line}">From the desk of the Tooth Fairy</div>${icon("star", 50, t.line, 7)}</div>
    <div style="font:400 30pt Gloock;color:#13233f">${heading}</div>
    <div style="font-size:14pt;line-height:1.7;color:#2a3344">${paras.map((p) => `<p style="margin-bottom:4mm">${p}</p>`).join("")}</div>
    <div style="margin-top:auto;font:400 22pt Gloock;color:${t.line}">With sparkly love,<br>The Tooth Fairy</div></div>`;
  return [
    { section: "Letters", body: letter("Dear ____________________,", ["Congratulations on losing your <b>very first tooth</b>! I flew all the way here on a moonbeam to collect it.", "It is one of the shiniest teeth I have ever seen. You must brush them beautifully every morning and every night.", "I have left you a little something to say thank you. Keep smiling, keep brushing, and I’ll see you next time!"]) },
    { section: "Letters", body: letter("Dear ____________________,", ["What a treasure! Thank you for leaving your tooth out for me tonight.", "I’ll be using it to build my sparkling castle in the clouds. Every tooth I collect makes it a little brighter.", "Remember: lots of water, healthy snacks and two minutes of brushing, twice a day."]) },
    { section: "Letters", body: letter("Dear ____________________,", ["I’m so sorry I missed you last night! It was a very busy night with lots of wobbly teeth all over the world.", "Please leave your tooth out once more tonight, and I promise I’ll make a special trip just for you.", "Thank you for being so patient."]) },
    { section: "Certificates", body: certificate("plum", "Brave Tooth Award", "for being super brave when your tooth came out", "tooth") },
    {
      section: "Tracker",
      title: "My tooth tracker",
      intro: "Write the date each time you lose a tooth.",
      body: `<table class="t"><tr><th>Tooth</th><th>Date lost</th><th>Where it happened</th></tr>${Array.from({ length: 12 }, (_, i) => `<tr><td style="height:15mm">${i + 1}</td><td></td><td></td></tr>`).join("")}</table>`,
    },
    {
      section: "Notes",
      title: "A note for the Tooth Fairy",
      intro: "Write or draw a message to leave with your tooth.",
      body: `<div class="soft" style="font-size:14pt">Dear Tooth Fairy, my name is ____________ and I am ___ years old. My tooth came out when ______________________________.</div><div class="box" style="flex:1"></div>`,
    },
    {
      section: "Receipt",
      title: "Official tooth receipt",
      intro: "Cut out and leave by the pillow.",
      body: [1, 2].map(() => `<div class="box" style="flex:1;border-style:dashed;display:flex;flex-direction:column;gap:4mm;justify-content:center"><div style="font:400 24pt Gloock">Tooth Fairy Receipt</div>${writeLines(3, 11)}<div class="muted">Received with thanks: one sparkling tooth. Condition: excellent!</div></div>`).join(""),
    },
    {
      section: "Door sign",
      body: `<div style="flex:1;border:2.5mm double ${t.line};border-radius:8mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10mm;background:#fbf8ff">${icon("tooth", 220, t.line, 4)}<div style="font:400 54pt/1.05 Gloock;color:#13233f">Tooth Fairy,<br>please stop here!</div>${icon("star", 70, t.line, 6)}</div>`,
    },
    {
      section: "Pouch",
      title: "Tooth pouch to cut and fold",
      intro: "Cut along the outer line, fold the flaps in and glue the sides.",
      body: `<div style="flex:1;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 120 150" width="150mm"><path d="M10 40h100v100H10z M10 40l50-35 50 35" fill="none" stroke="#5b3f78" stroke-width="1" stroke-dasharray="3 2"/><path d="M10 40h100" stroke="#5b3f78" stroke-width=".6"/><text x="60" y="95" text-anchor="middle" font-family="Gloock" font-size="11" fill="#13233f">My tooth</text></svg></div>`,
    },
  ];
}

function treasureHunt() {
  const t = THEMES.ember;
  const indoor = [
    ["I’m cold inside and full of treats, look by the milk and cheesy eats.", "the fridge"],
    ["Splish and splash, I hold the bubbles, look in here and end your troubles.", "the bath"],
    ["Where you rest your sleepy head, look under the pillow on the bed.", "the bed"],
    ["Squishy and soft, I’m good for a sit, look under my cushions and you’ll find it.", "the sofa"],
    ["I go round and round to make clothes clean, look by the door of this washing machine.", "the washing machine"],
    ["You put me on before going out, look in a shoe and twirl about.", "a shoe"],
    ["I’m full of stories, tall and wide, look on my shelves to find what’s inside.", "the bookcase"],
    ["Look at me and you’ll see you, wave hello, then look by the loo! (Bathroom mirror.)", "the mirror"],
    ["I keep your toys all tidy and neat, open my lid for your next treat.", "the toy box"],
    ["Wipe your feet when you come in, the next clue is under where you begin.", "the doormat"],
    ["I hang up coats and hats all day, look in a pocket, hip hooray!", "the coat hooks"],
    ["Water me and watch me grow, look by the plant pot, have a go!", "a plant pot"],
  ];
  const outdoor = [
    ["I’m tall and green with leaves up high, look by my trunk, don’t pass me by.", "a tree"],
    ["Open me to go in or out, the clue is near the gate, no doubt!", "the gate"],
    ["Flowers live here in rows so neat, look in the flowerbed by your feet.", "the flowerbed"],
    ["I’m where you sit to rest a while, look on the bench and give a smile.", "the bench"],
    ["Tools and spades are kept in me, look by the shed door, one, two, three!", "the shed"],
    ["Little birds come here to eat, look by the feeder for your treat.", "the bird feeder"],
  ];
  const cards = (list) =>
    `<div class="grid2" style="flex:1;grid-auto-rows:1fr">${list.map(([clue, a], i) => `<div class="card" style="gap:3mm">${icon("map", 40, t.line, 7)}<div class="label">Clue</div><div style="font:400 15pt/1.35 Gloock;color:#13233f">${clue}</div><div class="muted" style="font-size:8pt">(${a})</div></div>`).join("")}</div>`;
  return [
    {
      section: "How to play",
      title: "How to run your treasure hunt",
      intro: "Ready in 10 minutes. Works for 1 to 10 explorers.",
      body: `<div class="soft" style="font-size:13pt;line-height:1.7"><p><b>1.</b> Print and cut out the clue cards. The answer is in small print on each card, so hide it after you cut it out (or fold it under).</p><p><b>2.</b> Choose 6 to 10 clues. Hide each clue at the place the <i>previous</i> clue describes.</p><p><b>3.</b> Give the first clue to your explorers. The last hiding place holds the treasure!</p><p><b>4.</b> Use the blank cards for your own clues, and the treasure map for extra fun.</p><p><b>Safety:</b> keep clues away from ovens, hobs, stairs, ponds and roads, and keep an eye on little explorers.</p></div>`,
    },
    { section: "Indoor clues", title: "Indoor clues (1)", body: cards(indoor.slice(0, 6)) },
    { section: "Indoor clues", title: "Indoor clues (2)", body: cards(indoor.slice(6)) },
    { section: "Garden clues", title: "Garden clues", body: cards(outdoor) },
    { section: "Your clues", title: "Write your own clues", body: `<div class="grid2" style="flex:1;grid-auto-rows:1fr">${Array.from({ length: 6 }, () => `<div class="card">${icon("map", 40, t.line, 7)}<div class="label">Clue</div>${writeLines(3, 10)}</div>`).join("")}</div>` },
    {
      section: "Map",
      title: "Treasure map",
      intro: "Draw your house or garden and mark X where the treasure is hidden!",
      body: `<div style="flex:1;border-radius:6mm;background:#fbefd8;border:1mm solid #b86b0c;position:relative">${icon("star", 60, "#b86b0c", 6)}<div style="position:absolute;right:8mm;bottom:8mm;font:400 60pt Gloock;color:#c8324a">X</div></div>`,
    },
    { section: "Prize", body: certificate("ember", "Treasure Hunter", "for solving every clue and finding the treasure", "map") },
    { section: "Prize", body: certificate("teal", "Super Sleuth", "for brilliant clue-cracking skills", "magnifier") },
  ];
}

export const products = [
  {
    slug: "baby-milestone-cards",
    title: "Baby Milestone Cards",
    kicker: "Snap, share, treasure",
    subtitle: "12 monthly cards and 12 big ‘firsts’ for perfect baby photos.",
    series: "Baby & family",
    ages: "0–1 year",
    theme: "rose",
    motif: "stars",
    seed: 71,
    heroIcons: ["baby", "heart", "star"],
    price: 199,
    tagline: "Every month is magic. Capture it in one adorable photo.",
    description:
      "24 full-colour cards: one for each month from 1 to 12, plus first smile, first tooth, first steps and more. Print, pop beside baby and snap. A lovely new-baby gift.",
    pages: () => milestoneCards(),
  },
  {
    slug: "baby-first-year-memory-book",
    title: "Baby’s First Year Memory Book",
    kicker: "The year you arrived",
    subtitle: "Birth story, family tree, month-by-month memories and every first.",
    series: "Baby & family",
    ages: "0–1 year",
    theme: "sand",
    motif: "dots",
    seed: 72,
    heroIcons: ["baby", "heart", "footprint"],
    price: 249,
    tagline: "The first year flies by. Keep every precious moment forever.",
    description:
      "A fill-in keepsake for parents: the day you arrived, birth story, family tree, a page for every month, first milestones, first birthday and a letter to read when they’re older.",
    pages: () => memoryBook(),
  },
  {
    slug: "nursery-wall-art-prints",
    title: "Nursery Wall Art Prints",
    kicker: "Hang a little love",
    subtitle: "Six dreamy quote prints and an A to Z alphabet poster.",
    series: "Baby & family",
    ages: "Nursery",
    theme: "teal",
    motif: "stars",
    seed: 73,
    heroIcons: ["moon", "star", "heart"],
    price: 149,
    tagline: "Six sweet prints that turn any nursery into a dreamland.",
    description:
      "Seven print-ready A4 artworks in soft pastels: ‘Dream big, little one’, ‘You are so loved’, ‘Hello, little star’ and more, plus a picture alphabet poster. Frame and enjoy.",
    pages: () => nurseryPrints(),
  },
  {
    slug: "reward-and-routine-charts",
    title: "Reward & Routine Charts",
    kicker: "Happy habits made easy",
    subtitle: "Morning, bedtime, potty, chores, reading and kindness charts.",
    series: "Baby & family",
    ages: "Ages 2–8",
    theme: "lime",
    motif: "confetti",
    seed: 74,
    heroIcons: ["star", "sun", "moon"],
    price: 149,
    tagline: "Fewer battles, more high-fives: charts that make routines fun.",
    description:
      "Ten printable charts: morning and bedtime routines, potty training, jobs, reading, kindness, healthy habits, homework, a 30-star sticker chart and a make-your-own chart.",
    pages: () => rewardCharts(),
  },
  {
    slug: "kids-certificates-awards",
    title: "Certificates & Awards for Kids",
    kicker: "Celebrate every win",
    subtitle: "18 colourful certificates, from Super Reader to Kindness Champion.",
    series: "Baby & family",
    ages: "Ages 3–11",
    theme: "berry",
    motif: "stars",
    seed: 75,
    heroIcons: ["crown", "star", "heart"],
    price: 149,
    tagline: "Big smiles guaranteed: 18 awards for every little victory.",
    description:
      "Eighteen ready-to-print certificates: Super Reader, Kindness Champion, Star of the Week, Maths Wizard, Potty Pro, Birthday Star and more. Perfect for home, clubs and classrooms.",
    pages: () => certificates(),
  },
  {
    slug: "tooth-fairy-kit",
    title: "The Tooth Fairy Kit",
    kicker: "A little sprinkle of magic",
    subtitle: "Letters, a bravery award, receipts, a tracker and a door sign.",
    series: "Baby & family",
    ages: "Ages 4–9",
    theme: "plum",
    motif: "stars",
    seed: 76,
    heroIcons: ["tooth", "star", "moon"],
    price: 149,
    tagline: "Make the first wobbly tooth a night they’ll never forget.",
    description:
      "Everything for a magical tooth night: three letters from the Tooth Fairy (including ‘sorry I missed you’), a brave tooth award, receipts, a tooth tracker, a note page and a door sign.",
    pages: () => toothFairy(),
  },
  {
    slug: "treasure-hunt-party-kit",
    title: "Treasure Hunt Party Kit",
    kicker: "X marks the fun",
    subtitle: "18 rhyming clues for indoors and the garden, a map and prizes.",
    series: "Party time",
    ages: "Ages 4–10",
    theme: "ember",
    motif: "dots",
    seed: 77,
    heroIcons: ["map", "magnifier", "star"],
    price: 149,
    tagline: "Rainy day sorted: a treasure hunt ready in ten minutes.",
    description:
      "18 rhyming clue cards for the house and garden, blank cards for your own clues, a treasure map, how-to-play guide and two winner certificates. Perfect for parties and rainy days.",
    pages: () => treasureHunt(),
  },
];
