import { fitFontSize, type CardWords } from "@/lib/card-fit";

export type PreviewDesign = {
  imageUrl: string;
  layout: {
    text: { x: number; y: number; width: number; height: number };
    align: "left" | "center" | "right";
    font: "serif" | "sans";
    color: string;
    accentColor?: string;
  };
};

const W = 1500;
const H = 2100;
/** Card pixels → container query width units, so the preview scales with its box. */
const cqw = (px: number) => `${(px / W) * 100}cqw`;

/**
 * Live HTML preview of the card. Mirrors the server renderer's layout and
 * font sizing so what buyers see is what they download.
 */
export function CardPreview({
  design,
  text,
  senderName,
  placeholder = false,
}: {
  design: PreviewDesign;
  text: CardWords | null;
  senderName: string;
  placeholder?: boolean;
}) {
  const { layout } = design;
  const box = layout.text;
  const size = text ? fitFontSize(text, box) : 56;
  const accent = layout.accentColor ?? layout.color;
  const display = layout.font === "serif" ? "var(--font-display)" : "var(--font-sans)";
  const items =
    layout.align === "left" ? "flex-start" : layout.align === "right" ? "flex-end" : "center";

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg shadow-[0_12px_40px_rgb(19_35_63/0.25)]"
      style={{ aspectRatio: `${W} / ${H}`, containerType: "inline-size" }}
      aria-label={text ? "Card preview" : "Card preview, message being written"}
      role="img"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- remote media image */}
      <img
        src={design.imageUrl}
        alt=""
        width={W}
        height={H}
        className="absolute inset-0 h-full w-full"
      />
      <div
        aria-hidden="true"
        className="absolute flex flex-col justify-center"
        style={{
          left: `${(box.x / W) * 100}%`,
          top: `${(box.y / H) * 100}%`,
          width: `${(box.width / W) * 100}%`,
          height: `${(box.height / H) * 100}%`,
          alignItems: items,
          textAlign: layout.align,
          color: layout.color,
        }}
      >
        {text ? (
          <>
            <p
              style={{
                fontFamily: display,
                fontSize: cqw(size * 1.25),
                color: accent,
                lineHeight: 1.3,
              }}
            >
              {text.greeting}
            </p>
            <div style={{ marginTop: cqw(size * 0.7), fontSize: cqw(size), lineHeight: 1.45 }}>
              {text.message.split(/\n+/).map((para, i) => (
                <p key={i} style={{ marginTop: i ? cqw(size * 0.5) : 0 }}>
                  {para}
                </p>
              ))}
            </div>
            <div
              style={{
                marginTop: cqw(size * 0.9),
                fontFamily: display,
                fontSize: cqw(size * 1.15),
                lineHeight: 1.35,
              }}
            >
              <p>{text.signOff}</p>
              <p style={{ color: accent }}>{senderName}</p>
            </div>
          </>
        ) : (
          <div
            className={`flex w-3/4 flex-col gap-[3cqw] ${placeholder ? "motion-safe:animate-pulse" : ""}`}
            style={{ alignItems: items }}
          >
            {[0.5, 1, 0.9, 1, 0.7].map((w, i) => (
              <span
                key={i}
                className="block h-[2.4cqw] rounded-full"
                style={{ width: `${w * 100}%`, background: layout.color, opacity: 0.25 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
