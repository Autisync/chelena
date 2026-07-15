import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { COUNTRY_COOKIE, isCountry } from "@/lib/country";
import { ProductCard } from "@/components/store/product-card";
import { ProductFilters } from "@/components/store/product-filters";

// This page reads the country cookie server-side (unlike the home page) —
// results are inherently per-country, so there's nothing to gain from ISR
// here; `cookies()` forcing dynamic rendering is the right tradeoff.
export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; brand?: string; sort?: string; inStock?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const filters = await searchParams;
  const t = await getTranslations("Products");

  const cookieStore = await cookies();
  const rawCountry = cookieStore.get(COUNTRY_COOKIE)?.value;
  const country = isCountry(rawCountry) ? rawCountry : "PT";

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name_pt, name_en")
    .order("sort_order");

  let query = supabase
    .from("products")
    .select(
      "slug, name, brand, category_id, product_country!inner(country, price, compare_at_price, currency, stock, is_visible), product_images(storage_path_card, alt_text, is_primary, sort_order)"
    )
    .eq("is_active", true)
    .eq("product_country.country", country)
    .eq("product_country.is_visible", true);

  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.brand) query = query.eq("brand", filters.brand);

  const { data: products } = await query;

  let rows = (products ?? []).map((p) => {
    const pc = p.product_country?.[0];
    const images = [...(p.product_images ?? [])].sort(
      (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    return {
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      price: pc?.price ?? 0,
      compareAtPrice: pc?.compare_at_price ?? null,
      currency: pc?.currency ?? (country === "AO" ? "AOA" : "EUR"),
      stock: pc?.stock ?? 0,
      imagePath: images[0]?.storage_path_card ?? null,
      imageAlt: images[0]?.alt_text ?? null,
    };
  });

  if (filters.inStock === "1") rows = rows.filter((r) => r.stock > 0);
  if (filters.sort === "price_asc") rows = [...rows].sort((a, b) => a.price - b.price);
  if (filters.sort === "price_desc") rows = [...rows].sort((a, b) => b.price - a.price);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-4 font-heading text-3xl font-medium">{t("title")}</h1>
      <ProductFilters categories={categories ?? []} locale={locale} />

      {!rows.length ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {rows.map((product) => (
            <ProductCard key={product.slug} product={product} locale={locale} />
          ))}
        </div>
      )}
    </main>
  );
}
