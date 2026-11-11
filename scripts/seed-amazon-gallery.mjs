// Adds the affiliate gift ideas (scripts/gallery-art) to the gallery.
//
//   node scripts/gallery-art/render.mjs                                      # draw the tiles
//   AMAZON_TAG=giftpost-21 node scripts/seed-amazon-gallery.mjs amazon       # add, hidden
//   EBAY_CAMPAIGN_ID=5338… node scripts/seed-amazon-gallery.mjs ebay         # add, hidden
//   … add --publish to show that store's items and hide the example.com placeholders
//
// Safe to re-run: rows are matched by image URL and updated in place, so
// click history stays attached. Items you add in /admin are left alone.

import { readFileSync } from "node:fs";
import { ebayGifts, ebaySearchUrl } from "./gallery-art/ebay-gifts.mjs";
import { amazonSearchUrl, gifts as amazonGifts } from "./gallery-art/gifts.mjs";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file not present: fine
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const store = process.argv[2];
const publish = process.argv.includes("--publish");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

/** Per store: its gift list, link builder, and the tracking value it needs. */
function storeConfig() {
  if (store === "amazon") {
    const tag = process.env.AMAZON_TAG?.trim() ?? "";
    if (!/^[a-z0-9][a-z0-9-]{1,60}-2[0-9]$/i.test(tag)) {
      throw new Error("Set AMAZON_TAG to your Associates tracking ID, e.g. AMAZON_TAG=giftpost-21");
    }
    // Amazon items sort on the tens: 10, 20, 30…
    return { gifts: amazonGifts, url: (q) => amazonSearchUrl(q, tag), sort: (i) => (i + 1) * 10 };
  }
  if (store === "ebay") {
    const campaign = process.env.EBAY_CAMPAIGN_ID?.trim() ?? "";
    if (!/^\d{10}$/.test(campaign)) {
      throw new Error("Set EBAY_CAMPAIGN_ID to your 10-digit eBay Partner Network campaign ID");
    }
    // eBay items interleave with Amazon's: 5, 15, 25…
    return { gifts: ebayGifts, url: (q) => ebaySearchUrl(q, campaign), sort: (i) => i * 10 + 5 };
  }
  throw new Error("Usage: node scripts/seed-amazon-gallery.mjs amazon|ebay [--publish]");
}

async function supabase(path, init) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, ...init.headers },
  });
  if (!res.ok) throw new Error(`${init.method} ${path} → HTTP ${res.status}: ${await res.text()}`);
  return res;
}

let config;
try {
  config = storeConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const publicUrl = (path) => `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;
const existing = await (
  await supabase(
    `/rest/v1/gallery_items?select=id,image_url&image_url=like.*%2Fmedia%2Fgallery%2F${store}-*`,
    { method: "GET" },
  )
).json();
const idByImage = new Map(existing.map((row) => [row.image_url, row.id]));

let added = 0;
let updated = 0;
for (const [index, gift] of config.gifts.entries()) {
  const path = `gallery/${store}-${gift.slug}.png`;
  const png = readFileSync(new URL(`./gallery-art/out/${store}-${gift.slug}.png`, import.meta.url));
  await supabase(`/storage/v1/object/media/${path}`, {
    method: "POST",
    headers: { "Content-Type": "image/png", "x-upsert": "true", "cache-control": "max-age=3600" },
    body: png,
  });

  const row = {
    title: gift.title,
    image_url: publicUrl(path),
    target_url: config.url(gift.query),
    is_affiliate: true,
    sort: config.sort(index),
    active: publish,
  };
  const id = idByImage.get(row.image_url);
  const res = id
    ? supabase(`/rest/v1/gallery_items?id=eq.${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) })
    : supabase("/rest/v1/gallery_items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) });
  await res;
  if (id) updated++;
  else added++;
}
console.log(`${store}: ${added} added, ${updated} updated, ${publish ? "LIVE" : "hidden (review in /admin/gallery)"}`);

if (publish) {
  // The original placeholders link to example.com: hide them (kept, so click history survives).
  await supabase("/rest/v1/gallery_items?target_url=like.https%3A%2F%2Fexample.com%2F*", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active: false }),
  });
  console.log("placeholder items (example.com links) hidden");
}
