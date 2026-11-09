-- Private storage buckets (PRD Phase 0). No storage.objects policies are
-- created, so only the service role can read or write; buyers get files
-- through short-lived signed URLs issued by server routes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- Digital products for sale (printables, wallpapers, etc.).
  ('products', 'products', false, 104857600, null),                                  -- 100 MB
  -- Rendered cards (PNG + PDF) and lyrics exports (PDF/TXT, optional MP3).
  ('generated', 'generated', false, 20971520,
     array['image/png', 'application/pdf', 'text/plain', 'audio/mpeg']),           -- 20 MB
  -- Customer photo uploads for cards (P1); deleted after 30 days.
  ('uploads', 'uploads', false, 5242880, array['image/jpeg', 'image/png'])          -- 5 MB
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
