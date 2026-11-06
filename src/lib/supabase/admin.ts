import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Service-role client. Bypasses RLS and can call the Auth admin API.
 * Server only: the "server-only" import makes any client-side import fail the build.
 * Callers must check the session and role before using it.
 */
export function createSupabaseAdminClient() {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (see .env.example).");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
