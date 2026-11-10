import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { LyricsText } from "@/lib/validation";

const A4 = { width: 595.28, height: 841.89 } as const;
const MARGIN = 64;
const NAVY = rgb(0.075, 0.137, 0.247);
const BERRY = rgb(0.698, 0.157, 0.247);
const FROST = rgb(0.933, 0.953, 0.969);
const MUTED = rgb(0.28, 0.35, 0.45);

type Credit = { recipientName: string; senderName: string };

/** One section of the body: "[Verse 1]" label (or none) plus its lines. */
export function parseLyricsBody(body: string): { label: string | null; lines: string[] }[] {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((l) => l.trimEnd()))
    .filter((lines) => lines.some((l) => l.trim()))
    .map((lines) => {
      const match = lines[0].trim().match(/^\[(.{1,30})\]$/);
      return match
        ? { label: match[1], lines: lines.slice(1).filter((l) => l.trim()) }
        : { label: null, lines: lines.filter((l) => l.trim()) };
    });
}

/**
 * The standard PDF fonts only cover Windows-1252. Replace anything else
 * with its closest plain letter (é stays, ā → a) or drop it, so an unusual
 * character can never break the download.
 */
function encodable(font: PDFFont, text: string): string {
  let out = "";
  for (const ch of text) {
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      const plain = ch.normalize("NFKD").replace(/[̀-ͯ]/g, "");
      try {
        font.encodeText(plain);
        out += plain;
      } catch {
        // drop characters the font can't show (emoji etc.)
      }
    }
  }
  return out;
}

function wrap(font: PDFFont, size: number, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = `  ${word}`; // indent continuation lines so the song's line breaks stay visible
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/** Renders the finished lyrics as an A4 PDF, adding pages as needed. */
export async function renderLyricsPdf(text: LyricsText, credit: Credit): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(text.title);
  pdf.setAuthor(credit.senderName);
  pdf.setCreator("Snowpost");
  const titleFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const bodyFont = await pdf.embedFont(StandardFonts.TimesRoman);
  const labelFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const smallFont = await pdf.embedFont(StandardFonts.Helvetica);

  const width = A4.width - MARGIN * 2;
  let page: PDFPage = pdf.addPage([A4.width, A4.height]);
  let y = 0;

  function header() {
    const bandHeight = 150;
    page.drawRectangle({
      x: 0,
      y: A4.height - bandHeight,
      width: A4.width,
      height: bandHeight,
      color: NAVY,
    });
    const titleLines = wrap(titleFont, 30, encodable(titleFont, text.title), width);
    let ty = A4.height - 62;
    for (const l of titleLines.slice(0, 2)) {
      page.drawText(l.trim(), { x: MARGIN, y: ty, size: 30, font: titleFont, color: FROST });
      ty -= 34;
    }
    const subtitle = encodable(
      smallFont,
      `A Christmas song for ${credit.recipientName}, from ${credit.senderName}`,
    );
    page.drawText(subtitle, {
      x: MARGIN,
      y: A4.height - bandHeight + 26,
      size: 11,
      font: smallFont,
      color: FROST,
    });
    y = A4.height - bandHeight - 44;
  }

  function newPageIfNeeded(needed: number) {
    if (y - needed >= MARGIN + 30) return;
    page = pdf.addPage([A4.width, A4.height]);
    y = A4.height - MARGIN;
  }

  header();
  for (const section of parseLyricsBody(text.body)) {
    const wrapped = section.lines.flatMap((l) => wrap(bodyFont, 14, encodable(bodyFont, l), width));
    newPageIfNeeded((section.label ? 22 : 0) + Math.min(wrapped.length, 4) * 21);
    if (section.label) {
      page.drawText(encodable(labelFont, section.label), {
        x: MARGIN,
        y,
        size: 10,
        font: labelFont,
        color: BERRY,
      });
      y -= 20;
    }
    for (const line of wrapped) {
      newPageIfNeeded(21);
      page.drawText(line, { x: MARGIN, y, size: 14, font: bodyFont, color: NAVY });
      y -= 21;
    }
    y -= 16;
  }

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const footer = encodable(
      smallFont,
      `Original lyrics written for ${credit.recipientName}${pages.length > 1 ? `  ·  page ${i + 1} of ${pages.length}` : ""}`,
    );
    p.drawText(footer, { x: MARGIN, y: 36, size: 9, font: smallFont, color: MUTED });
  });

  return Buffer.from(await pdf.save());
}

/** Plain-text version for pasting into messages or a phone's notes. */
export function renderLyricsTxt(text: LyricsText, credit: Credit): Buffer {
  const content = `${text.title}\nA Christmas song for ${credit.recipientName}, from ${credit.senderName}\n\n${text.body}\n`;
  return Buffer.from(content.replace(/\n/g, "\r\n"), "utf8");
}
