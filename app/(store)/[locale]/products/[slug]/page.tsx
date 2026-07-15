import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { COUNTRY_COOKIE, isCountry } from "@/lib/country";
import { productImageUrl } from "@/lib/images/url";
import { formatMoney } from "@/lib/currency";

// PDP is per-country (price/stock) so it can't be fully static, but the
// product content itself changes rarely — ISR keeps rebuilds cheap while
// still reading the country cookie per request for pricing.
export const revalidate = 300;

async function getProduct(slug: string, country: "AO" | "PT") {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select(
      "*, product_country!inner(*), product_images(*), reviews(rating, is_approved)"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("product_country.country", country)
    .single();
  return product;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const rawCountry = cookieStore.get(COUNTRY_COOKIE)?.value;
  const country = isCountry(rawCountry) ? rawCountry : "PT";
  const product = await getProduct(slug, country);
  if (!product) return {};

  return {
    title: product.seo_title || product.name,
    description: product.seo_description || product.description_pt || undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PDP");

  const cookieStore = await cookies();
  const rawCountry = cookieStore.get(COUNTRY_COOKIE)?.value;
  const country = isCountry(rawCountry) ? rawCountry : "PT";

  const product = await getProduct(slug, country);
  if (!product) notFound();

  const pc = product.product_country[0];
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order
  );
  const inStock = pc.stock > 0;
  const description = locale === "en" ? product.description_en : product.description_pt;

  type ReviewRow = { rating: number; is_approved: boolean };
  const approvedReviews = ((product.reviews ?? []) as ReviewRow[]).filter((r) => r.is_approved);
  const avgRating = approvedReviews.length
    ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
    : null;

  const supabase = await createClient();
  const { data: related } = product.category_id
    ? await supabase
        .from("products")
        .select("slug, name, brand, product_country!inner(country, price, currency, stock, is_visible), product_images(storage_path_card, is_primary, sort_order)")
        .eq("category_id", product.category_id)
        .eq("is_active", true)
        .eq("product_country.country", country)
        .eq("product_country.is_visible", true)
        .neq("id", product.id)
        .limit(4)
    : { data: null };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: description ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: images[0] ? productImageUrl(images[0].storage_path_detail) : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: pc.currency,
      price: pc.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(avgRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: approvedReviews.length,
      },
    }),
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="grid grid-cols-4 gap-2 lg:grid-cols-1">
          {images.length ? (
            images.slice(0, 1).map((image) => (
              <div key={image.id} className="col-span-4 aspect-square overflow-hidden rounded-xl bg-muted lg:col-span-1">
                <Image
                  src={productImageUrl(image.storage_path_detail)}
                  alt={image.alt_text ?? product.name}
                  width={1200}
                  height={1200}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="col-span-4 flex aspect-square items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground lg:col-span-1">
              Sem imagem
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {product.brand && <span className="text-sm text-muted-foreground">{product.brand}</span>}
          <h1 className="font-heading text-3xl font-medium">{product.name}</h1>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl">{formatMoney(pc.price, pc.currency, locale)}</span>
            {pc.compare_at_price && (
              <span className="text-muted-foreground line-through">
                {formatMoney(pc.compare_at_price, pc.currency, locale)}
              </span>
            )}
          </div>
          <span
            className={
              inStock
                ? "w-fit rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success"
                : "w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
            }
          >
            {inStock ? t("inStock") : t("outOfStock")}
          </span>
          {description && (
            <div>
              <h2 className="mb-1 text-sm font-medium">{t("descriptionTitle")}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{description}</p>
            </div>
          )}
        </div>
      </div>

      {!!related?.length && (
        <section className="mt-16">
          <h2 className="mb-4 font-heading text-xl font-medium">{t("relatedTitle")}</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((r) => {
              const rpc = r.product_country?.[0];
              const rImage = [...(r.product_images ?? [])].sort(
                (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order
              )[0];
              return (
                <a key={r.slug} href={`/${locale}/products/${r.slug}`} className="flex flex-col gap-1.5">
                  <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                    {rImage && (
                      <Image
                        src={productImageUrl(rImage.storage_path_card)}
                        alt={r.name}
                        width={600}
                        height={600}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <span className="text-sm font-medium">{r.name}</span>
                  {rpc && <span className="text-sm">{formatMoney(rpc.price, rpc.currency, locale)}</span>}
                </a>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
