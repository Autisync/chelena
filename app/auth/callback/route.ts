import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Shared callback for both email-OTP magic links and Google OAuth (Supabase
// Auth redirects here with a `code` to exchange for a session either way).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/pt";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/pt/account/login?error=auth`);
}
