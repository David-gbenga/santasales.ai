/**
 * Public URL for a file in the public "media" bucket (display images only).
 * Safe on client and server: uses the public Supabase URL.
 */
export function mediaUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/storage/v1/object/public/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}
