-- Public "media" bucket for images that are meant to be seen by everyone:
-- product preview images, gallery images and card design backgrounds.
-- (Decision 2026-11-10: content is managed without code changes.)
--
-- Anyone can READ via the public URL
--   <SUPABASE_URL>/storage/v1/object/public/media/<path>
-- but no storage.objects policies are added, so only the service role
-- (Supabase dashboard, seed scripts, future /admin forms) can upload,
-- replace or delete.
--
-- Paid files stay in the private "products", "generated" and "uploads" buckets.
--
-- Raster formats only: SVG can carry scripts, so it isn't allowed in a
-- public bucket on our project domain.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])  -- 5 MB
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
