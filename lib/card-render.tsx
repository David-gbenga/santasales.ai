import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PDFDocument } from "pdf-lib";
import { CARD_SIZE, type CardDesign } from "@/lib/card-designs";
import { fitFontSize } from "@/lib/card-fit";
import { mediaUrl } from "@/lib/media";
import type { CardText } from "@/lib/validation";

/** 5×7 inches in PDF points (72 pt per inch). */
const PDF_PAGE = { width: 5 * 72, height: 7 * 72 } as const;

type Fonts = { display: Buffer; body: Buffer; bodyStrong: Buffer };
let fontsPromise: Promise<Fonts> | undefined;

/** Fonts are bundled with the route via outputFileTracingIncludes in next.config.ts. */
function loadFonts(): Promise<Fonts> {
  const dir = join(process.cwd(), "assets", "fonts");
  fontsPromise ??= Promise.all([
    readFile(join(dir, "Gloock-Regular.ttf")),
    readFile(join(dir, "Figtree-Regular.ttf")),
    readFile(join(dir, "Figtree-SemiBold.ttf")),
  ]).then(([display, body, bodyStrong]) => ({ display, body, bodyStrong }));
  return fontsPromise;
}

async function backgroundDataUrl(design: CardDesign): Promise<string> {
  const res = await fetch(mediaUrl(design.backgroundPath), { cache: "no-store" });
  if (!res.ok) throw new Error(`Background ${design.backgroundPath} → HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "image/png";
  return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
}

/** Renders the finished card as a 1500×2100 PNG. */
export async function renderCardPng(
  design: CardDesign,
  text: CardText,
  /** Null for an anonymous card: nothing goes under the sign-off. */
  senderName: string | null,
): Promise<Buffer> {
  const [fonts, background] = await Promise.all([loadFonts(), backgroundDataUrl(design)]);
  const { layout } = design;
  const box = layout.text;
  const size = fitFontSize(text, box);
  const accent = layout.accentColor ?? layout.color;
  const displayFamily = layout.font === "serif" ? "Gloock" : "Figtree";
  const justify =
    layout.align === "left" ? "flex-start" : layout.align === "right" ? "flex-end" : "center";

  const image = new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori only renders <img> */}
      <img
        src={background}
        width={CARD_SIZE.width}
        height={CARD_SIZE.height}
        alt=""
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: justify,
          textAlign: layout.align,
          color: layout.color,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: displayFamily,
            fontSize: size * 1.25,
            color: accent,
          }}
        >
          {text.greeting}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: size * 0.7,
            fontFamily: "Figtree",
            fontSize: size,
            lineHeight: 1.45,
          }}
        >
          {text.message.split(/\n+/).map((para, i) => (
            <div key={i} style={{ display: "flex", marginTop: i ? size * 0.5 : 0 }}>
              {para}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: justify,
            marginTop: size * 0.9,
            fontFamily: displayFamily,
            fontSize: size * 1.15,
            lineHeight: 1.35,
          }}
        >
          <div style={{ display: "flex" }}>{text.signOff}</div>
          {senderName && <div style={{ display: "flex", color: accent }}>{senderName}</div>}
        </div>
      </div>
    </div>,
    {
      width: CARD_SIZE.width,
      height: CARD_SIZE.height,
      fonts: [
        { name: "Gloock", data: fonts.display, style: "normal", weight: 400 },
        { name: "Figtree", data: fonts.body, style: "normal", weight: 400 },
        { name: "Figtree", data: fonts.bodyStrong, style: "normal", weight: 600 },
      ],
    },
  );

  return Buffer.from(await image.arrayBuffer());
}

/** Wraps the PNG in a single-page 5×7 in PDF. */
export async function cardPdfFromPng(png: Buffer, title: string): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setCreator("Giftpost");
  const image = await pdf.embedPng(png);
  const page = pdf.addPage([PDF_PAGE.width, PDF_PAGE.height]);
  page.drawImage(image, { x: 0, y: 0, width: PDF_PAGE.width, height: PDF_PAGE.height });
  return Buffer.from(await pdf.save());
}
