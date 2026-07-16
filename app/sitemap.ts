import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { routing } from "@/i18n/routing";

// Public client (no cookies) — this route has no per-request personalization
// and should stay cacheable, same reasoning as the home page (see
// docs/DECISIONS.md / STATUS.md for the ISR-breaking regression this avoids).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = createPublicClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("is_active", true),
    supabase.from("categories").select("id"),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    entries.push({ url: `${baseUrl}/${locale}`, changeFrequency: "daily", priority: 1 });
    entries.push({ url: `${baseUrl}/${locale}/products`, changeFrequency: "daily", priority: 0.9 });

    for (const product of products ?? []) {
      entries.push({
        url: `${baseUrl}/${locale}/products/${product.slug}`,
        lastModified: product.updated_at ?? undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const category of categories ?? []) {
      entries.push({
        // Matches the category-filter link shape used on the home page
        // (products page filters by category_id, not slug — see
        // docs/DECISIONS.md).
        url: `${baseUrl}/${locale}/products?category=${category.id}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
