"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// No pre-check for "already reviewed" — anon can't read its own pending
// (unapproved) review row (RLS only exposes approved reviews to anon, see
// migration 002), so this relies on the unique (order_id, product_id)
// constraint and shows the resulting 409 as a friendly message instead.
export function ReviewForm({
  trackingToken,
  productId,
  productName,
}: {
  trackingToken: string;
  productId: string;
  productName: string;
}) {
  const t = useTranslations("Reviews");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "already" | "error">("idle");
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingToken, productId, rating, body: body || undefined }),
    });
    if (res.status === 409) {
      setState("already");
      return;
    }
    if (!res.ok) {
      setState("error");
      return;
    }
    const data = await res.json();
    setGoogleReviewUrl(data.googleReviewUrl);
    setState("done");
  }

  if (state === "already") return <p className="text-sm text-muted-foreground">{t("alreadyReviewed")}</p>;
  if (state === "done") {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="text-success">{t("thanks")}</p>
        {googleReviewUrl && (
          <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            {t("alsoGoogle")}
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border p-3">
      <span className="text-sm font-medium">{productName}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            aria-label={`${star} estrelas`}
            className={star <= rating ? "text-accent" : "text-border"}
          >
            ★
          </button>
        ))}
      </div>
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder={t("bodyPlaceholder")} />
      <Button type="submit" size="sm" disabled={state === "submitting"} className="w-fit">
        {state === "submitting" ? t("submitting") : t("submit")}
      </Button>
      {state === "error" && <p className="text-xs text-destructive">{t("error")}</p>}
    </form>
  );
}
