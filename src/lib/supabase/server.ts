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

/**
 * Server-only Supabase client using the anon/public key.
 * Respects Row Level Security policies. Use this for public read endpoints so
 * the service-role key is never exercised for data that RLS can guard.
 */
export function createReadOnlyClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Back-compat alias while callsites are migrated.
export const createAnonClient = createReadOnlyClient;
