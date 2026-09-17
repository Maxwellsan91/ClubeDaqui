import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!serviceKey)
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin access");
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}