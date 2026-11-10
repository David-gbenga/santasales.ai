import "server-only";
import { SONG_AUDIO_MAX_TAKES, VOICE_GREETING_MAX_TAKES } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  songAudioInputSchema,
  voiceGreetingInputSchema,
  type SongAudioInput,
  type VoiceGreetingInput,
} from "@/lib/validation";

export type AddonKind = "song_audio" | "voice_greeting";

export type Addon =
  | (AddonBase & { kind: "song_audio"; input: SongAudioInput })
  | (AddonBase & { kind: "voice_greeting"; input: VoiceGreetingInput });

type AddonBase = {
  id: string;
  parentId: string;
  takesUsed: number;
  audioPath: string | null;
  order: { id: string; status: "pending" | "paid" | "refunded" } | null;
};

type Row = {
  id: string;
  kind: string;
  parent_id: string | null;
  input: unknown;
  regen_count: number;
  output_text: string | null;
  orders: { id: string; status: "pending" | "paid" | "refunded" }[];
};

const COLUMNS = "id, kind, parent_id, input, regen_count, output_text, orders(id, status)";

export function maxTakes(kind: AddonKind): number {
  return kind === "song_audio" ? SONG_AUDIO_MAX_TAKES : VOICE_GREETING_MAX_TAKES;
}

function audioPathOf(outputText: string | null): string | null {
  if (!outputText) return null;
  try {
    const parsed = JSON.parse(outputText) as { audioPath?: unknown };
    return typeof parsed.audioPath === "string" ? parsed.audioPath : null;
  } catch {
    return null;
  }
}

function toAddon(row: Row): Addon | null {
  if (!row.parent_id) return null;
  const base: AddonBase = {
    id: row.id,
    parentId: row.parent_id,
    takesUsed: row.regen_count,
    audioPath: audioPathOf(row.output_text),
    order: row.orders[0] ?? null,
  };
  if (row.kind === "song_audio") {
    const input = songAudioInputSchema.safeParse(row.input);
    return input.success ? { ...base, kind: "song_audio", input: input.data } : null;
  }
  if (row.kind === "voice_greeting") {
    const input = voiceGreetingInputSchema.safeParse(row.input);
    return input.success ? { ...base, kind: "voice_greeting", input: input.data } : null;
  }
  return null;
}

export async function getAddon(id: string): Promise<Addon | null> {
  const { data, error } = await createAdminClient()
    .from("generations")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle<Row>();
  if (error) throw new Error(`Reading add-on failed: ${error.message}`);
  return data ? toAddon(data) : null;
}

/**
 * The add-ons that matter for a card or song: per kind, the paid one if any,
 * otherwise the newest pending one (so a returning buyer sees "Confirming…").
 */
export async function getAddonsFor(parentId: string): Promise<Partial<Record<AddonKind, Addon>>> {
  const { data, error } = await createAdminClient()
    .from("generations")
    .select(COLUMNS)
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false })
    .returns<Row[]>();
  if (error) throw new Error(`Reading add-ons failed: ${error.message}`);

  const result: Partial<Record<AddonKind, Addon>> = {};
  for (const addon of data.map(toAddon)) {
    if (!addon || addon.order?.status === "refunded") continue;
    const current = result[addon.kind];
    const isPaid = addon.order?.status === "paid";
    if (!current || (isPaid && current.order?.status !== "paid")) result[addon.kind] = addon;
  }
  return result;
}

/**
 * Whether an add-on may be recorded: its own order is paid, or (for the sung
 * version that comes with every song) the parent song's order is paid.
 */
export async function isAddonPaid(addon: Addon): Promise<boolean> {
  if (addon.order?.status === "paid") return true;
  if (addon.kind !== "song_audio" || addon.order) return false;
  const { data, error } = await createAdminClient()
    .from("generations")
    .select("orders(status)")
    .eq("id", addon.parentId)
    .maybeSingle<{ orders: { status: string }[] }>();
  if (error) throw new Error(`Reading parent order failed: ${error.message}`);
  return Boolean(data?.orders.some((o) => o.status === "paid"));
}
