"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/store/product-card";
import { COUNTRY_COOKIE, isCountry, type Country } from "@/lib/country";

type FeaturedProduct = {
  slug: string;
  name: string;
  brand: string | null;
  imagePath: string | null;
  imageAlt: string | null;
  pricing: Partial<
    Record<Country, { price: number; compareAtPrice: number | null; currency: string; stock: number }>
  >;
};

function readCountryCookie(): Country {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COUNTRY_COOKIE}=([^;]+)`));
  const value = match?.[1];
  return isCountry(value) ? value : "PT";
}

const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Client island for the same reason as HomeBanner/CountrySwitcher: featured
// products are country-priced, and reading the country cookie server-side
// would force this ISR page fully dynamic (see docs/DECISIONS.md /
// STATUS.md's "cookie-aware client kills ISR" lesson). The server passes
// down pricing for both countries; this just picks the right one.
export function FeaturedProducts({ products, locale }: { products: FeaturedProduct[]; locale: string }) {
  const country = useSyncExternalStore(subscribe, readCountryCookie, () => "PT" as Country);
  const t = useTranslations("Home");

  const visible = products
    .filter((p) => p.pricing[country])
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      imagePath: p.imagePath,
      imageAlt: p.imageAlt,
      ...p.pricing[country]!,
    }));

  if (!visible.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="mb-6 font-heading text-2xl font-medium">{t("featuredTitle")}</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {visible.map((product) => (
          <ProductCard key={product.slug} product={product} locale={locale} />
        ))}
      </div>
    </section>
  );
}
