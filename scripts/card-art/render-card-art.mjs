// Renders the card artwork in designs.mjs to PNG files with Playwright's
// Chromium (already a dev dependency). Output: scripts/card-art/out/<slug>.png
//
//   node scripts/card-art/render-card-art.mjs
//
// With --preview, also draws each design's text area as a dashed box so the
// layout can be checked by eye (those files end in -preview.png).

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { designs, SIZE } from "./designs.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });
const preview = process.argv.includes("--preview");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1 });

for (const design of designs) {
  const { x, y, width, height } = design.layout.text;
  const guide = preview
    ? `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="#ff00aa" stroke-width="6" stroke-dasharray="24 16"/>`
    : "";
  await page.setContent(
    `<!doctype html><html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="${SIZE.width}" height="${SIZE.height}" viewBox="0 0 ${SIZE.width} ${SIZE.height}">${design.svg}${guide}</svg></body></html>`,
  );
  const file = join(outDir, `${design.slug}${preview ? "-preview" : ""}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, ...SIZE } });
  console.log(`rendered  ${file}`);
}

await browser.close();
