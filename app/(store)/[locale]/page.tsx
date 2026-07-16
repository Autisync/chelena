import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/public";
import { buttonVariants } from "@/components/ui/button";
import { HomeBanner } from "@/components/store/home-banner";
import { FeaturedProducts } from "@/components/store/featured-products";
import { GoogleRatingWidget } from "@/components/store/google-rating-widget";
import { localeAlternates } from "@/lib/seo";

export const revalidate = 60; // ISR — home page

export const metadata: Metadata = {
  alternates: localeAlternates(""),
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  const supabase = createPublicClient();
  const [{ data: categories }, { data: heroBanners }, { data: stripBanners }, { data: featured }] =
    await Promise.all([
      supabase.from("categories").select("id, slug, name_pt, name_en, image_path").order("sort_order"),
      supabase
        .from("banners")
        .select("id, title, target_url, country, product_images(storage_path_banner)")
        .eq("placement", "home_hero")
        .eq("is_active", true),
      supabase
        .from("banners")
        .select("id, title, target_url, country, product_images(storage_path_banner)")
        .eq("placement", "home_strip")
        .eq("is_active", true),
      // "Featured" has no dedicated schema column — reusing the existing
      // `tags` text[] with a 'featured' tag, set by the admin per product,
      // rather than a migration for one flag (see docs/DECISIONS.md).
      supabase
        .from("products")
        .select(
          "slug, name, brand, tags, product_country(country, price, compare_at_price, currency, stock, is_visible), product_images(storage_path_card, alt_text, is_primary, sort_order)"
        )
        .eq("is_active", true)
        .contains("tags", ["featured"])
        .limit(8),
    ]);

  const mapBanners = (rows: typeof heroBanners) =>
    (rows ?? [])
      .filter((b) => b.product_images?.storage_path_banner)
      .map((b) => ({
        id: b.id,
        title: b.title,
        target_url: b.target_url,
        country: b.country,
        storagePathBanner: b.product_images!.storage_path_banner as string,
      }));

  const banners = mapBanners(heroBanners);
  const homeStripBanners = mapBanners(stripBanners);

  const featuredProducts = (featured ?? []).map((p) => {
    const images = [...(p.product_images ?? [])].sort(
      (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    const pricing: Record<string, { price: number; compareAtPrice: number | null; currency: string; stock: number }> = {};
    for (const pc of p.product_country ?? []) {
      if (!pc.is_visible) continue;
      pricing[pc.country] = {
        price: pc.price,
        compareAtPrice: pc.compare_at_price,
        currency: pc.currency,
        stock: pc.stock,
      };
    }
    return {
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      imagePath: images[0]?.storage_path_card ?? null,
      imageAlt: images[0]?.alt_text ?? null,
      pricing,
    };
  });

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-24 sm:py-32">
        <h1 className="max-w-2xl font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">{t("heroSubtitle")}</p>
        <Link href={`/${locale}/products`} className={buttonVariants({ size: "lg" })}>
          {t("heroCta")}
        </Link>
      </section>

      <HomeBanner banners={banners} placement="home_hero" />

      {!!categories?.length && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-6 font-heading text-2xl font-medium">{t("categoriesTitle")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/${locale}/products?category=${category.id}`}
                className="flex aspect-square items-center justify-center rounded-xl bg-muted p-4 text-center text-sm font-medium transition-colors hover:bg-muted/70"
              >
                {locale === "en" ? category.name_en ?? category.name_pt : category.name_pt}
              </Link>
            ))}
          </div>
        </section>
      )}

      <FeaturedProducts products={featuredProducts} locale={locale} />

      <HomeBanner banners={homeStripBanners} placement="home_strip" />

      <GoogleRatingWidget />
    </main>
  );
}
