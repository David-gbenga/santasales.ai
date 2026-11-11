import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BootcampExperience } from "@/lib/validation";

export type BootcampSignup = {
  id: string;
  name: string;
  email: string;
  experience: BootcampExperience;
  goal: string | null;
  created_at: string;
};

/** Every bootcamp sign-up, newest first. Admin pages only. */
export async function listBootcampSignups(): Promise<BootcampSignup[]> {
  const { data, error } = await createAdminClient()
    .from("bootcamp_registrations")
    .select("id, name, email, experience, goal, created_at")
    .order("created_at", { ascending: false })
    .limit(5000)
    .returns<BootcampSignup[]>();
  if (error) throw new Error(`Reading bootcamp sign-ups failed: ${error.message}`);
  return data ?? [];
}
