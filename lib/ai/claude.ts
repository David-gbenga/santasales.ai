import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { requireEnv } from "@/lib/env";

let client: Anthropic | undefined;

function getClient(): Anthropic {
  client ??= new Anthropic({
    apiKey: requireEnv("ANTHROPIC_API_KEY"),
    timeout: 60_000, // ms; short creative replies finish well within this
    maxRetries: 2, // SDK retries 429/5xx/connection errors
  });
  return client;
}

/** The model to use, from ANTHROPIC_MODEL (e.g. claude-sonnet-5-5). */
export function claudeModel(): string {
  return requireEnv("ANTHROPIC_MODEL");
}

/** Claude (and its fallback) declined the request on safety grounds. */
export class AiRefusalError extends Error {}
/** Claude answered, but twice without usable output. */
export class AiOutputError extends Error {}

export type Prompt = {
  version: string;
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
};

type StructuredRequest<Schema extends z.ZodType> = {
  prompt: Prompt;
  schema: Schema;
  /** Extra checks the JSON schema can't express (e.g. word counts). Return an error message or null. */
  check?: (value: z.infer<Schema>) => string | null;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
};

/**
 * Calls Claude for JSON matching `schema`. Retries once if the output is
 * missing, unparseable or fails `check`, then throws AiOutputError
 * (CLAUDE.md: retry once on a parse failure, then show a friendly error).
 *
 * Server-side refusal fallbacks are on (`fallbacks: "default"`): if the model
 * declines, Anthropic re-runs the request on a suitable fallback model in the
 * same call. A refusal from the whole chain throws AiRefusalError.
 */
export async function generateStructured<Schema extends z.ZodType>({
  prompt,
  schema,
  check,
  maxTokens = 4000,
  effort = "low",
}: StructuredRequest<Schema>): Promise<z.infer<Schema>> {
  let lastProblem = "no output";

  for (let attempt = 1; attempt <= 2; attempt++) {
    let response;
    try {
      response = await getClient().beta.messages.parse({
        model: claudeModel(),
        max_tokens: maxTokens,
        system: prompt.system,
        messages: prompt.messages,
        output_config: { format: betaZodOutputFormat(schema), effort },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
    } catch (err) {
      // API errors (auth, rate limit after SDK retries, 5xx) are not retried here.
      if (err instanceof Anthropic.APIError) throw err;
      lastProblem = `unparseable output: ${err instanceof Error ? err.message : String(err)}`;
      continue;
    }

    if (response.stop_reason === "refusal") {
      throw new AiRefusalError(`refused (${response.stop_details?.category ?? "no category"})`);
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      lastProblem = `stop_reason ${response.stop_reason}, parsed ${Boolean(response.parsed_output)}`;
      continue;
    }

    const parsed = schema.safeParse(response.parsed_output);
    if (!parsed.success) {
      lastProblem = `schema: ${parsed.error.message}`;
      continue;
    }
    const problem = check?.(parsed.data) ?? null;
    if (problem) {
      lastProblem = problem;
      continue;
    }
    return parsed.data;
  }

  throw new AiOutputError(`No usable output after 2 attempts (${prompt.version}): ${lastProblem}`);
}
