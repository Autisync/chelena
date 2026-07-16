"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TrackOrderForm({ locale }: { locale: string }) {
  const [token, setToken] = useState("");
  const router = useRouter();
  const t = useTranslations("Tracking");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/${locale}/orders/${token.trim()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3">
      <Input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder={t("tokenPlaceholder")}
        required
      />
      <Button type="submit" className="w-fit">
        {t("trackButton")}
      </Button>
    </form>
  );
}
