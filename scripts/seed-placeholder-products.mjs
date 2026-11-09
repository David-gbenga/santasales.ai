// Seeds placeholder digital products so the shop and checkout can be built
// and tested before real products exist. Safe to re-run: files are
// overwritten and rows are upserted by slug.
//
//   pnpm seed:placeholders
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env.
// Replace these products (or set active = false) before launch.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

const BUCKET = "products";

const products = [
  {
    slug: "advent-activity-calendar",
    name: "Advent activity calendar",
    description:
      "24 printable doors with a small thing to do each day, from writing a card to a winter walk. A4, print at home.",
    price_pence: 400,
    pages: [
      "24 doors, one small activity a day.",
      "Print on A4 card, cut along the dotted lines, fold each door.",
      "Day 1: Write a card to someone you haven't spoken to this year.",
    ],
  },
  {
    slug: "gift-tag-set",
    name: "Gift tag set",
    description:
      "Twelve gift tags in three sizes, with space to write. Print on A4 card and cut out.",
    price_pence: 250,
    pages: [
      "12 tags in three sizes.",
      "Print on A4 card at 100% scale.",
      "Punch a hole and add ribbon.",
    ],
  },
  {
    slug: "snowfall-phone-wallpapers",
    name: "Snowfall phone wallpapers",
    description: "Six snowy wallpapers sized for current iPhone and Android screens.",
    price_pence: 150,
    pages: [
      "Six wallpapers, 1290 × 2796 px.",
      "Save to your phone, then set as lock or home screen.",
    ],
  },
];

/** A one-page PDF that clearly says it's a placeholder. */
async function placeholderPdf(product) {
  const doc = await PDFDocument.create();
  doc.setTitle(`${product.name} (placeholder)`);
  const page = doc.addPage([595.28, 841.89]); // A4 in points
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const navy = rgb(0.075, 0.137, 0.247);

  page.drawText("PLACEHOLDER FILE", {
    x: 56,
    y: 770,
    size: 12,
    font: sans,
    color: rgb(0.78, 0.2, 0.29),
  });
  page.drawText(product.name, { x: 56, y: 730, size: 30, font: serif, color: navy });
  page.drawText(`£${(product.price_pence / 100).toFixed(2)}`, {
    x: 56,
    y: 700,
    size: 14,
    font: sans,
    color: navy,
  });

  let y = 650;
  for (const line of [product.description, "", ...product.pages]) {
    page.drawText(line, {
      x: 56,
      y,
      size: 12,
      font: sans,
      color: navy,
      maxWidth: 480,
      lineHeight: 16,
    });
    y -= line.length > 80 ? 40 : 24;
  }
  page.drawText("This is a test file. Replace it with the real product before launch.", {
    x: 56,
    y: 80,
    size: 10,
    font: sans,
    color: rgb(0.28, 0.35, 0.45),
  });
  return doc.save();
}

async function supabase(path, init) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, ...init.headers },
  });
  if (!res.ok) throw new Error(`${init.method} ${path} → HTTP ${res.status}: ${await res.text()}`);
  return res;
}

async function uploadFile(path, bytes) {
  await supabase(`/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/pdf", "x-upsert": "true" },
    body: bytes,
  });
}

async function upsertProducts(rows) {
  const res = await supabase("/rest/v1/products?on_conflict=slug", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  return res.json();
}

const rows = [];
for (const product of products) {
  const filePath = `placeholders/${product.slug}.pdf`;
  const bytes = await placeholderPdf(product);
  await uploadFile(filePath, bytes);
  console.log(`uploaded  ${BUCKET}/${filePath} (${bytes.length} bytes)`);
  rows.push({
    slug: product.slug,
    name: product.name,
    description: product.description,
    price_pence: product.price_pence,
    currency: "gbp",
    file_path: filePath,
    preview_image: `/products/${product.slug}.svg`,
    active: true,
  });
}

const saved = await upsertProducts(rows);
for (const p of saved)
  console.log(`saved     ${p.slug}  £${(p.price_pence / 100).toFixed(2)}  id=${p.id}`);
