import { SongAddon, VoiceAddon, type AddonState } from "@/components/gift/audio-addons";
import { ShareGift } from "@/components/gift/share-gift";
import { getAddonsFor, maxTakes, type Addon } from "@/lib/addons";
import { siteUrl } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { getShareFor } from "@/lib/gifts";
import { VOICE_GREETING_PRICE_PENCE } from "@/lib/pricing";
import type { Occasion } from "@/lib/occasions";
import { createAdminClient } from "@/lib/supabase/admin";

/** True when this card or song was made with a Premium membership. */
async function isPremiumOrder(orderId: string): Promise<boolean> {
  const { data } = await createAdminClient().from("orders").select("source").eq("id", orderId).maybeSingle();
  return data?.source === "premium";
}

function toState(addon: Addon | undefined): AddonState {
  if (!addon || addon.order?.status === "refunded") return null;
  return {
    id: addon.id,
    orderId: addon.order?.id ?? null,
    status: addon.order?.status === "paid" ? "paid" : "pending",
    audioReady: Boolean(addon.audioPath),
    takesLeft: Math.max(0, maxTakes(addon.kind) - addon.takesUsed),
    input: addon.input,
  };
}

/** The sung recording that comes with a song: paid through the song's own order. */
function includedSongState(addon: Addon | undefined, songOrderId: string): AddonState {
  if (!addon) return null;
  return {
    id: addon.id,
    orderId: songOrderId, // downloads go through the song order (?format=mp3)
    status: "paid",
    audioReady: Boolean(addon.audioPath),
    takesLeft: Math.max(0, maxTakes(addon.kind) - addon.takesUsed),
    input: addon.input,
  };
}

/**
 * Shown under a finished card or song: send it as a gift link, play the
 * song's sung recording, and add an optional voice greeting.
 */
export async function GiftExtras({
  generationId,
  orderId,
  kind,
  recipientName,
  senderName,
  defaultGreeting,
  anonymous,
  occasion,
}: {
  generationId: string;
  orderId: string;
  kind: "card" | "lyrics";
  recipientName: string;
  senderName: string;
  defaultGreeting: string;
  anonymous: boolean;
  occasion: Occasion;
}) {
  const [addons, share, premium] = await Promise.all([
    getAddonsFor(generationId),
    getShareFor(generationId),
    isPremiumOrder(orderId),
  ]);

  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-2">
      {kind === "lyrics" && (
        <div className="lg:col-span-2">
          <SongAddon addon={includedSongState(addons.song_audio, orderId)} />
        </div>
      )}
      <div className="lg:col-span-2">
        <ShareGift
          orderId={orderId}
          recipientName={recipientName}
          senderName={senderName}
          anonymous={anonymous}
          occasion={occasion}
          noun={kind === "card" ? "card" : "song"}
          initialUrl={share ? `${siteUrl()}/gift/${share.token}` : null}
          initialActive={share?.active ?? false}
        />
      </div>
      <VoiceAddon
        parentId={generationId}
        priceLabel={formatPrice(VOICE_GREETING_PRICE_PENCE)}
        premium={premium}
        addon={toState(addons.voice_greeting)}
        defaultText={defaultGreeting}
      />
    </div>
  );
}
