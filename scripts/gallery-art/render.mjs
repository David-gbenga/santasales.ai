// Renders the gallery gift tiles (gifts.mjs, ebay-gifts.mjs) to PNG with
// Playwright's Chromium. Output: scripts/gallery-art/out/<store>-<slug>.png
// (800×1000). Pass a store name to render only that store.
//
//   node scripts/gallery-art/render.mjs [amazon|ebay]

import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { ebayGifts } from "./ebay-gifts.mjs";
import { TILE, gifts as amazonGifts } from "./gifts.mjs";

const only = process.argv[2];
const gifts = [...amazonGifts, ...ebayGifts].filter((g) => !only || g.store === only);

const here = dirname(fileURLToPath(import.meta.url));
const fonts = join(here, "../../assets/fonts");
const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });
const font = (file) => `data:font/ttf;base64,${readFileSync(join(fonts, file)).toString("base64")}`;

const css = `
@font-face { font-family: Gloock; src: url(${font("Gloock-Regular.ttf")}); }
@font-face { font-family: Figtree; src: url(${font("Figtree-SemiBold.ttf")}); font-weight: 600; }
* { margin: 0; box-sizing: border-box; }
body { width: ${TILE.width}px; height: ${TILE.height}px; }
.tile { position: relative; width: 100%; height: 100%; overflow: hidden; padding: 64px;
  display: flex; flex-direction: column; justify-content: space-between; }
.glow { position: absolute; border-radius: 50%; opacity: .12; }
.label { font: 600 26px Figtree; letter-spacing: .14em; text-transform: uppercase; position: relative; }
.icon { position: relative; align-self: center; width: 430px; height: 430px; }
.icon svg { width: 100%; height: 100%; fill: none; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
h1 { font: 400 70px/1.05 Gloock; position: relative; text-wrap: balance; }
.rule { width: 80px; height: 5px; border-radius: 3px; margin-bottom: 26px; position: relative; }
`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: TILE, deviceScaleFactor: 1 });
for (const g of gifts) {
  const { bg, fg, accent } = g.palette;
  await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body>
    <div class="tile" style="background:${bg};color:${fg}">
      <div class="glow" style="width:620px;height:620px;right:-220px;top:-200px;background:${accent}"></div>
      <div class="glow" style="width:420px;height:420px;left:-180px;bottom:-120px;background:${fg}"></div>
      <p class="label" style="color:${accent}">Gift idea · under £15</p>
      <div class="icon"><svg viewBox="0 0 200 200" stroke="${fg}">${g.svg}</svg></div>
      <div><div class="rule" style="background:${accent}"></div><h1>${g.title}</h1></div>
    </div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(outDir, `${g.store}-${g.slug}.png`) });
  console.log(`rendered  ${g.store}-${g.slug}.png`);
}
await browser.close();
