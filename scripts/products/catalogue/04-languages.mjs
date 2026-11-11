// Languages: French, Spanish and Mandarin Chinese for children (first
// words / characters) and for travellers (phrase books).

import { icon } from "../icons.mjs";
import { THEMES, hwRows, rng, shuffle, tianGrid } from "../lib.mjs";
import { certPage } from "./01-early-years.mjs";

// ---------------------------------------------------------------------------
// First 100 words. Each entry: [target word, English, icon?]. Nouns carry
// their article so children learn the gender with the word.

const FRENCH_WORDS = {
  "Hello!": [["bonjour", "hello", "smile"], ["salut", "hi", "smile"], ["au revoir", "goodbye", "speech"], ["merci", "thank you", "heart"], ["s’il te plaît", "please", "heart"], ["oui", "yes", "smile"], ["non", "no", "sad"], ["bonne nuit", "good night", "moon"]],
  Numbers: [["un", "one"], ["deux", "two"], ["trois", "three"], ["quatre", "four"], ["cinq", "five"], ["six", "six"], ["sept", "seven"], ["huit", "eight"], ["neuf", "nine"], ["dix", "ten"]],
  Colours: [["rouge", "red"], ["bleu", "blue"], ["vert", "green"], ["jaune", "yellow"], ["orange", "orange"], ["rose", "pink"], ["violet", "purple"], ["noir", "black"], ["blanc", "white"], ["marron", "brown"]],
  Animals: [["le chat", "cat", "cat"], ["le chien", "dog", "dog"], ["le poisson", "fish", "fish"], ["l’oiseau", "bird", "leaf"], ["le cheval", "horse", "paw"], ["la vache", "cow", "paw"], ["le lapin", "rabbit", "paw"], ["l’ours", "bear", "bear"], ["la souris", "mouse", "paw"], ["le lion", "lion", "paw"]],
  Family: [["la maman", "mum", "heart"], ["le papa", "dad", "heart"], ["le frère", "brother", "smile"], ["la sœur", "sister", "smile"], ["la grand-mère", "grandma", "heart"], ["le grand-père", "grandad", "heart"], ["le bébé", "baby", "baby"], ["l’ami", "friend", "smile"]],
  Food: [["la pomme", "apple", "apple"], ["la banane", "banana", "apple"], ["le pain", "bread", "bowl"], ["le fromage", "cheese", "bowl"], ["le lait", "milk", "bottle"], ["l’eau", "water", "bottle"], ["le gâteau", "cake", "gift"], ["la fraise", "strawberry", "apple"]],
  "My body": [["la tête", "head", "smile"], ["les yeux", "eyes", "smile"], ["le nez", "nose", "smile"], ["la bouche", "mouth", "smile"], ["la main", "hand", "heart"], ["le pied", "foot", "footprint"], ["les oreilles", "ears", "smile"], ["les cheveux", "hair", "smile"]],
  "At home": [["la maison", "house", "house"], ["la porte", "door", "house"], ["la fenêtre", "window", "house"], ["le lit", "bed", "moon"], ["la table", "table", "house"], ["la chaise", "chair", "house"], ["le livre", "book", "book"], ["la balle", "ball", "ball"]],
  "Sky and weather": [["le soleil", "sun", "sun"], ["la lune", "moon", "moon"], ["l’étoile", "star", "star"], ["le nuage", "cloud", "cloud"], ["la pluie", "rain", "cloud"], ["la neige", "snow", "cloud"]],
  "Days of the week": [["lundi", "Monday"], ["mardi", "Tuesday"], ["mercredi", "Wednesday"], ["jeudi", "Thursday"], ["vendredi", "Friday"], ["samedi", "Saturday"], ["dimanche", "Sunday"]],
  Clothes: [["le chapeau", "hat", "crown"], ["les chaussures", "shoes", "footprint"], ["le manteau", "coat", "house"], ["la robe", "dress", "heart"], ["le pull", "jumper", "heart"], ["les chaussettes", "socks", "socks"]],
  "Getting about": [["la voiture", "car", "car"], ["le bus", "bus", "truck"], ["le train", "train", "truck"], ["l’avion", "plane", "plane"], ["le vélo", "bike", "car"], ["le bateau", "boat", "fish"]],
};

const SPANISH_WORDS = {
  "¡Hola!": [["hola", "hello", "smile"], ["buenos días", "good morning", "sun"], ["adiós", "goodbye", "speech"], ["gracias", "thank you", "heart"], ["por favor", "please", "heart"], ["sí", "yes", "smile"], ["no", "no", "sad"], ["buenas noches", "good night", "moon"]],
  Numbers: [["uno", "one"], ["dos", "two"], ["tres", "three"], ["cuatro", "four"], ["cinco", "five"], ["seis", "six"], ["siete", "seven"], ["ocho", "eight"], ["nueve", "nine"], ["diez", "ten"]],
  Colours: [["rojo", "red"], ["azul", "blue"], ["verde", "green"], ["amarillo", "yellow"], ["naranja", "orange"], ["rosa", "pink"], ["morado", "purple"], ["negro", "black"], ["blanco", "white"], ["marrón", "brown"]],
  Animals: [["el gato", "cat", "cat"], ["el perro", "dog", "dog"], ["el pez", "fish", "fish"], ["el pájaro", "bird", "leaf"], ["el caballo", "horse", "paw"], ["la vaca", "cow", "paw"], ["el conejo", "rabbit", "paw"], ["el oso", "bear", "bear"], ["el ratón", "mouse", "paw"], ["el león", "lion", "paw"]],
  Family: [["la mamá", "mum", "heart"], ["el papá", "dad", "heart"], ["el hermano", "brother", "smile"], ["la hermana", "sister", "smile"], ["la abuela", "grandma", "heart"], ["el abuelo", "grandad", "heart"], ["el bebé", "baby", "baby"], ["el amigo", "friend", "smile"]],
  Food: [["la manzana", "apple", "apple"], ["el plátano", "banana", "apple"], ["el pan", "bread", "bowl"], ["el queso", "cheese", "bowl"], ["la leche", "milk", "bottle"], ["el agua", "water", "bottle"], ["el pastel", "cake", "gift"], ["la fresa", "strawberry", "apple"]],
  "My body": [["la cabeza", "head", "smile"], ["los ojos", "eyes", "smile"], ["la nariz", "nose", "smile"], ["la boca", "mouth", "smile"], ["la mano", "hand", "heart"], ["el pie", "foot", "footprint"], ["las orejas", "ears", "smile"], ["el pelo", "hair", "smile"]],
  "At home": [["la casa", "house", "house"], ["la puerta", "door", "house"], ["la ventana", "window", "house"], ["la cama", "bed", "moon"], ["la mesa", "table", "house"], ["la silla", "chair", "house"], ["el libro", "book", "book"], ["la pelota", "ball", "ball"]],
  "Sky and weather": [["el sol", "sun", "sun"], ["la luna", "moon", "moon"], ["la estrella", "star", "star"], ["la nube", "cloud", "cloud"], ["la lluvia", "rain", "cloud"], ["la nieve", "snow", "cloud"]],
  "Days of the week": [["lunes", "Monday"], ["martes", "Tuesday"], ["miércoles", "Wednesday"], ["jueves", "Thursday"], ["viernes", "Friday"], ["sábado", "Saturday"], ["domingo", "Sunday"]],
  Clothes: [["el sombrero", "hat", "crown"], ["los zapatos", "shoes", "footprint"], ["el abrigo", "coat", "house"], ["el vestido", "dress", "heart"], ["el jersey", "jumper", "heart"], ["los calcetines", "socks", "socks"]],
  "Getting about": [["el coche", "car", "car"], ["el autobús", "bus", "truck"], ["el tren", "train", "truck"], ["el avión", "plane", "plane"], ["la bicicleta", "bike", "car"], ["el barco", "boat", "fish"]],
};

const COLOUR_HEX = { red: "#d93b3b", blue: "#2f72d6", green: "#3f9a4b", yellow: "#f5cf2a", orange: "#f28c28", pink: "#ec79a6", purple: "#8a4fc0", black: "#1b2433", white: "#ffffff", brown: "#8a5a33" };

function firstWords(words, { theme, language, seed }) {
  const t = THEMES[theme];
  const pages = [];
  const all = Object.values(words).flat();
  pages.push({
    section: "Start here",
    title: `Let’s learn ${language}!`,
    intro: "How to use this book with a grown-up",
    body: `<div class="soft" style="font-size:13pt;line-height:1.6">
      <p><b>1. Look and say.</b> Read each word out loud together. Listening to the words online (for example on a free dictionary site) helps with pronunciation.</p>
      <p><b>2. Trace and write.</b> Trace the dotted words, then write them yourself.</p>
      <p><b>3. Play and check.</b> Try the quizzes, then colour a star on the tracker for every topic you finish.</p>
      ${language === "French" ? "<p><b>Little words:</b> <i>le</i> and <i>la</i> both mean “the”. In French, every naming word is either <i>le</i> (masculine) or <i>la</i> (feminine). Before a vowel they become <i>l’</i>, and in the plural <i>les</i>.</p>" : "<p><b>Little words:</b> <i>el</i> and <i>la</i> both mean “the”. In Spanish, every naming word is either <i>el</i> (masculine) or <i>la</i> (feminine). In the plural they become <i>los</i> and <i>las</i>.</p>"}
    </div>
    <div class="label" style="margin-top:4mm">My topic tracker</div>
    <div class="grid3">${Object.keys(words).map((k) => `<div class="box" style="display:flex;align-items:center;justify-content:space-between">${k}${icon("star", 30, t.line, 8)}</div>`).join("")}</div>`,
  });
  for (const [topic, list] of Object.entries(words)) {
    const isColour = topic === "Colours" || topic === "Colours";
    pages.push({
      section: topic,
      title: topic,
      intro: "Look, listen and say each word out loud.",
      body: `<div class="grid2" style="flex:1;grid-auto-rows:1fr">${list
        .map(([w, en, ic]) => `<div class="box" style="display:flex;align-items:center;gap:5mm">${isColour ? `<span style="width:20mm;height:20mm;border-radius:50%;background:${COLOUR_HEX[en]};border:.5mm solid #c9d1dd;flex:none"></span>` : ic ? icon(ic, 64, t.line, 7) : `<span style="width:16mm;font:400 28pt Gloock, Figtree;color:${t.line}">${list.indexOf(list.find((x) => x[0] === w)) + 1}</span>`}<div><div style="font:400 23pt/1.1 Gloock, Figtree;color:#13233f">${w}</div><div class="muted" style="font-size:12pt;margin-top:1mm">${en}</div></div></div>`)
        .join("")}</div>`,
    });
    pages.push({
      section: topic,
      title: `Trace and write: ${topic.toLowerCase()}`,
      intro: "Trace each word, then write it on your own.",
      body: list.slice(0, 5).map(([w]) => hwRows(2, w)).join(""),
    });
  }
  // Quizzes.
  const r = rng(seed);
  for (let q = 0; q < 4; q++) {
    const set = shuffle(r, all).slice(0, 6);
    const right = shuffle(r, set);
    pages.push({
      section: "Quiz",
      title: `Quiz ${q + 1}: match them up`,
      intro: `Draw a line from each ${language} word to its English meaning.`,
      body: `<div style="flex:1;display:grid;grid-template-columns:1fr 1fr;align-items:center">${set.map(([w], i) => `<div style="font:400 20pt Gloock, Figtree;display:flex;align-items:center;justify-content:space-between;padding-right:12mm">${w}<span style="width:4mm;height:4mm;border-radius:50%;background:#13233f"></span></div><div style="font:600 15pt Figtree;display:flex;align-items:center;gap:4mm;padding-left:12mm"><span style="width:4mm;height:4mm;border-radius:50%;background:#13233f"></span>${right[i][1]}</div>`).join("")}</div>`,
    });
  }
  for (let q = 0; q < 2; q++) {
    const set = shuffle(r, all).slice(0, 8);
    pages.push({
      section: "Quiz",
      title: `Quiz ${q + 5}: say it in ${language}`,
      intro: "Write the word. Look back through the book if you need a clue!",
      body: `<div class="grid2" style="flex:1;grid-auto-rows:1fr">${set.map(([, en]) => `<div class="box"><div class="label">${en}</div><div class="write" style="height:14mm"></div></div>`).join("")}</div>`,
    });
  }
  pages.push({
    section: "Answers",
    title: "Word list",
    intro: `All ${all.length} words in this book.`,
    body: `<div style="columns:3;column-gap:6mm;font-size:9.5pt;line-height:1.45">${all.map(([w, en]) => `<div><b>${w}</b> – ${en}</div>`).join("")}</div>`,
  });
  return pages;
}

// ---------------------------------------------------------------------------
// Mandarin characters for children: [character, pinyin, meaning, icon?].

const CHARACTERS = [
  ["一", "yī", "one"], ["二", "èr", "two"], ["三", "sān", "three"], ["四", "sì", "four"], ["五", "wǔ", "five"],
  ["六", "liù", "six"], ["七", "qī", "seven"], ["八", "bā", "eight"], ["九", "jiǔ", "nine"], ["十", "shí", "ten"],
  ["人", "rén", "person", "smile"], ["大", "dà", "big", "star"], ["小", "xiǎo", "small", "star"], ["口", "kǒu", "mouth", "smile"], ["日", "rì", "sun, day", "sun"],
  ["月", "yuè", "moon, month", "moon"], ["山", "shān", "mountain", "tree"], ["水", "shuǐ", "water", "bottle"], ["火", "huǒ", "fire", "sun"], ["木", "mù", "tree, wood", "tree"],
  ["天", "tiān", "sky, day", "cloud"], ["上", "shàng", "up, on", "rocket"], ["下", "xià", "down, under", "leaf"], ["中", "zhōng", "middle", "star"], ["好", "hǎo", "good", "smile"],
  ["你", "nǐ", "you", "smile"], ["我", "wǒ", "I, me", "smile"], ["他", "tā", "he, him", "smile"], ["她", "tā", "she, her", "smile"], ["爱", "ài", "love", "heart"],
  ["猫", "māo", "cat", "cat"], ["狗", "gǒu", "dog", "dog"], ["鱼", "yú", "fish", "fish"], ["马", "mǎ", "horse", "paw"], ["鸟", "niǎo", "bird", "leaf"],
  ["花", "huā", "flower", "flower"], ["家", "jiā", "home, family", "house"], ["妈", "mā", "mum", "heart"], ["爸", "bà", "dad", "heart"], ["书", "shū", "book", "book"],
];

function mandarinKids() {
  const t = THEMES.berry;
  const pages = [];
  pages.push({
    section: "Start here",
    title: "Let’s learn Chinese!",
    intro: "Mandarin Chinese is written with characters. Each one is a word or part of a word.",
    body: `<div class="soft" style="font-size:13pt;line-height:1.6">
      <p><b>Pinyin</b> is how we spell Chinese sounds with letters. The little marks show the <b>tone</b>, the way your voice moves:</p>
      <div class="grid4" style="margin:4mm 0">${[["mā", "1st tone: high and flat"], ["má", "2nd tone: rising, like a question"], ["mǎ", "3rd tone: down then up"], ["mà", "4th tone: sharp and falling"]].map(([p, d]) => `<div class="box center"><div style="font:400 30pt Gloock, Figtree">${p}</div><div style="font-size:10pt">${d}</div></div>`).join("")}</div>
      <p><b>How to write:</b> trace the grey character in each box, then write it on your own. The dotted lines in each square help you place each stroke. Generally, write from top to bottom and from left to right.</p>
      <p><b>Listen:</b> hearing the words helps a lot. Try a free online dictionary that plays the sound.</p>
    </div>`,
  });
  for (const [ch, py, en, ic] of CHARACTERS)
    pages.push({
      section: "Characters",
      title: `<span class="cjk" style="font-size:44pt">${ch}</span> <span style="font-size:22pt;color:${t.line}">${py}</span>`,
      intro: `means <b>${en}</b>`,
      body: `<div style="display:flex;align-items:center;gap:8mm"><div class="cjk" style="width:62mm;height:62mm;border:.8mm solid ${t.line};border-radius:4mm;display:flex;align-items:center;justify-content:center;font-size:120pt;color:#13233f">${ch}</div>${ic ? icon(ic, 130, t.line, 6) : `<div style="font:400 90pt Gloock, Figtree;color:${t.line}">${CHARACTERS.indexOf(CHARACTERS.find((c) => c[0] === ch)) + 1}</div>`}</div><div class="label">Trace, then write</div>${tianGrid(ch, 8, 4)}${tianGrid(ch, 8, 2)}${tianGrid(ch, 8, 0)}${tianGrid(ch, 8, 0)}`,
    });
  const r = rng(77);
  for (let q = 0; q < 3; q++) {
    const set = shuffle(r, CHARACTERS).slice(0, 6);
    const right = shuffle(r, set);
    pages.push({
      section: "Quiz",
      title: `Quiz ${q + 1}: match them up`,
      intro: "Draw a line from each character to its meaning.",
      body: `<div style="flex:1;display:grid;grid-template-columns:1fr 1fr;align-items:center">${set.map(([c, p], i) => `<div style="display:flex;align-items:center;justify-content:space-between;padding-right:12mm"><span class="cjk" style="font-size:34pt">${c}</span><span style="color:#6b7587">${p}</span><span style="width:4mm;height:4mm;border-radius:50%;background:#13233f"></span></div><div style="font:600 15pt Figtree;display:flex;align-items:center;gap:4mm;padding-left:12mm"><span style="width:4mm;height:4mm;border-radius:50%;background:#13233f"></span>${right[i][2]}</div>`).join("")}</div>`,
    });
  }
  pages.push({
    section: "Phrases",
    title: "My first phrases",
    intro: "Put the characters together to make phrases you can use every day.",
    body: [["你好", "nǐ hǎo", "hello"], ["谢谢", "xièxie", "thank you"], ["再见", "zàijiàn", "goodbye"], ["我爱你", "wǒ ài nǐ", "I love you"], ["妈妈", "māma", "mummy"], ["爸爸", "bàba", "daddy"]].map(([c, p, e]) => `<div class="box" style="display:flex;align-items:center;gap:8mm"><span class="cjk" style="font-size:36pt;min-width:60mm">${c}</span><span style="font:400 20pt Gloock, Figtree;color:${t.line};min-width:45mm">${p}</span><span style="font-size:14pt">${e}</span></div>`).join(""),
  });
  pages.push({
    section: "Answers",
    title: "Character list",
    intro: "All 40 characters in this book.",
    body: `<div style="columns:2;column-gap:10mm;font-size:12pt;line-height:1.7">${CHARACTERS.map(([c, p, e]) => `<div><span class="cjk" style="font-size:16pt">${c}</span>  <b>${p}</b> – ${e}</div>`).join("")}</div>`,
  });
  return pages;
}

// ---------------------------------------------------------------------------
// Travel phrase books: sections of [phrase, say it like…, English].

const FRENCH_PHRASES = {
  "The basics": [
    ["Bonjour", "bohn-ZHOOR", "Hello / Good morning"], ["Bonsoir", "bohn-SWAHR", "Good evening"], ["Au revoir", "oh ruh-VWAHR", "Goodbye"], ["S’il vous plaît", "seel voo PLAY", "Please"], ["Merci (beaucoup)", "mair-SEE (boh-KOO)", "Thank you (very much)"], ["De rien", "duh ree-AN", "You’re welcome"], ["Excusez-moi", "ex-kew-zay MWAH", "Excuse me"], ["Pardon", "par-DOHN", "Sorry"], ["Oui / Non", "wee / nohn", "Yes / No"], ["Je ne comprends pas", "zhuh nuh kohm-PRAHN pah", "I don’t understand"], ["Parlez-vous anglais ?", "par-lay voo ahn-GLAY", "Do you speak English?"], ["Plus lentement, s’il vous plaît", "plew lahnt-MAHN, seel voo PLAY", "More slowly, please"],
  ],
  "Eating out": [
    ["Une table pour deux, s’il vous plaît", "ewn TAH-bluh poor DUH", "A table for two, please"], ["La carte, s’il vous plaît", "lah KART", "The menu, please"], ["Je voudrais…", "zhuh voo-DRAY", "I would like…"], ["Un café", "an kah-FAY", "A coffee"], ["Une bouteille d’eau", "ewn boo-TAY doh", "A bottle of water"], ["L’addition, s’il vous plaît", "lah-dee-SYOHN", "The bill, please"], ["C’est délicieux !", "say day-lee-SYUH", "It’s delicious!"], ["Je suis végétarien / végétarienne", "zhuh swee vay-zhay-tah-RYAN / -RYEN", "I’m vegetarian (m / f)"], ["Je suis allergique à…", "zhuh swee ah-lair-ZHEEK ah", "I’m allergic to…"],
  ],
  "Getting around": [
    ["Où est… ?", "oo AY", "Where is…?"], ["Où sont les toilettes ?", "oo sohn lay twah-LET", "Where are the toilets?"], ["La gare", "lah GAR", "The station"], ["L’aéroport", "lah-ay-roh-POR", "The airport"], ["Un billet pour…, s’il vous plaît", "an bee-YAY poor", "A ticket to…, please"], ["À quelle heure part le train ?", "ah kel UR par luh TRAN", "What time does the train leave?"], ["À gauche / À droite", "ah GOHSH / ah DRWAHT", "Left / Right"], ["Tout droit", "too DRWAH", "Straight on"], ["C’est loin ?", "say LWAN", "Is it far?"],
  ],
  Shopping: [
    ["Combien ça coûte ?", "kohm-BYAN sah KOOT", "How much is it?"], ["Je regarde seulement", "zhuh ruh-GARD surl-MAHN", "I’m just looking"], ["Je le prends", "zhuh luh PRAHN", "I’ll take it"], ["Vous acceptez les cartes ?", "voo zak-sep-TAY lay KART", "Do you take cards?"], ["C’est trop cher", "say troh SHAIR", "It’s too expensive"],
  ],
  "At the hotel": [
    ["J’ai une réservation", "zhay ewn ray-zair-vah-SYOHN", "I have a reservation"], ["Une chambre pour une nuit", "ewn SHAHM-bruh poor ewn NWEE", "A room for one night"], ["Le petit-déjeuner est à quelle heure ?", "luh puh-TEE day-zhuh-NAY ay tah kel UR", "What time is breakfast?"], ["La clé", "lah KLAY", "The key"], ["Le mot de passe du wifi ?", "luh moh duh PASS dew wee-FEE", "The wifi password?"],
  ],
  Emergencies: [
    ["Au secours !", "oh suh-KOOR", "Help!"], ["Appelez une ambulance !", "ah-puh-LAY ewn ahm-bew-LAHNS", "Call an ambulance!"], ["J’ai besoin d’un médecin", "zhay buh-ZWAN dan mayd-SAN", "I need a doctor"], ["J’ai perdu mon passeport", "zhay pair-DEW mohn pass-POR", "I’ve lost my passport"], ["La pharmacie", "lah far-mah-SEE", "The pharmacy"],
  ],
  "Days and times": [
    ["Aujourd’hui", "oh-zhoor-DWEE", "Today"], ["Demain", "duh-MAN", "Tomorrow"], ["Hier", "ee-AIR", "Yesterday"], ["Quelle heure est-il ?", "kel UR ay-TEEL", "What time is it?"], ["Le matin / L’après-midi / Le soir", "luh mah-TAN / lah-preh-mee-DEE / luh SWAHR", "Morning / Afternoon / Evening"], ["Lundi, mardi, mercredi", "lan-DEE, mar-DEE, mair-kruh-DEE", "Monday, Tuesday, Wednesday"], ["Jeudi, vendredi", "zhuh-DEE, vahn-druh-DEE", "Thursday, Friday"], ["Samedi, dimanche", "sam-DEE, dee-MAHNSH", "Saturday, Sunday"],
  ],
  "Signs you’ll see": [
    ["Entrée / Sortie", "ahn-TRAY / sor-TEE", "Entrance / Exit"], ["Ouvert / Fermé", "oo-VAIR / fair-MAY", "Open / Closed"], ["Poussez / Tirez", "poo-SAY / tee-RAY", "Push / Pull"], ["Toilettes", "twah-LET", "Toilets"], ["Interdit", "an-tair-DEE", "Not allowed"], ["Arrivées / Départs", "ah-ree-VAY / day-PAR", "Arrivals / Departures"], ["Soldes", "SOLD", "Sale"], ["Défense de fumer", "day-FAHNS duh few-MAY", "No smoking"],
  ],
  "Making friends": [
    ["Je m’appelle…", "zhuh mah-PEL", "My name is…"], ["Comment vous appelez-vous ?", "koh-MAHN voo zah-play VOO", "What’s your name?"], ["Je viens du Royaume-Uni", "zhuh vyan dew rwah-yohm ew-NEE", "I’m from the UK"], ["Enchanté(e)", "ahn-shahn-TAY", "Nice to meet you"], ["Comment ça va ?", "koh-mahn sah VAH", "How are you?"], ["Ça va bien, merci", "sah vah BYAN, mair-SEE", "I’m fine, thanks"], ["Bonne journée !", "bun zhoor-NAY", "Have a nice day!"],
  ],
};
const FRENCH_NUMBERS = [["un", "an", 1], ["deux", "duh", 2], ["trois", "trwah", 3], ["quatre", "KAT-ruh", 4], ["cinq", "sank", 5], ["six", "sees", 6], ["sept", "set", 7], ["huit", "weet", 8], ["neuf", "nurf", 9], ["dix", "dees", 10], ["vingt", "van", 20], ["cinquante", "san-KAHNT", 50], ["cent", "sahn", 100]];

const SPANISH_PHRASES = {
  "The basics": [
    ["Hola", "OH-lah", "Hello"], ["Buenos días", "BWEH-nos DEE-as", "Good morning"], ["Buenas tardes", "BWEH-nas TAR-des", "Good afternoon"], ["Buenas noches", "BWEH-nas NOH-ches", "Good evening / night"], ["Adiós", "ah-DYOS", "Goodbye"], ["Por favor", "por fah-VOR", "Please"], ["(Muchas) gracias", "(MOO-chas) GRAH-thyas", "Thank you (very much)"], ["De nada", "deh NAH-dah", "You’re welcome"], ["Disculpe", "dees-KOOL-peh", "Excuse me"], ["Lo siento", "loh SYEN-toh", "I’m sorry"], ["No entiendo", "noh en-TYEN-doh", "I don’t understand"], ["¿Habla inglés?", "AH-blah een-GLES", "Do you speak English?"],
  ],
  "Eating out": [
    ["Una mesa para dos, por favor", "OO-nah MEH-sah PAH-rah dos", "A table for two, please"], ["La carta, por favor", "lah KAR-tah", "The menu, please"], ["Quisiera…", "kee-SYEH-rah", "I would like…"], ["Un café", "oon kah-FEH", "A coffee"], ["Una botella de agua", "OO-nah boh-TEH-yah deh AH-gwah", "A bottle of water"], ["La cuenta, por favor", "lah KWEN-tah", "The bill, please"], ["¡Está delicioso!", "es-TAH deh-lee-THYOH-soh", "It’s delicious!"], ["Soy vegetariano / vegetariana", "soy beh-heh-tah-RYAH-noh / -nah", "I’m vegetarian (m / f)"], ["Soy alérgico / alérgica a…", "soy ah-LER-hee-koh / -kah ah", "I’m allergic to… (m / f)"],
  ],
  "Getting around": [
    ["¿Dónde está…?", "DON-deh es-TAH", "Where is…?"], ["¿Dónde están los servicios?", "DON-deh es-TAN los ser-BEE-thyos", "Where are the toilets?"], ["La estación", "lah es-tah-THYON", "The station"], ["El aeropuerto", "el ah-eh-roh-PWER-toh", "The airport"], ["Un billete para…, por favor", "oon bee-YEH-teh PAH-rah", "A ticket to…, please"], ["¿A qué hora sale el tren?", "ah keh OH-rah SAH-leh el tren", "What time does the train leave?"], ["A la izquierda / A la derecha", "ah lah eeth-KYER-dah / deh-REH-chah", "Left / Right"], ["Todo recto", "TOH-doh REK-toh", "Straight on"], ["¿Está lejos?", "es-TAH LEH-hos", "Is it far?"],
  ],
  Shopping: [
    ["¿Cuánto cuesta?", "KWAN-toh KWES-tah", "How much is it?"], ["Solo estoy mirando", "SOH-loh es-TOY mee-RAN-doh", "I’m just looking"], ["Me lo llevo", "meh loh YEH-boh", "I’ll take it"], ["¿Aceptan tarjeta?", "ah-THEP-tan tar-HEH-tah", "Do you take cards?"], ["Es demasiado caro", "es deh-mah-SYAH-doh KAH-roh", "It’s too expensive"],
  ],
  "At the hotel": [
    ["Tengo una reserva", "TEN-goh OO-nah reh-SER-bah", "I have a reservation"], ["Una habitación para una noche", "OO-nah ah-bee-tah-THYON PAH-rah OO-nah NOH-cheh", "A room for one night"], ["¿A qué hora es el desayuno?", "ah keh OH-rah es el deh-sah-YOO-noh", "What time is breakfast?"], ["La llave", "lah YAH-beh", "The key"], ["¿Cuál es la contraseña del wifi?", "kwal es lah kon-trah-SEH-nyah del WEE-fee", "What’s the wifi password?"],
  ],
  Emergencies: [
    ["¡Socorro! / ¡Ayuda!", "soh-KOR-roh / ah-YOO-dah", "Help!"], ["¡Llame a una ambulancia!", "YAH-meh ah OO-nah am-boo-LAN-thyah", "Call an ambulance!"], ["Necesito un médico", "neh-theh-SEE-toh oon MEH-dee-koh", "I need a doctor"], ["He perdido mi pasaporte", "eh per-DEE-doh mee pah-sah-POR-teh", "I’ve lost my passport"], ["La farmacia", "lah far-MAH-thyah", "The pharmacy"],
  ],
  "Days and times": [
    ["Hoy", "oy", "Today"], ["Mañana", "mah-NYAH-nah", "Tomorrow"], ["Ayer", "ah-YER", "Yesterday"], ["¿Qué hora es?", "keh OH-rah es", "What time is it?"], ["Por la mañana / tarde / noche", "por lah mah-NYAH-nah / TAR-deh / NOH-cheh", "In the morning / afternoon / at night"], ["Lunes, martes, miércoles", "LOO-nes, MAR-tes, MYER-koh-les", "Monday, Tuesday, Wednesday"], ["Jueves, viernes", "HWEH-bes, BYER-nes", "Thursday, Friday"], ["Sábado, domingo", "SAH-bah-doh, doh-MEEN-goh", "Saturday, Sunday"],
  ],
  "Signs you’ll see": [
    ["Entrada / Salida", "en-TRAH-dah / sah-LEE-dah", "Entrance / Exit"], ["Abierto / Cerrado", "ah-BYER-toh / theh-RRAH-doh", "Open / Closed"], ["Empujar / Tirar", "em-poo-HAR / tee-RAR", "Push / Pull"], ["Aseos / Servicios", "ah-SEH-os / ser-BEE-thyos", "Toilets"], ["Prohibido", "proh-ee-BEE-doh", "Not allowed"], ["Llegadas / Salidas", "yeh-GAH-das / sah-LEE-das", "Arrivals / Departures"], ["Rebajas", "reh-BAH-has", "Sale"], ["Prohibido fumar", "proh-ee-BEE-doh foo-MAR", "No smoking"],
  ],
  "Making friends": [
    ["Me llamo…", "meh YAH-moh", "My name is…"], ["¿Cómo se llama?", "KOH-moh seh YAH-mah", "What’s your name?"], ["Soy del Reino Unido", "soy del RAY-noh oo-NEE-doh", "I’m from the UK"], ["Encantado / Encantada", "en-kan-TAH-doh / -dah", "Nice to meet you (m / f)"], ["¿Qué tal?", "keh TAL", "How are you?"], ["Muy bien, gracias", "mwee BYEN, GRAH-thyas", "Very well, thanks"], ["¡Que tenga un buen día!", "keh TEN-gah oon bwen DEE-ah", "Have a nice day!"],
  ],
};
const SPANISH_NUMBERS = [["uno", "OO-noh", 1], ["dos", "dos", 2], ["tres", "tres", 3], ["cuatro", "KWAH-troh", 4], ["cinco", "THEEN-koh", 5], ["seis", "says", 6], ["siete", "SYEH-teh", 7], ["ocho", "OH-choh", 8], ["nueve", "NWEH-beh", 9], ["diez", "dyeth", 10], ["veinte", "BAYN-teh", 20], ["cincuenta", "theen-KWEN-tah", 50], ["cien", "thyen", 100]];

const MANDARIN_PHRASES = {
  "The basics": [
    ["你好", "nǐ hǎo", "Hello"], ["您好", "nín hǎo", "Hello (polite)"], ["谢谢", "xièxie", "Thank you"], ["不客气", "bú kèqi", "You’re welcome"], ["对不起", "duìbuqǐ", "Sorry"], ["没关系", "méi guānxi", "That’s OK / No problem"], ["再见", "zàijiàn", "Goodbye"], ["请", "qǐng", "Please"], ["是 / 不是", "shì / bú shì", "Yes, it is / No, it isn’t"], ["我不明白", "wǒ bù míngbai", "I don’t understand"], ["你会说英语吗？", "nǐ huì shuō Yīngyǔ ma?", "Do you speak English?"], ["请再说一遍", "qǐng zài shuō yí biàn", "Please say that again"],
  ],
  "Eating out": [
    ["菜单", "càidān", "Menu"], ["我要这个", "wǒ yào zhège", "I’d like this one"], ["水", "shuǐ", "Water"], ["茶", "chá", "Tea"], ["咖啡", "kāfēi", "Coffee"], ["米饭", "mǐfàn", "Rice"], ["面条", "miàntiáo", "Noodles"], ["好吃！", "hǎochī!", "Delicious!"], ["我吃素", "wǒ chī sù", "I’m vegetarian"], ["不要辣", "bú yào là", "Not spicy, please"], ["买单", "mǎidān", "The bill, please"],
  ],
  "Getting around": [
    ["……在哪里？", "… zài nǎlǐ?", "Where is…?"], ["洗手间在哪里？", "xǐshǒujiān zài nǎlǐ?", "Where is the toilet?"], ["地铁站", "dìtiě zhàn", "Metro station"], ["火车站", "huǒchē zhàn", "Train station"], ["机场", "jīchǎng", "Airport"], ["出租车", "chūzūchē", "Taxi"], ["左 / 右", "zuǒ / yòu", "Left / Right"], ["一直走", "yìzhí zǒu", "Go straight on"], ["远吗？", "yuǎn ma?", "Is it far?"],
  ],
  Shopping: [
    ["多少钱？", "duōshao qián?", "How much is it?"], ["太贵了", "tài guì le", "It’s too expensive"], ["便宜一点吧", "piányi yìdiǎn ba", "A bit cheaper, please"], ["我买这个", "wǒ mǎi zhège", "I’ll buy this"], ["可以刷卡吗？", "kěyǐ shuā kǎ ma?", "Can I pay by card?"],
  ],
  Emergencies: [
    ["救命！", "jiùmìng!", "Help!"], ["我需要医生", "wǒ xūyào yīshēng", "I need a doctor"], ["医院", "yīyuàn", "Hospital"], ["药店", "yàodiàn", "Pharmacy"], ["我的护照丢了", "wǒ de hùzhào diū le", "I’ve lost my passport"],
  ],
  "Days and times": [
    ["今天", "jīntiān", "Today"], ["明天", "míngtiān", "Tomorrow"], ["昨天", "zuótiān", "Yesterday"], ["现在几点？", "xiànzài jǐ diǎn?", "What time is it?"], ["上午 / 下午 / 晚上", "shàngwǔ / xiàwǔ / wǎnshang", "Morning / Afternoon / Evening"], ["星期一", "xīngqī yī", "Monday"], ["星期五", "xīngqī wǔ", "Friday"], ["星期天", "xīngqī tiān", "Sunday"],
  ],
  "Signs you’ll see": [
    ["入口 / 出口", "rùkǒu / chūkǒu", "Entrance / Exit"], ["营业中", "yíngyè zhōng", "Open"], ["推 / 拉", "tuī / lā", "Push / Pull"], ["厕所", "cèsuǒ", "Toilets"], ["男 / 女", "nán / nǚ", "Men / Women"], ["禁止吸烟", "jìnzhǐ xīyān", "No smoking"], ["地铁", "dìtiě", "Metro / Underground"], ["出发 / 到达", "chūfā / dàodá", "Departures / Arrivals"],
  ],
  "Making friends": [
    ["我叫……", "wǒ jiào …", "My name is…"], ["你叫什么名字？", "nǐ jiào shénme míngzi?", "What’s your name?"], ["我是英国人", "wǒ shì Yīngguó rén", "I’m British"], ["很高兴认识你", "hěn gāoxìng rènshi nǐ", "Nice to meet you"], ["你好吗？", "nǐ hǎo ma?", "How are you?"], ["我很好", "wǒ hěn hǎo", "I’m very well"], ["干杯！", "gānbēi!", "Cheers!"],
  ],
};
const MANDARIN_NUMBERS = [["一", "yī", 1], ["二", "èr", 2], ["三", "sān", 3], ["四", "sì", 4], ["五", "wǔ", 5], ["六", "liù", 6], ["七", "qī", 7], ["八", "bā", 8], ["九", "jiǔ", 9], ["十", "shí", 10], ["二十", "èrshí", 20], ["五十", "wǔshí", 50], ["一百", "yìbǎi", 100]];

function phraseBook({ phrases, numbers, language, theme, cjk, guideNote, emergencyNote }) {
  const t = THEMES[theme];
  const pages = [];
  pages.push({
    section: "Start here",
    title: `Your ${language} pocket guide`,
    intro: "Print it, fold it into your bag, and speak with confidence.",
    body: `<div class="soft" style="font-size:12.5pt;line-height:1.6"><p>${guideNote}</p><p style="margin-top:3mm">Capital letters in the pronunciation show where to put the stress. Locals always appreciate a “please” and a “thank you”: start every conversation with a greeting and you’ll get a warm welcome.</p></div>
      <div class="label" style="margin-top:4mm">Contents</div>${Object.keys(phrases).map((k, i) => `<div style="display:flex;justify-content:space-between;border-bottom:.3mm solid #dde3ec;padding:2mm 0;font-size:13pt"><span>${k}</span><span class="muted">page ${i + 3}</span></div>`).join("")}<div style="display:flex;justify-content:space-between;border-bottom:.3mm solid #dde3ec;padding:2mm 0;font-size:13pt"><span>Numbers</span><span class="muted">page ${Object.keys(phrases).length + 3}</span></div>`,
  });
  for (const [section, list] of Object.entries(phrases))
    pages.push({
      section,
      title: section,
      intro: section === "Emergencies" ? emergencyNote : "",
      body: `<table class="t"><tr><th style="width:42%">${language}</th><th style="width:30%">Say it like</th><th>English</th></tr>${list.map(([p, s, e]) => `<tr><td class="${cjk ? "cjk" : ""}" style="font-size:${cjk ? 17 : 14}pt;font-weight:600;color:#13233f;padding-top:3.4mm;padding-bottom:3.4mm">${p}</td><td style="color:${t.line};font-size:12.5pt">${s}</td><td style="font-size:12.5pt">${e}</td></tr>`).join("")}</table>`,
    });
  pages.push({
    section: "Numbers",
    title: "Numbers",
    intro: "Handy for prices, rooms, platforms and times.",
    body: `<div class="grid3" style="flex:1;grid-auto-rows:1fr">${numbers.map(([w, s, n]) => `<div class="box" style="display:flex;flex-direction:column;justify-content:center"><div style="font:400 26pt Gloock, Figtree;color:${t.line}">${n}</div><div class="${cjk ? "cjk" : ""}" style="font-size:15pt;font-weight:600">${w}</div><div class="muted">${s}</div></div>`).join("")}</div>`,
  });
  pages.push({
    section: "My notes",
    title: "My travel notes",
    intro: "Hotel address, useful words you hear, places to visit.",
    body: `<div class="box" style="flex:1;background:repeating-linear-gradient(#fff 0 11mm,#dde3ec 11mm 11.3mm)"></div>`,
  });
  return pages;
}

export const products = [
  {
    slug: "french-first-100-words",
    title: "My First 100 French Words",
    kicker: "Bonjour, little learner!",
    subtitle: "Say, trace and play with 101 everyday French words.",
    series: "Little linguists",
    ages: "Ages 4–9",
    theme: "sky",
    motif: "dots",
    seed: 61,
    heroIcons: ["speech", "heart", "star"],
    glyphs: "Bonjour",
    lang: "en-GB",
    price: 299,
    tagline: "Bonjour! 101 French words to say, trace and play with.",
    description:
      "Twelve topics, from colours and animals to family and food, each with picture cards, tracing practice and quizzes. Gentle, playful French for beginners, with a full word list.",
    pages: () => [...firstWords(FRENCH_WORDS, { theme: "sky", language: "French", seed: 61 }), certPage("sky", "Super French Speaker", "star")],
  },
  {
    slug: "spanish-first-100-words",
    title: "My First 100 Spanish Words",
    kicker: "¡Hola, amigo!",
    subtitle: "Say, trace and play with 101 everyday Spanish words.",
    series: "Little linguists",
    ages: "Ages 4–9",
    theme: "ember",
    motif: "confetti",
    seed: 62,
    heroIcons: ["sun", "speech", "heart"],
    glyphs: "¡Hola!",
    price: 299,
    tagline: "¡Hola! 101 Spanish words to say, trace and play with.",
    description:
      "Twelve sunny topics, from numbers and animals to food and clothes, with picture cards, tracing and quizzes. A friendly first step into Spanish, with a full word list.",
    pages: () => [...firstWords(SPANISH_WORDS, { theme: "ember", language: "Spanish", seed: 62 }), certPage("ember", "Super Spanish Speaker", "sun")],
  },
  {
    slug: "mandarin-first-40-characters",
    title: "My First 40 Chinese Characters",
    kicker: "你好! Nǐ hǎo!",
    subtitle: "Learn, trace and write 40 Mandarin characters with pinyin and tones.",
    series: "Little linguists",
    ages: "Ages 5–11",
    theme: "berry",
    motif: "dots",
    seed: 63,
    heroIcons: ["book", "heart", "star"],
    glyphs: "你好",
    cjk: true,
    price: 299,
    tagline: "你好! Trace your way into Mandarin, one character at a time.",
    description:
      "40 first characters (numbers, family, nature, animals) each with pinyin, meaning and practice grids, plus tones, first phrases and quizzes. A beautiful start in Mandarin Chinese.",
    pages: () => [...mandarinKids(), certPage("berry", "Chinese Character Champion", "star")],
  },
  {
    slug: "french-travel-phrase-book",
    title: "French Phrases for Travellers",
    kicker: "Pocket guide",
    subtitle: "Eat, shop, explore and make friends in France with confidence.",
    series: "Travel talk",
    ages: "Adults",
    theme: "night",
    motif: "waves",
    seed: 64,
    heroIcons: ["plane", "map", "speech"],
    glyphs: "Merci",
    price: 199,
    tagline: "Order, explore and chat in France like you’ve been going for years.",
    description:
      "Over 50 essential French phrases with easy say-it-like guides: basics, eating out, getting around, shopping, hotels, emergencies and small talk, plus numbers and a notes page.",
    pages: () =>
      phraseBook({
        phrases: FRENCH_PHRASES,
        numbers: FRENCH_NUMBERS,
        language: "French",
        theme: "night",
        guideNote: "French is all about smooth, flowing sounds. Final letters are often silent (the s in <i>Paris</i>, the t in <i>petit</i>), and “r” is soft, from the back of the throat.",
        emergencyNote: "Emergency number anywhere in the EU: 112.",
      }),
  },
  {
    slug: "spanish-travel-phrase-book",
    title: "Spanish Phrases for Travellers",
    kicker: "Pocket guide",
    subtitle: "Tapas, trains and new friends: speak Spanish with confidence.",
    series: "Travel talk",
    ages: "Adults",
    theme: "berry",
    motif: "waves",
    seed: 65,
    heroIcons: ["plane", "sun", "speech"],
    glyphs: "Gracias",
    price: 199,
    tagline: "From tapas to train tickets: Spanish made easy for your trip.",
    description:
      "Over 50 essential Spanish phrases with easy say-it-like guides for Spain: basics, eating out, getting around, shopping, hotels, emergencies and small talk, plus numbers.",
    pages: () =>
      phraseBook({
        phrases: SPANISH_PHRASES,
        numbers: SPANISH_NUMBERS,
        language: "Spanish",
        theme: "berry",
        guideNote: "Spanish is spelled the way it sounds. The guides here follow Spain: “c” before e or i, and “z”, sound like “th”. In Latin America they sound like “s” (GRAH-syas instead of GRAH-thyas), and both are understood everywhere.",
        emergencyNote: "Emergency number in Spain (and anywhere in the EU): 112.",
      }),
  },
  {
    slug: "mandarin-travel-phrase-book",
    title: "Mandarin Phrases for Travellers",
    kicker: "Pocket guide",
    subtitle: "Characters, pinyin and English for everyday travel in China.",
    series: "Travel talk",
    ages: "Adults",
    theme: "teal",
    motif: "dots",
    seed: 66,
    heroIcons: ["plane", "bowl", "speech"],
    glyphs: "谢谢",
    cjk: true,
    price: 199,
    tagline: "Point, say it, smile: Mandarin for travellers, made simple.",
    description:
      "Over 45 Mandarin phrases in Chinese characters with pinyin and English: greetings, food, directions, shopping, emergencies and small talk. Show the characters if you get stuck!",
    pages: () =>
      phraseBook({
        phrases: MANDARIN_PHRASES,
        numbers: MANDARIN_NUMBERS,
        language: "Mandarin",
        theme: "teal",
        cjk: true,
        guideNote: "Mandarin has four tones, shown by the marks over the pinyin: ā high and flat, á rising, ǎ dipping then rising, à falling. Tones change meaning, so take your time. If you’re stuck, show the characters to the person you’re talking to.",
        emergencyNote: "In mainland China: police 110, ambulance 120, fire 119.",
      }),
  },
];
