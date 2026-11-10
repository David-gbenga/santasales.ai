/**
 * Message font size (in card pixels, 1500×2100 space) that fits the text
 * box. Shared by the server renderer and the in-browser preview so both
 * wrap the same way. Estimates ~0.46em average glyph width for Figtree (measured against renders).
 */
export type CardWords = { greeting: string; message: string; signOff: string };

export const FIT = { max: 76, min: 34, step: 2 } as const;

export function fitFontSize(text: CardWords, box: { width: number; height: number }): number {
  for (let size = FIT.max; size >= FIT.min; size -= FIT.step) {
    const charsPerLine = Math.max(10, Math.floor(box.width / (size * 0.46)));
    const messageLines = text.message
      .split(/\n+/)
      .reduce((n, para) => n + Math.max(1, Math.ceil(para.length / charsPerLine)), 0);
    const greeting = size * 1.25 * 1.3;
    const message = messageLines * size * 1.45;
    const signOff = 2 * size * 1.15 * 1.35;
    const gaps = size * 1.6;
    if (greeting + message + signOff + gaps <= box.height) return size;
  }
  return FIT.min;
}
