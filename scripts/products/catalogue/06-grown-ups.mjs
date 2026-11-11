// Teens & adults: GCSE revision planner, family quiz night, large-print
// word search, budget & savings planner.

import { icon } from "../icons.mjs";
import { THEMES, writeLines } from "../lib.mjs";
import { wordSearchBook } from "./03-school.mjs";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const grid = (cols, rows, rowH = 12, heads = null, firstW = null) =>
  `<table class="t" style="table-layout:fixed">${heads ? `<tr>${heads.map((h, i) => `<th style="${i === 0 && firstW ? `width:${firstW}mm` : ""}">${h}</th>`).join("")}</tr>` : ""}${Array.from({ length: rows }, () => `<tr>${Array.from({ length: cols }, () => `<td style="height:${rowH}mm;border:.3mm solid #dde3ec"></td>`).join("")}</tr>`).join("")}</table>`;

// ---------------------------------------------------------------------------

function revisionPlanner() {
  const t = THEMES.night;
  const pages = [];
  pages.push({
    section: "Set up",
    title: "My exams at a glance",
    intro: "Write in every exam from your timetable. Highlight the first one!",
    body: grid(5, 16, 12, ["Subject", "Paper", "Date", "Time", "Room"]),
  });
  pages.push({
    section: "Set up",
    title: "My goals",
    intro: "Aim high, plan well, look after yourself.",
    body: `${["The grades I’m aiming for", "Why they matter to me", "My strongest subjects", "Subjects that need the most work", "How I’ll reward myself after exams"].map((q) => `<div><div class="label">${q}</div>${writeLines(2, 11)}</div>`).join("")}`,
  });
  pages.push({
    section: "Set up",
    title: "How to revise well",
    intro: "Five habits that make every hour count.",
    body: [
      ["Plan little and often", "Short, regular sessions beat last-minute cramming. Spread each subject across the weeks."],
      ["Test yourself", "Flashcards, past papers and blurting (write everything you remember, then check) beat re-reading."],
      ["Use 25-minute sprints", "Work for 25 minutes, rest for 5. After four sprints, take a longer break."],
      ["Mix it up", "Switch between topics in a session. It feels harder but you’ll remember more."],
      ["Sleep, eat, move", "Your brain stores learning while you sleep. Drink water and get outside every day."],
    ].map(([h, p]) => `<div class="box" style="display:flex;gap:5mm;align-items:flex-start">${icon("lightbulb", 44, t.line, 7)}<div><div style="font:400 17pt Gloock">${h}</div><div style="font-size:12pt;color:#4a5568">${p}</div></div></div>`).join(""),
  });
  for (let w = 1; w <= 8; w++)
    pages.push({
      section: "Weekly timetable",
      title: `Revision week ${w}`,
      intro: "Plan each session: subject and topic. Tick it off when done.",
      body: grid(8, 8, 22, ["Session", ...days], 22),
    });
  for (let s = 1; s <= 10; s++)
    pages.push({
      section: "Topic tracker",
      title: `Topic tracker: subject ${s}`,
      intro: "Subject: ______________________. Rate each topic red, amber or green, and update it as you go.",
      body: grid(5, 15, 11.5, ["Topic", "Red", "Amber", "Green", "Past paper done?"], 75),
    });
  pages.push({ section: "Past papers", title: "Past paper log", intro: "Track scores to see your progress.", body: grid(5, 16, 12, ["Subject", "Paper / year", "Score", "Grade", "What to fix"]) });
  pages.push({
    section: "Flashcards",
    title: "Flashcard templates",
    intro: "Cut out. Question on the front, answer on the back.",
    body: `<div class="grid2" style="flex:1;grid-auto-rows:1fr">${Array.from({ length: 8 }, () => `<div class="card" style="align-items:stretch;justify-content:flex-start;text-align:left"><div class="label">Question</div>${writeLines(3, 9)}</div>`).join("")}</div>`,
  });
  pages.push({
    section: "Wellbeing",
    title: "Wellbeing check-in",
    intro: "Exams matter, and so do you. Check in with yourself each week.",
    body: grid(5, 8, 20, ["Week", "Sleep (hrs)", "Mood 1–10", "Exercise", "Something good"]) + `<div class="soft" style="font-size:11.5pt">Feeling overwhelmed? Talk to someone you trust: a parent, teacher or friend. In the UK you can also contact Childline (0800 1111) or text SHOUT to 85258.</div>`,
  });
  pages.push({
    section: "Exam day",
    title: "Exam day checklist",
    intro: "Pack the night before. Breathe. You’ve got this.",
    body: ["Black pens (and spares)", "Pencil, sharpener, rubber", "Ruler and protractor", "Calculator (with fresh batteries)", "Clear pencil case", "Water bottle (label removed)", "Watch (non-smart)", "Know the room and start time", "Good breakfast and an early night", "Read every question twice"].map((x) => `<div class="box" style="display:flex;align-items:center;gap:4mm;font-size:14pt"><span class="check"></span>${x}</div>`).join(""),
  });
  return pages;
}

// ---------------------------------------------------------------------------

const QUIZ = {
  "General knowledge": [["What is the capital of Australia?", "Canberra"], ["How many sides does a hexagon have?", "Six"], ["Which planet is known as the Red Planet?", "Mars"], ["What is the largest ocean on Earth?", "The Pacific"], ["How many minutes are there in a day?", "1,440"], ["Which gas do plants take in from the air?", "Carbon dioxide"], ["What is the longest river in the UK?", "The River Severn"], ["At what temperature does water freeze, in Celsius?", "0 °C"], ["In which country are the pyramids of Giza?", "Egypt"], ["How many strings does a standard guitar have?", "Six"]],
  Animals: [["What is the fastest land animal?", "The cheetah"], ["What is a baby kangaroo called?", "A joey"], ["How many legs does a spider have?", "Eight"], ["What is the largest mammal?", "The blue whale"], ["Which bird is a well-known symbol of peace?", "The dove"], ["What is a group of lions called?", "A pride"], ["Which animal is called the ‘ship of the desert’?", "The camel"], ["How many hearts does an octopus have?", "Three"], ["What is a female deer called?", "A doe (or hind)"], ["Which is the only mammal that can truly fly?", "The bat"]],
  Geography: [["What is the largest country in the world by area?", "Russia"], ["What is the capital of Canada?", "Ottawa"], ["On which continent is Kenya?", "Africa"], ["Which river flows through London?", "The Thames"], ["What is the highest mountain in the world?", "Mount Everest"], ["What is the capital of Scotland?", "Edinburgh"], ["Which ocean lies between Europe and North America?", "The Atlantic"], ["How many countries make up the United Kingdom?", "Four"], ["What is the largest hot desert in the world?", "The Sahara"], ["What is the capital of Japan?", "Tokyo"]],
  "Food and drink": [["Which country does paella come from?", "Spain"], ["What is the main ingredient of guacamole?", "Avocado"], ["Which fruit wears its seeds on the outside?", "The strawberry"], ["What is tofu made from?", "Soya beans"], ["Which nut is used to make marzipan?", "Almonds"], ["Which pastry is used for profiteroles?", "Choux pastry"], ["Which vegetable is carved into a jack-o’-lantern?", "A pumpkin"], ["Which spice gives many curries their yellow colour?", "Turmeric"], ["What is the Italian word for ice cream?", "Gelato"], ["What is a traditional filling of a Cornish pasty?", "Beef, potato, swede and onion"]],
  "Science and space": [["Which substance has the formula H₂O?", "Water"], ["Which force keeps our feet on the ground?", "Gravity"], ["What is the closest star to Earth?", "The Sun"], ["How many planets are in our solar system?", "Eight"], ["Which part of a plant mostly makes its food from sunlight?", "The leaves"], ["What is the hardest natural substance?", "Diamond"], ["Which organ pumps blood around the body?", "The heart"], ["What do bees collect from flowers to make honey?", "Nectar"], ["What is the chemical symbol for gold?", "Au"], ["Who was the first person to walk on the Moon?", "Neil Armstrong"]],
  Sport: [["How many players does a football team have on the pitch?", "Eleven"], ["In which sport is a shuttlecock used?", "Badminton"], ["How often are the Summer Olympic Games held?", "Every four years"], ["In tennis, what is a score of zero called?", "Love"], ["How many holes does a standard round of golf have?", "Eighteen"], ["In which sport is the Ashes contested?", "Cricket"], ["How many rings are on the Olympic flag?", "Five"], ["In snooker, how many points is the black ball worth?", "Seven"], ["Which sport uses the terms ‘try’ and ‘scrum’?", "Rugby"], ["How many players are on a netball team on court?", "Seven"]],
  "Music and the arts": [["How many keys does a standard piano have?", "88"], ["Who painted the Mona Lisa?", "Leonardo da Vinci"], ["What are the three primary colours in painting?", "Red, yellow and blue"], ["Which instrument is held under the chin and played with a bow?", "The violin"], ["How many musicians play in a quartet?", "Four"], ["Who wrote Romeo and Juliet?", "William Shakespeare"], ["What is a word that reads the same backwards, like ‘level’?", "A palindrome"], ["Which ballet features the Sugar Plum Fairy?", "The Nutcracker"], ["In which city is the Louvre museum?", "Paris"], ["A haiku is a short poem from which country?", "Japan"]],
  "All about Britain": [["What is the name of the great bell in the Elizabeth Tower in London?", "Big Ben"], ["Which city is nicknamed the Steel City?", "Sheffield"], ["What is the national animal of Scotland?", "The unicorn"], ["Which yellow flower is a national emblem of Wales?", "The daffodil"], ["On which date is Bonfire Night?", "5 November"], ["What is the highest mountain in the UK?", "Ben Nevis"], ["Which sea lies between Britain and Scandinavia?", "The North Sea"], ["Who lives at 10 Downing Street?", "The Prime Minister"], ["What is the capital of Northern Ireland?", "Belfast"], ["How many pence are there in a pound?", "100"]],
  "Numbers and puzzles": [["What is 7 × 8?", "56"], ["What is half of 150?", "75"], ["How many days are in a leap year?", "366"], ["What is the square root of 81?", "9"], ["What is 15% of 200?", "30"], ["How many seconds are in an hour?", "3,600"], ["What comes next: 2, 4, 8, 16…?", "32"], ["What is 10 in Roman numerals?", "X"], ["How many years are in a century?", "100"], ["How many sides does an octagon have?", "Eight"]],
  Celebrations: [["What date is Boxing Day?", "26 December"], ["What is the traditional gift for a 25th wedding anniversary?", "Silver"], ["What is the traditional gift for a 50th wedding anniversary?", "Gold"], ["Which Hindu festival is known as the Festival of Lights?", "Diwali"], ["What do people traditionally eat on Shrove Tuesday?", "Pancakes"], ["On which date is Valentine’s Day?", "14 February"], ["What is New Year’s Eve called in Scotland?", "Hogmanay"], ["Which bird is traditionally served at Christmas dinner in the UK?", "Turkey"], ["What do you call someone born on 29 February?", "A leapling"], ["How many candles are on a cake for someone turning 21?", "21"]],
};

function quizNight() {
  const t = THEMES.sky;
  const pages = [];
  pages.push({
    section: "How to play",
    title: "Quiz night: how to play",
    intro: "Ten rounds, 100 questions, one champion.",
    body: `<div class="soft" style="font-size:13pt;line-height:1.7"><p><b>1.</b> Split into teams of 2 to 6 and pick a fun team name.</p><p><b>2.</b> Give each team an answer sheet. The quizmaster reads each question twice.</p><p><b>3.</b> After each round, swap sheets and mark. One point per correct answer.</p><p><b>4.</b> Each team may play its <b>joker</b> on one round to double its points. Write the round on the score sheet before it starts!</p><p><b>5.</b> Tie? Use the tie-breaker: closest answer wins.</p></div><div class="label">Rounds</div><div class="grid2">${Object.keys(QUIZ).map((k, i) => `<div class="box" style="display:flex;align-items:center;gap:3mm"><span class="pill">${i + 1}</span>${k}</div>`).join("")}</div>`,
  });
  Object.entries(QUIZ).forEach(([round, qs], i) =>
    pages.push({
      section: `Round ${i + 1}`,
      title: `Round ${i + 1}: ${round}`,
      intro: "Quizmaster’s copy. Read each question twice.",
      body: `<ol style="list-style:none;display:flex;flex-direction:column;justify-content:space-between;flex:1">${qs.map(([q], k) => `<li style="display:flex;gap:4mm;font-size:16pt;line-height:1.35;border-bottom:.3mm solid #dde3ec;padding-bottom:4mm"><b style="color:${t.line};min-width:8mm">${k + 1}.</b>${q}</li>`).join("")}</ol>`,
    }),
  );
  pages.push({
    section: "Tie-breaker",
    title: "Tie-breaker",
    intro: "Closest answer wins.",
    body: `<div class="soft" style="font:400 22pt/1.4 Gloock">How many days old is someone who has just turned 10? <span style="font:400 12pt Figtree;color:#6b7587">(Answer: 3,652 or 3,653, depending on leap years. Closest wins.)</span></div>`,
  });
  for (let s = 0; s < 4; s++)
    pages.push({
      section: "Answer sheets",
      title: "Team answer sheet",
      intro: "Team name: ____________________________   Round: ____",
      body: `<table class="t">${Array.from({ length: 10 }, (_, i) => `<tr><td style="width:10mm;height:17mm;font-weight:600">${i + 1}</td><td></td></tr>`).join("")}</table><div style="font:600 13pt Figtree">Round score: ______ / 10</div>`,
    });
  pages.push({
    section: "Scores",
    title: "Score sheet",
    intro: "Mark the joker round with a ★.",
    body: grid(12, 8, 18, ["Team", ...Array.from({ length: 10 }, (_, i) => `R${i + 1}`), "Total"], 40),
  });
  const entries = Object.entries(QUIZ);
  for (let i = 0; i < entries.length; i += 2)
    pages.push({
      section: "Answers",
      title: `Answers: rounds ${i + 1} and ${i + 2}`,
      intro: "",
      body: entries
        .slice(i, i + 2)
        .map(([round, qs], j) => `<div><div class="label">Round ${i + j + 1}: ${round}</div><ol style="padding-left:6mm;font-size:12pt;line-height:1.55">${qs.map(([, a]) => `<li>${a}</li>`).join("")}</ol></div>`)
        .join(""),
    });
  pages.push({
    section: "Winners",
    body: `<div style="flex:1;border:3mm double ${t.line};border-radius:6mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8mm;background:${t.soft}">${icon("crown", 160, t.line, 5)}<div style="font:400 50pt/1.05 Gloock">Quiz Champions</div><div style="width:70%;border-bottom:.6mm solid #13233f;height:16mm"></div><div style="font-size:14pt;color:#4a5568">Brains, banter and bragging rights. Well played!</div></div>`,
  });
  return pages;
}

// ---------------------------------------------------------------------------

const SENIOR_THEMES = [
  ["British birds", ["robin", "blackbird", "wren", "sparrow", "magpie", "thrush", "starling", "goldfinch", "swallow", "kestrel"]],
  ["In the garden", ["roses", "tulips", "daffodil", "lavender", "hedge", "lawn", "shed", "compost", "trowel", "greenhouse"]],
  ["Baking day", ["flour", "sugar", "butter", "eggs", "scone", "sponge", "icing", "whisk", "oven", "cupcake"]],
  ["By the seaside", ["beach", "pier", "waves", "shells", "deckchair", "sandcastle", "lighthouse", "rockpool", "seagull", "promenade"]],
  ["Time for tea", ["teapot", "kettle", "biscuit", "saucer", "milk", "sugar", "scones", "jam", "cream", "cuppa"]],
  ["Trees", ["oak", "ash", "beech", "birch", "willow", "rowan", "holly", "yew", "elm", "maple"]],
  ["The weather", ["drizzle", "sunshine", "thunder", "breeze", "frost", "rainbow", "fog", "hail", "gale", "cloudy"]],
  ["UK cities", ["london", "bristol", "leeds", "glasgow", "cardiff", "belfast", "york", "bath", "oxford", "chester"]],
  ["British rivers", ["thames", "severn", "trent", "tyne", "mersey", "avon", "clyde", "tay", "wye", "ouse"]],
  ["Fruit bowl", ["apple", "pear", "plum", "cherry", "peach", "grape", "lemon", "mango", "banana", "orange"]],
  ["Vegetable patch", ["carrot", "potato", "onion", "leek", "cabbage", "parsnip", "turnip", "swede", "peas", "broccoli"]],
  ["Herbs", ["basil", "mint", "thyme", "sage", "parsley", "rosemary", "chives", "dill", "oregano", "coriander"]],
  ["Music", ["piano", "violin", "cello", "flute", "trumpet", "harp", "drums", "guitar", "oboe", "clarinet"]],
  ["Let’s dance", ["waltz", "tango", "foxtrot", "salsa", "jive", "rumba", "samba", "quickstep", "ballet", "polka"]],
  ["Card games", ["whist", "rummy", "snap", "poker", "bridge", "patience", "cribbage", "canasta", "hearts", "pontoon"]],
  ["Crafts", ["knitting", "sewing", "quilting", "pottery", "painting", "crochet", "weaving", "embroidery", "origami", "woodwork"]],
  ["Around Europe", ["france", "spain", "italy", "greece", "norway", "sweden", "poland", "ireland", "portugal", "austria"]],
  ["Colours", ["crimson", "scarlet", "amber", "emerald", "navy", "violet", "ivory", "lilac", "teal", "silver"]],
  ["In the kitchen", ["kettle", "toaster", "saucepan", "colander", "ladle", "whisk", "grater", "sieve", "fridge", "teaspoon"]],
  ["Country walk", ["meadow", "stream", "bridge", "hedgerow", "acorn", "conker", "pebble", "fern", "moss", "stile"]],
  ["Christmas", ["tinsel", "carols", "mince pie", "stocking", "cracker", "holly", "ivy", "snowman", "sleigh", "reindeer"]],
  ["Autumn", ["leaves", "harvest", "pumpkin", "bonfire", "chestnut", "misty", "apples", "scarf", "squirrel", "cosy"]],
  ["Spring", ["blossom", "lamb", "daffodil", "tulip", "nest", "bluebell", "easter", "chick", "showers", "primrose"]],
  ["Summer days", ["picnic", "sunhat", "holiday", "ice cream", "barbecue", "strawberry", "cricket", "lemonade", "sandals", "sunshine"]],
  ["Sport", ["tennis", "golf", "bowls", "cricket", "rugby", "snooker", "darts", "rowing", "cycling", "football"]],
  ["Jobs", ["baker", "butcher", "nurse", "doctor", "teacher", "farmer", "plumber", "builder", "pilot", "florist"]],
  ["On the farm", ["cow", "sheep", "pig", "horse", "goat", "hen", "duck", "goose", "donkey", "tractor"]],
  ["British wildlife", ["badger", "fox", "hedgehog", "otter", "deer", "hare", "squirrel", "mole", "stoat", "vole"]],
  ["Hobbies", ["reading", "walking", "fishing", "chess", "cooking", "singing", "dancing", "puzzles", "gardening", "bingo"]],
  ["The high street", ["bakery", "chemist", "grocer", "florist", "butcher", "library", "newsagent", "market", "cafe", "bank"]],
];

// ---------------------------------------------------------------------------

function budgetPlanner() {
  const t = THEMES.pine;
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const pages = [];
  pages.push({ section: "Overview", title: "My money goals", intro: "Big picture first. What would make this year a win?", body: `${["My top three money goals", "Why they matter", "Habits I want to build", "Habits I want to break"].map((q) => `<div><div class="label">${q}</div>${writeLines(3, 11)}</div>`).join("")}` });
  pages.push({ section: "Overview", title: "Year at a glance", intro: "Fill in at the end of each month.", body: grid(5, 12, 13, ["Month", "Money in", "Money out", "Saved", "Notes"]).replace(/<tr><td style="height:13mm;border:.3mm solid #dde3ec"><\/td>/g, () => "<tr><td style=\"height:13mm;border:.3mm solid #dde3ec\"></td>") });
  for (const m of months)
    pages.push({
      section: "Monthly budget",
      title: `${m} budget`,
      intro: "Plan it at the start of the month, check it at the end.",
      body: `<div class="grid2"><div><div class="label">Money in</div>${grid(3, 4, 9, ["Source", "Plan", "Actual"])}</div><div><div class="label">Bills &amp; fixed costs</div>${grid(3, 4, 9, ["Bill", "Plan", "Actual"])}</div></div><div class="label">Everyday spending</div>${grid(3, 8, 9, ["Category", "Plan", "Actual"])}<div class="grid3">${["Total in", "Total out", "Left to save"].map((l) => `<div class="box"><div class="label">${l}</div><div style="font:400 22pt Gloock">£</div></div>`).join("")}</div>`,
    });
  pages.push({ section: "Bills", title: "Bill tracker", intro: "Tick each bill when it’s paid.", body: grid(14, 12, 13, ["Bill", ...months.map((m) => m.slice(0, 3)), "£"], 40) });
  for (const g of [1, 2])
    pages.push({
      section: "Savings",
      title: `Savings goal ${g}`,
      intro: "Colour one coin for every £10 saved. Goal: £500.",
      body: `<div style="display:flex;gap:6mm"><div class="box" style="flex:1"><div class="label">Saving for</div><div class="write"></div></div><div class="box" style="flex:1"><div class="label">By (date)</div><div class="write"></div></div></div><div style="flex:1;display:grid;grid-template-columns:repeat(10,1fr);gap:2mm;align-content:center">${Array.from({ length: 50 }, (_, i) => `<div style="aspect-ratio:1;border:.6mm solid ${t.line};border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 8pt Figtree;color:${t.line}">£${(i + 1) * 10}</div>`).join("")}</div>`,
    });
  pages.push({ section: "Debt", title: "Debt payoff tracker", intro: "Smallest balance first (snowball) or highest interest first (avalanche): pick a method and stick with it.", body: grid(5, 14, 12, ["Debt", "Balance", "Interest %", "Minimum", "Paid off by"]) });
  pages.push({ section: "Sinking funds", title: "Sinking funds", intro: "Save a little each month for big costs you know are coming: birthdays, Christmas, car, holidays.", body: grid(6, 10, 15, ["Fund", "Target", "Monthly", "Saved", "Saved", "Done ✓"]) });
  for (const w of [1, 2])
    pages.push({ section: "Spending log", title: `Spending log ${w}`, intro: "Write down every spend for a month. Awareness is the first step.", body: grid(4, 20, 9.5, ["Date", "What", "Category", "£"]) });
  pages.push({
    section: "Challenge",
    title: "30-day no-spend challenge",
    intro: "Colour a day each time you spend nothing beyond essentials.",
    body: `<div style="flex:1;display:grid;grid-template-columns:repeat(6,1fr);gap:3mm">${Array.from({ length: 30 }, (_, i) => `<div style="border:.6mm solid ${t.line};border-radius:3mm;display:flex;align-items:flex-start;justify-content:flex-start;padding:2mm;font:600 11pt Figtree;color:${t.line}">${i + 1}</div>`).join("")}</div><div><div class="label">What I saved and what I learned</div>${writeLines(2, 11)}</div>`,
  });
  return pages;
}

export const products = [
  {
    slug: "gcse-revision-planner",
    title: "GCSE Revision Planner",
    kicker: "Plan it. Smash it.",
    subtitle: "Exam timetable, 8 weekly plans, topic trackers, past papers and wellbeing.",
    series: "Study smart",
    ages: "Ages 14–16",
    theme: "night",
    motif: "grid",
    seed: 81,
    heroIcons: ["calendar", "lightbulb", "star"],
    price: 249,
    tagline: "Less panic, more plan: revise smarter and walk in confident.",
    description:
      "A complete GCSE revision system: exam overview, goals, study tips, 8 weekly timetables, 10 subject topic trackers (red/amber/green), past paper log, flashcards, wellbeing check-ins and exam-day checklist.",
    pages: () => revisionPlanner(),
  },
  {
    slug: "family-quiz-night-pack",
    title: "Family Quiz Night",
    kicker: "100 questions, 10 rounds",
    subtitle: "Everything you need to host a brilliant quiz, with answers.",
    series: "Party time",
    ages: "Ages 10+",
    theme: "sky",
    motif: "confetti",
    seed: 82,
    heroIcons: ["lightbulb", "crown", "star"],
    glyphs: "?",
    price: 199,
    tagline: "Phones away, brains on: 100 questions for a cracking night in.",
    description:
      "Ten rounds from geography and sport to food and Britain, with quizmaster sheets, team answer sheets, a score sheet with joker rule, a tie-breaker, full answers and a champions certificate.",
    pages: () => quizNight(),
  },
  {
    slug: "large-print-word-search",
    title: "Large Print Word Search",
    kicker: "30 relaxing puzzles",
    subtitle: "Big, clear letters and gentle themes, from British birds to tea time.",
    series: "Puzzle time",
    ages: "Adults",
    theme: "teal",
    motif: "letters",
    seed: 83,
    heroIcons: ["magnifier", "flower", "leaf"],
    glyphs: "Aa",
    price: 299,
    tagline: "Big letters, calm minds: 30 puzzles that are easy on the eyes.",
    description:
      "30 large-print word searches with extra-big letters and familiar themes: the garden, the seaside, baking, British wildlife, music and more. Answers included. A thoughtful gift for grandparents.",
    pages: () =>
      wordSearchBook(30, { size: 12, diagonal: true, backwards: false, cellMm: 14.5, fontPt: 22, themes: SENIOR_THEMES, seedBase: 1200 }),
  },
  {
    slug: "budget-savings-planner",
    title: "Budget & Savings Planner",
    kicker: "Take control of your money",
    subtitle: "Monthly budgets, bill and debt trackers, savings goals and challenges.",
    series: "Life admin",
    ages: "Adults",
    theme: "pine",
    motif: "grid",
    seed: 84,
    heroIcons: ["coins", "chart", "calendar"],
    glyphs: "£",
    price: 199,
    tagline: "Know where every pound goes, and watch your savings grow.",
    description:
      "A full year of UK money planning: goals, year overview, 12 monthly budgets, bill tracker, two £500 savings charts, debt payoff tracker, sinking funds, spending logs and a 30-day no-spend challenge.",
    pages: () => budgetPlanner(),
  },
];
