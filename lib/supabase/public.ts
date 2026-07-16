import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Stateless (no cookies, no session) — for anon-readable public data on
// pages that need to stay statically rendered/ISR (e.g. the home page).
// The cookie-aware server client (lib/supabase/server.ts) touches
// `cookies()` internally for auth session handling, which forces the whole
// route dynamic even for queries that don't need a session — this client
// avoids that for the common case of "just read public rows".
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
