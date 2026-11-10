import { generateStructured } from "@/lib/ai/claude";
import { buildCardPrompt, cardOutputSchema, checkCardOutput } from "@/lib/ai/prompts/card";
import { getCardDesign } from "@/lib/card-designs";
import { cardPdfFromPng, renderCardPng } from "@/lib/card-render";
import { createGenerationRoute } from "@/lib/generation-route";
import { getCardGeneration, uploadGenerated, type CardGeneration } from "@/lib/generations";
import { generateCardRequestSchema, type CardInput, type CardText } from "@/lib/validation";

// Claude plus rendering can take a while; give the function room on Vercel.
export const maxDuration = 60;

export const POST = createGenerationRoute<CardInput, CardText, CardGeneration>({
  label: "card",
  noun: "card",
  finishPhrase: "create your card",
  requestSchema: generateCardRequestSchema,
  load: getCardGeneration,

  write: (generation, previous) =>
    generateStructured({
      prompt: buildCardPrompt(generation.input, previous),
      schema: cardOutputSchema,
      check: checkCardOutput,
      maxTokens: 4000,
      effort: "low",
    }),

  async render(generation, text) {
    const design = await getCardDesign(generation.designSlug, { includeInactive: true });
    if (!design) throw new Error(`Design ${generation.designSlug} missing`);
    const png = await renderCardPng(design, text, generation.input.senderName);
    const pdf = await cardPdfFromPng(png, `Christmas card for ${generation.input.recipientName}`);
    const base = `cards/${generation.id}`;
    await uploadGenerated([
      { path: `${base}/card.png`, body: png, contentType: "image/png" },
      { path: `${base}/card.pdf`, body: pdf, contentType: "application/pdf" },
    ]);
    return { png: `${base}/card.png`, pdf: `${base}/card.pdf` };
  },
});
