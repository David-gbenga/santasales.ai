// The two hand-made sample books supplied on 2026-11-11. build.mjs gives
// each a designed cover, fixes "giftpost.com" to "giftpost.co.uk", and
// appends the original pages after the cover.

export const products = [
  {
    slug: "maths-counting-big-book",
    sourcePdf: "sources/Giftpost_Maths_Counting_35_Page_Editable.pdf",
    sourcePages: 35,
    title: "My Big Maths & Counting Book",
    kicker: "Let’s count and write!",
    subtitle: "Counting, number tracing, adding, taking away and maths stories.",
    series: "Little learners",
    ages: "Ages 4–7",
    theme: "sky",
    motif: "confetti",
    seed: 91,
    heroIcons: ["star", "apple", "rocket"],
    glyphs: "123",
    price: 299,
    tagline: "From 1, 2, 3 to ‘I can do it!’: number confidence on every page.",
    description:
      "Count and match, trace numbers to 20, add, take away, find missing numbers and solve picture maths stories, finishing with a super challenge. Perfect for Reception and Year 1.",
    pages: () => [],
  },
  {
    slug: "alphabet-handwriting-workbook",
    sourcePdf: "sources/Giftpost_Alphabet_Handwriting_50_Pages_Print_Ready.pdf",
    sourcePages: 50,
    title: "My Big Alphabet & Handwriting Workbook",
    kicker: "Trace • read • say • write",
    subtitle: "A page for every letter, sound practice, challenges and a certificate.",
    series: "Little learners",
    ages: "Ages 3–7",
    theme: "berry",
    motif: "letters",
    seed: 92,
    heroIcons: ["pencil", "book", "crown"],
    glyphs: "Aa",
    price: 299,
    tagline: "A is for amazing: a joyful journey from A to Z.",
    description:
      "Every letter from A to Z with look-and-say pictures, big tracing letters, practice rows and sounds, plus alphabet challenges and a certificate of success.",
    pages: () => [],
  },
];
