"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/currency";
import type { Country } from "@/lib/country";

type PickupPoint = { id: string; name: string; city: string; hours: string | null };

export function CheckoutForm({
  locale,
  country,
  pickupPoints,
}: {
  locale: string;
  country: Country;
  pickupPoints: PickupPoint[];
}) {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const t = useTranslations("Checkout");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country,
        customerName: formData.get("customerName"),
        customerPhone: formData.get("customerPhone"),
        customerEmail: formData.get("customerEmail") || undefined,
        preferredChannel: formData.get("preferredChannel"),
        pickupPointId: formData.get("pickupPointId"),
        notes: formData.get("notes") || undefined,
        website: formData.get("website") || undefined,
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }),
    });

    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? t("genericError"));
      setSubmitting(false);
      return;
    }

    clearCart();
    router.push(`/${locale}/orders/${body.tracking_token}`);
  }

  if (!items.length) {
    return <p className="text-muted-foreground">{t("emptyCart")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-5">
        {/* Honeypot — hidden from real users via CSS, bots that autofill every field trip it. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="absolute -left-[9999px]"
          aria-hidden="true"
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customerName">{t("name")}</Label>
          <Input id="customerName" name="customerName" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customerPhone">{t("phone")}</Label>
          <Input id="customerPhone" name="customerPhone" required placeholder="+351911111111" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customerEmail">{t("emailOptional")}</Label>
          <Input id="customerEmail" name="customerEmail" type="email" />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("channel")}</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="preferredChannel" value="whatsapp" defaultChecked />
            WhatsApp
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="preferredChannel" value="email" />
            Email
          </label>
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pickupPointId">{t("pickupPoint")}</Label>
          <select
            id="pickupPointId"
            name="pickupPointId"
            required
            className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
          >
            {pickupPoints.map((point) => (
              <option key={point.id} value={point.id}>
                {point.name} — {point.city}
                {point.hours ? ` (${point.hours})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">{t("notesOptional")}</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" disabled={submitting} className="w-fit">
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </div>

      <aside className="flex h-fit flex-col gap-3 rounded-xl border border-border p-5">
        <h2 className="font-heading text-lg font-medium">{t("summary")}</h2>
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatMoney(item.price * item.quantity, item.currency, locale)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-medium">
          <span>{t("subtotal")}</span>
          <span>{formatMoney(subtotal, items[0]?.currency ?? "EUR", locale)}</span>
        </div>
      </aside>
    </form>
  );
}
