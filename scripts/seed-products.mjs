// Uploads the printable products built by scripts/products/build.mjs:
//   PDF   → private "products" bucket at giftpost/<slug>.pdf
//   cover → public "media" bucket at products/<slug>.png
// and upserts each products row by slug (safe to re-run; ids stay stable).
//
//   node scripts/products/build.mjs     # build PDFs and covers first
//   node scripts/seed-products.mjs [--hidden]

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { PDFDocument } = require("pdf-lib");

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
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
const active = !process.argv.includes("--hidden");
const here = dirname(fileURLToPath(import.meta.url));
const productsDir = join(here, "products");

async function supabase(path, init) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, ...init.headers },
  });
  if (!res.ok) throw new Error(`${init.method} ${path} → HTTP ${res.status}: ${await res.text()}`);
  return res;
}

async function upload(bucket, path, body, type) {
  await supabase(`/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: { "Content-Type": type, "x-upsert": "true", "cache-control": "max-age=3600" },
    body,
  });
}

const catalogue = [];
for (const file of readdirSync(join(productsDir, "catalogue")).filter((f) => f.endsWith(".mjs")).sort())
  catalogue.push(...(await import(pathToFileURL(join(productsDir, "catalogue", file)).href)).products);

const rows = [];
for (const p of catalogue) {
  const pdf = readFileSync(join(productsDir, "out", `${p.slug}.pdf`));
  const png = readFileSync(join(productsDir, "out", `${p.slug}-cover.png`));
  const pages = (await PDFDocument.load(pdf)).getPageCount();
  const filePath = `giftpost/${p.slug}.pdf`;
  const imagePath = `products/${p.slug}.png`;
  await upload("products", filePath, pdf, "application/pdf");
  await upload("media", imagePath, png, "image/png");
  rows.push({
    slug: p.slug,
    name: p.title.replace(/‑/g, "-"),
    // The catchy line first: the shop card shows the first two lines.
    description: `${p.tagline}\n\n${p.description}\n\n${pages} printable A4 pages · ${p.ages} · Instant PDF download. Print at home as often as you like.`,
    price_pence: p.price,
    file_path: filePath,
    preview_image: `${SUPABASE_URL}/storage/v1/object/public/media/${imagePath}`,
    active,
  });
  console.log(`uploaded  ${p.slug.padEnd(32)} ${String(pages).padStart(3)} pages  £${(p.price / 100).toFixed(2)}`);
}

const saved = await (
  await supabase("/rest/v1/products?on_conflict=slug", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rows),
  })
).json();
console.log(`${saved.length} products saved (${active ? "live" : "hidden"})`);
