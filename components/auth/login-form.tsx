"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Account is optional everywhere else in the app (guest checkout is the
// default per PRD) — this form only matters for the post-checkout "create an
// account to track orders faster" prompt and returning shoppers.
export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const supabase = createClient();

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setStatus(error ? "error" : "sent");
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-muted-foreground">
        Enviámos um link de acesso para <strong>{email}</strong>. Verifique a sua caixa de
        entrada.
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <form onSubmit={sendOtp} className="flex flex-col gap-3">
        <Input
          type="email"
          required
          placeholder="o.seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "A enviar…" : "Entrar com email"}
        </Button>
        {status === "error" && (
          <p className="text-sm text-destructive">Não foi possível enviar o link. Tente novamente.</p>
        )}
      </form>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" onClick={signInWithGoogle} type="button">
        Continuar com Google
      </Button>
    </div>
  );
}
