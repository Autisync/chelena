import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/public";
import { buttonVariants } from "@/components/ui/button";
import { HomeBanner } from "@/components/store/home-banner";
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
  const [{ data: categories }, { data: heroBanners }] = await Promise.all([
    supabase.from("categories").select("id, slug, name_pt, name_en, image_path").order("sort_order"),
    supabase
      .from("banners")
      .select("id, title, target_url, country, product_images(storage_path_banner)")
      .eq("placement", "home_hero")
      .eq("is_active", true),
  ]);

  const banners = (heroBanners ?? [])
    .filter((b) => b.product_images?.storage_path_banner)
    .map((b) => ({
      id: b.id,
      title: b.title,
      target_url: b.target_url,
      country: b.country,
      storagePathBanner: b.product_images!.storage_path_banner as string,
    }));

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

      <GoogleRatingWidget />
    </main>
  );
}
