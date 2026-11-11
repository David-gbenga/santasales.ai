import { AI_KIT } from "@/lib/ai-kit";

/**
 * One line telling shoppers about the free AI Builder Kit that comes with any
 * paid order. Renders nothing once the offer is switched off in lib/ai-kit.ts.
 */
export function AiKitNote({
  tone = "snow",
  className = "",
}: {
  tone?: "night" | "snow";
  className?: string;
}) {
  if (!AI_KIT.enabled) return null;
  const colours =
    tone === "night"
      ? "border-ember/50 bg-night-raised/60 text-frost"
      : "border-ember/60 bg-ember/10 text-ink";
  return (
    <p className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed ${colours} ${className}`}>
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0 text-ember"
      >
        <rect x="3" y="8" width="18" height="13" rx="2" />
        <path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S10 8 12 8zm0 0c2-4 6-4 6-1.5S14 8 12 8z" />
      </svg>
      <span>
        <strong className="font-semibold">Free AI Builder Kit with any order:</strong> a 22-page
        guide to building your own AI app, emailed with your order.
      </span>
    </p>
  );
}
