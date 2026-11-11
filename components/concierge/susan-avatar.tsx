/** The Gift Concierge's name, shown in the chat and launcher. */
export const CONCIERGE_NAME = "Susan";

/**
 * Susan's avatar: an original illustration in the brand palette (no photo of a
 * real person). Decorative; the name is always shown as text beside it.
 */
export function SusanAvatar({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`shrink-0 rounded-full ${className}`}
    >
      <circle cx="32" cy="32" r="32" fill="#f7b95f" />
      {/* hair behind the face */}
      <path d="M12 40c-3-16 6-29 20-29s23 13 20 29c-2 9-6 14-6 14H18s-4-5-6-14z" fill="#5a2e1f" />
      {/* neck and jumper */}
      <path d="M27 44h10v8H27z" fill="#c98d6b" />
      <path d="M10 64c2-10 11-15 22-15s20 5 22 15z" fill="#c8324a" />
      <path d="M24 50c3 3 13 3 16 0" stroke="#f4f7fa" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* face */}
      <ellipse cx="32" cy="32" rx="12.5" ry="14" fill="#d9a07c" />
      {/* fringe */}
      <path d="M19 30c1-9 7-14 14-14 6 0 11 4 12 11-5-1-10-4-12-8-3 5-8 9-14 11z" fill="#5a2e1f" />
      {/* eyes, cheeks, smile */}
      <circle cx="27" cy="33" r="1.6" fill="#13233f" />
      <circle cx="37" cy="33" r="1.6" fill="#13233f" />
      <circle cx="24.5" cy="37.5" r="2.2" fill="#e8846f" opacity="0.55" />
      <circle cx="39.5" cy="37.5" r="2.2" fill="#e8846f" opacity="0.55" />
      <path d="M28 39.5c2 2 6 2 8 0" stroke="#7a2f2a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* earrings */}
      <circle cx="19.8" cy="37" r="1.4" fill="#f2a541" />
      <circle cx="44.2" cy="37" r="1.4" fill="#f2a541" />
    </svg>
  );
}
