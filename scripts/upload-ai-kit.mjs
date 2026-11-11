// Uploads the Giftpost AI Builder Kit PDF to the private products bucket
// (see lib/ai-kit.ts). Run after re-rendering marketing/ai-kit/kit.html:
//   node --env-file=.env scripts/upload-ai-kit.mjs
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");

const file = await readFile(new URL("../marketing/ai-kit/giftpost-ai-builder-kit.pdf", import.meta.url));
const db = createClient(url, key, { auth: { persistSession: false } });
const { error } = await db.storage
  .from("products")
  .upload("bonus/giftpost-ai-builder-kit.pdf", file, { contentType: "application/pdf", upsert: true });
if (error) throw new Error(`Upload failed: ${error.message}`);
console.log(`Uploaded the AI kit (${Math.round(file.length / 1024)} KB)`);
