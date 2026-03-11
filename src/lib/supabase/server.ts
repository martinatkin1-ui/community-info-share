import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 * MUST only be used inside Route Handlers or Server Actions – never sent to the browser.
 * Bypasses RLS so the calling code is responsible for all authorization checks.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
