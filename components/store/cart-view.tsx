"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart/use-cart";
import { productImageUrl } from "@/lib/images/url";
import { formatMoney } from "@/lib/currency";
import { Button, buttonVariants } from "@/components/ui/button";

export function CartView({ locale }: { locale: string }) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const t = useTranslations("Cart");

  if (!items.length) {
    return <p className="text-muted-foreground">{t("empty")}</p>;
  }

  const currency = items[0]?.currency ?? "EUR";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.imagePath && (
                <Image
                  src={productImageUrl(item.imagePath)}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <Link href={`/${locale}/products/${item.slug}`} className="text-sm font-medium hover:underline">
                {item.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatMoney(item.price, item.currency, locale)}
              </p>
            </div>
            <input
              type="number"
              min={1}
              max={item.stock}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
              className="h-8 w-16 rounded-md border border-input bg-transparent px-2 text-sm"
            />
            <Button variant="ghost" size="sm" onClick={() => removeItem(item.productId)}>
              {t("remove")}
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t("subtotal")}</span>
        <span className="text-lg font-medium">{formatMoney(subtotal, currency, locale)}</span>
      </div>

      <Link href={`/${locale}/checkout`} className={buttonVariants({ size: "lg", className: "self-end" })}>
        {t("checkout")}
      </Link>
    </div>
  );
}
