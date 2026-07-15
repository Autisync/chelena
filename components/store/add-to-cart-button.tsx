"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart/use-cart";
import type { Country } from "@/lib/country";

export function AddToCartButton({
  productId,
  slug,
  name,
  price,
  currency,
  imagePath,
  stock,
  country,
}: {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  imagePath: string | null;
  stock: number;
  country: Country;
}) {
  const { addItem, country: cartCountry, items } = useCart();
  const t = useTranslations("PDP");
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (cartCountry && cartCountry !== country && items.length) {
      const confirmed = window.confirm(
        country === "AO"
          ? "O seu carrinho tem produtos de Portugal. Ao adicionar este produto de Angola, o carrinho será esvaziado. Continuar?"
          : "O seu carrinho tem produtos de Angola. Ao adicionar este produto de Portugal, o carrinho será esvaziado. Continuar?"
      );
      if (!confirmed) return;
    }
    addItem({ productId, slug, name, price, currency, quantity: 1, imagePath, stock }, country);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button size="lg" disabled={stock <= 0} onClick={handleAdd} className="w-fit">
      {added ? "✓" : t("addToCart")}
    </Button>
  );
}
