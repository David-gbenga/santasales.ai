// Renders every product in scripts/products/catalogue/*.mjs to
//   out/<slug>.pdf        the A4 printable (cover + inside pages)
//   out/<slug>-cover.png  the 800×1000 shop picture
//
//   node scripts/products/build.mjs [slug …]

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { fixDomain } from "./fix-domain.mjs";
import { bookHtml, shopCoverHtml } from "./lib.mjs";

const { PDFDocument } = createRequire(import.meta.url)("pdf-lib");

/** Cover page from our render + the supplied book (domain fixed). */
async function mergeSupplied(product, coverPdfPath) {
  const { bytes, replaced } = await fixDomain(readFileSync(join(here, product.sourcePdf)));
  const cover = await PDFDocument.load(readFileSync(coverPdfPath));
  const book = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  const [first] = await out.copyPages(cover, [0]);
  out.addPage(first);
  for (const p of await out.copyPages(book, book.getPageIndices())) out.addPage(p);
  out.setTitle(`${product.title} | Giftpost`);
  writeFileSync(coverPdfPath, await out.save());
  return replaced;
}

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "out");
mkdirSync(out, { recursive: true });

export async function loadCatalogue() {
  const dir = join(here, "catalogue");
  const all = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".mjs")).sort()) {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    all.push(...mod.products);
  }
  return all;
}

const only = process.argv.slice(2);
const catalogue = (await loadCatalogue()).filter((p) => !only.length || only.includes(p.slug));
const browser = await chromium.launch();
const page = await browser.newPage();

for (const product of catalogue) {
  const book = { ...product, pages: product.pages() };
  const htmlPath = join(out, `${product.slug}.html`);
  writeFileSync(htmlPath, bookHtml(book));
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => document.fonts.ready);
  const pdfPath = join(out, `${product.slug}.pdf`);
  await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
  if (product.sourcePdf) console.log(`  domain fixed on ${await mergeSupplied(product, pdfPath)} pages`);

  const coverPath = join(out, `${product.slug}-cover.html`);
  writeFileSync(coverPath, shopCoverHtml(book));
  await page.setViewportSize({ width: 800, height: 1000 });
  await page.goto(pathToFileURL(coverPath).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, `${product.slug}-cover.png`) });
  console.log(`built  ${product.slug.padEnd(32)} ${String(book.pageCount).padStart(3)} pages  £${(product.price / 100).toFixed(2)}`);
}
await browser.close();
