// Seeds placeholder gallery items so the gallery and click tracking can be
// built and tested before real store links exist. Safe to re-run: existing
// placeholder rows (matched by image_url) are updated in place, so their ids
// stay stable for logged clicks; your real items are left alone.
//
//   pnpm seed:gallery
//
// Links point at example.com. Replace them (or set active = false) before launch.

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file not present: fine
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env");
  process.exit(1);
}

// Mix of affiliate and ordinary links so both rel values get exercised.
const items = [
  { title: "Festive mug", image: "mug", path: "festive-mug", is_affiliate: true },
  { title: "Knitted socks", image: "socks", path: "knitted-socks", is_affiliate: true },
  { title: "Pine candle", image: "candle", path: "pine-candle", is_affiliate: false },
  { title: "Christmas jumper", image: "jumper", path: "christmas-jumper", is_affiliate: true },
  { title: "Winter story book", image: "book", path: "winter-story-book", is_affiliate: false },
  { title: "Fairy lights", image: "lights", path: "fairy-lights", is_affiliate: true },
];

async function supabase(path, init) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`${init.method} ${path} → HTTP ${res.status}: ${await res.text()}`);
  return res;
}

const existing = await (
  await supabase(
    "/rest/v1/gallery_items?select=id,image_url&image_url=like./gallery/placeholder-*",
    {
      method: "GET",
    },
  )
).json();
const idByImage = new Map(existing.map((row) => [row.image_url, row.id]));

const rows = items.map((item, index) => ({
  title: item.title,
  image_url: `/gallery/placeholder-${item.image}.svg`,
  target_url: `https://example.com/placeholder/${item.path}`,
  is_affiliate: item.is_affiliate,
  sort: (index + 1) * 10,
  active: true,
}));

for (const row of rows) {
  const id = idByImage.get(row.image_url);
  const res = id
    ? await supabase(`/rest/v1/gallery_items?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(row),
      })
    : await supabase("/rest/v1/gallery_items", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(row),
      });
  const [saved] = await res.json();
  console.log(
    `${id ? "updated" : "created"}   ${saved.title.padEnd(18)} ${saved.is_affiliate ? "affiliate" : "ordinary "}  id=${saved.id}`,
  );
}
