// Uploads the launch card backgrounds to the public "media" bucket and
// upserts their card_designs rows (by slug, so re-running is safe and ids
// stay stable).
//
//   node scripts/card-art/render-card-art.mjs   # once, to produce the PNGs
//   pnpm seed:cards
//
// To add your own design later without code, see PRD §6a.

import { readFileSync } from "node:fs";
import { designs } from "./card-art/designs.mjs";

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

async function supabase(path, init) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, ...init.headers },
  });
  if (!res.ok) throw new Error(`${init.method} ${path} → HTTP ${res.status}: ${await res.text()}`);
  return res;
}

const rows = [];
for (const [index, design] of designs.entries()) {
  const backgroundPath = `card-designs/${design.slug}.png`;
  const png = readFileSync(new URL(`./card-art/out/${design.slug}.png`, import.meta.url));
  await supabase(`/storage/v1/object/media/${backgroundPath}`, {
    method: "POST",
    headers: { "Content-Type": "image/png", "x-upsert": "true", "cache-control": "max-age=3600" },
    body: png,
  });
  console.log(`uploaded  media/${backgroundPath} (${Math.round(png.length / 1024)} KB)`);
  rows.push({
    slug: design.slug,
    name: design.name,
    background_path: backgroundPath,
    layout: design.layout,
    sort: (index + 1) * 10,
    active: true,
  });
}

const saved = await (
  await supabase("/rest/v1/card_designs?on_conflict=slug", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  })
).json();
for (const d of saved) console.log(`saved     ${d.slug.padEnd(16)} id=${d.id}`);
