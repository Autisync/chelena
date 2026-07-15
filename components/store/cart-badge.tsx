"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart/use-cart";

export function CartBadge({ locale }: { locale: string }) {
  const { itemCount } = useCart();
  const t = useTranslations("Nav");

  return (
    <Link href={`/${locale}/cart`} className="relative text-muted-foreground hover:text-foreground">
      {t("cart")}
      {itemCount > 0 && (
        <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
