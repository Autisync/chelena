"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoginForm } from "@/components/auth/login-form";
import { useTranslations } from "next-intl";

// PRD P0: "Post-checkout prompt to claim the order into a new account."
// Two paths: (1) already signed in — one-click claim via the RPC; (2) not
// signed in — reuse the existing login form, redirected back here with
// ?claim=1 so the effect below fires the claim once the session exists.
export function ClaimOrderPrompt({ trackingToken }: { trackingToken: string }) {
  const t = useTranslations("Claim");
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null | undefined>(undefined);
  const [status, setStatus] = useState<"idle" | "claiming" | "claimed" | "error">("idle");
  const autoClaimed = useRef(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, [supabase]);

  useEffect(() => {
    if (!userEmail || searchParams.get("claim") !== "1" || autoClaimed.current) return;
    autoClaimed.current = true;
    supabase.rpc("claim_order", { p_tracking_token: trackingToken }).then(({ error }) => {
      setStatus(error ? "error" : "claimed");
      router.replace(pathname);
    });
  }, [userEmail, searchParams, supabase, trackingToken, router, pathname]);

  async function claimNow() {
    setStatus("claiming");
    const { error } = await supabase.rpc("claim_order", { p_tracking_token: trackingToken });
    setStatus(error ? "error" : "claimed");
  }

  if (userEmail === undefined || status === "claiming") return null;
  if (status === "claimed") {
    return <p className="mt-6 text-sm text-success">{t("claimed")}</p>;
  }

  return (
    <div className="mt-10 flex flex-col gap-3 rounded-xl border border-border p-5">
      <h2 className="font-heading text-lg font-medium">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("hint")}</p>
      {userEmail ? (
        <button
          onClick={claimNow}
          className="w-fit rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          {t("claimButton")}
        </button>
      ) : (
        <LoginForm next={`${pathname}?claim=1`} />
      )}
      {status === "error" && <p className="text-sm text-destructive">{t("error")}</p>}
    </div>
  );
}
