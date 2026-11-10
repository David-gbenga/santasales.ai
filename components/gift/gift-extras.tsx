import { SongAddon, VoiceAddon, type AddonState } from "@/components/gift/audio-addons";
import { ShareGift } from "@/components/gift/share-gift";
import { getAddonsFor, maxTakes, type Addon } from "@/lib/addons";
import { siteUrl } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { getShareFor } from "@/lib/gifts";
import { SONG_AUDIO_PRICE_PENCE, VOICE_GREETING_PRICE_PENCE } from "@/lib/pricing";

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

/**
 * Shown under a finished card or song: send it as a gift link, and add the
 * ElevenLabs extras (a sung version for songs, a voice greeting for both).
 */
export async function GiftExtras({
  generationId,
  orderId,
  kind,
  recipientName,
  senderName,
  defaultGreeting,
}: {
  generationId: string;
  orderId: string;
  kind: "card" | "lyrics";
  recipientName: string;
  senderName: string;
  defaultGreeting: string;
}) {
  const [addons, share] = await Promise.all([
    getAddonsFor(generationId),
    getShareFor(generationId),
  ]);

  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <ShareGift
          orderId={orderId}
          recipientName={recipientName}
          senderName={senderName}
          noun={kind === "card" ? "card" : "song"}
          initialUrl={share ? `${siteUrl()}/gift/${share.token}` : null}
          initialActive={share?.active ?? false}
        />
      </div>
      {kind === "lyrics" && (
        <SongAddon
          parentId={generationId}
          priceLabel={formatPrice(SONG_AUDIO_PRICE_PENCE)}
          addon={toState(addons.song_audio)}
        />
      )}
      <VoiceAddon
        parentId={generationId}
        priceLabel={formatPrice(VOICE_GREETING_PRICE_PENCE)}
        addon={toState(addons.voice_greeting)}
        defaultText={defaultGreeting}
      />
    </div>
  );
}
