import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Service-role client. Bypasses RLS entirely — never import this from a
// Client Component (the `server-only` import throws the build if you try).
// Restricted to: image pipeline writes, notification dispatcher, guest order
// tracking lookups, and other trusted server-side operations per hard rule #4.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
