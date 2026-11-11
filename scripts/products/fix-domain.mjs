// Rewrites "giftpost.com" to "giftpost.co.uk" inside an existing PDF's text
// (the two hand-made sample books). The text is stored as font glyph codes,
// so each match is decoded with the font's ToUnicode map and re-encoded with
// the same font. Only works when the font subset contains the new letters.

import { createRequire } from "node:module";
import zlib from "node:zlib";

const require = createRequire(import.meta.url);
const { PDFDocument, PDFDict, PDFName } = require("pdf-lib");

function parseCMap(text) {
  const map = new Map();
  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g))
    for (const m of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g))
      map.set(m[1].toUpperCase(), Buffer.from(m[2], "hex").swap16().toString("utf16le"));
  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g))
    for (const m of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      const a = parseInt(m[1], 16), b = parseInt(m[2], 16), u = parseInt(m[3], 16);
      for (let c = a; c <= b; c++) map.set(c.toString(16).toUpperCase().padStart(m[1].length, "0"), String.fromCodePoint(u + c - a));
    }
  return map;
}

const inflate = (stream) => {
  try {
    return zlib.inflateSync(Buffer.from(stream.contents));
  } catch {
    return Buffer.from(stream.contents);
  }
};

/** Returns the fixed PDF bytes and how many occurrences were replaced. */
export async function fixDomain(bytes, from = "giftpost.com", to = "giftpost.co.uk") {
  const doc = await PDFDocument.load(bytes);
  let replaced = 0;
  for (const page of doc.getPages()) {
    const fonts = page.node.Resources()?.lookup(PDFName.of("Font"), PDFDict);
    const cmaps = new Map();
    for (const [key, ref] of fonts?.entries() ?? []) {
      const tu = doc.context.lookup(ref, PDFDict).get(PDFName.of("ToUnicode"));
      if (tu) cmaps.set(key.toString(), parseCMap(inflate(doc.context.lookup(tu)).toString("latin1")));
    }
    const contents = page.node.Contents();
    const refs = contents?.asArray ? contents.asArray() : [contents];
    let ops = "";
    for (const r of refs) ops += inflate(doc.context.lookup(r)).toString("latin1") + "\n";

    let font = null;
    let changed = false;
    ops = ops.replace(/(\/[A-Za-z0-9_.+-]+)(\s+[\d.]+\s+Tf)|\[((?:[^\]])*)\]\s*TJ|<([0-9A-Fa-f]+)>\s*Tj/g, (whole, f, tf, arr, single) => {
      if (f) {
        font = f;
        return whole;
      }
      const cmap = cmaps.get(font);
      if (!cmap) return whole;
      const width = [...cmap.keys()][0].length;
      const hexes = arr ? [...arr.matchAll(/<([0-9A-Fa-f]+)>/g)].map((x) => x[1]) : [single];
      let text = "";
      for (const h of hexes) for (let k = 0; k < h.length; k += width) text += cmap.get(h.slice(k, k + width).toUpperCase()) ?? "\u0000";
      if (!text.includes(from) || text.includes("\u0000")) return whole;
      const reverse = new Map([...cmap].map(([code, ch]) => [ch, code]));
      const next = text.replace(from, to);
      if ([...next].some((ch) => !reverse.has(ch))) return whole;
      replaced++;
      changed = true;
      return `<${[...next].map((ch) => reverse.get(ch)).join("")}> Tj`;
    });
    if (changed) {
      const stream = doc.context.flateStream(Buffer.from(ops, "latin1"));
      page.node.set(PDFName.of("Contents"), doc.context.register(stream));
    }
  }
  return { bytes: await doc.save(), replaced };
}
