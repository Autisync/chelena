import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { COUNTRY_COOKIE, isCountry } from "@/lib/country";
import { productImageUrl } from "@/lib/images/url";
import { formatMoney } from "@/lib/currency";
import { localeAlternates } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { ProductGallery } from "@/components/store/product-gallery";

// PDP is per-country (price/stock) so it can't be fully static, but the
// product content itself changes rarely — ISR keeps rebuilds cheap while
// still reading the country cookie per request for pricing.
export const revalidate = 300;

async function getProduct(slug: string, country: "AO" | "PT") {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select(
      "*, product_country!inner(*), product_images(*), reviews(id, rating, is_approved, customer_name, body, created_at)"
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

  const primaryImage = [...(product.product_images ?? [])].sort(
    (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
  )[0];
  const title = product.seo_title || product.name;
  const description = product.seo_description || product.description_pt || undefined;

  return {
    title,
    description,
    alternates: localeAlternates(`/products/${slug}`),
    openGraph: primaryImage
      ? { title, description, images: [productImageUrl(primaryImage.storage_path_detail)] }
      : undefined,
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
    (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  const inStock = pc.stock > 0;
  const description = locale === "en" ? product.description_en : product.description_pt;

  type ReviewRow = {
    id: string;
    rating: number;
    is_approved: boolean;
    customer_name: string;
    body: string | null;
    created_at: string | null;
  };
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const breadcrumb = breadcrumbJsonLd([
    { name: "Chelena", url: `${baseUrl}/${locale}` },
    { name: "Produtos", url: `${baseUrl}/${locale}/products` },
    { name: product.name, url: `${baseUrl}/${locale}/products/${slug}` },
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={images} productName={product.name} />

        <div className="flex flex-col gap-4">
          {product.brand && <span className="text-sm text-muted-foreground">{product.brand}</span>}
          <h1 className="font-heading text-3xl font-medium">{product.name}</h1>
          {avgRating && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="text-accent">★</span>
              {avgRating.toFixed(1)} ({approvedReviews.length})
            </div>
          )}
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
          <AddToCartButton
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={pc.price}
            currency={pc.currency}
            imagePath={images[0]?.storage_path_card ?? null}
            stock={pc.stock}
            country={country}
          />
          {description && (
            <div>
              <h2 className="mb-1 text-sm font-medium">{t("descriptionTitle")}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{description}</p>
            </div>
          )}
        </div>
      </div>

      {!!approvedReviews.length && (
        <section className="mt-16 max-w-2xl">
          <h2 className="mb-4 font-heading text-xl font-medium">{t("reviewsTitle")}</h2>
          <div className="flex flex-col gap-4">
            {approvedReviews.map((review) => (
              <div key={review.id} className="border-b border-border pb-4 last:border-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-accent">{"★".repeat(review.rating)}</span>
                  <span className="text-sm font-medium">{review.customer_name}</span>
                  {/* Every review here is inherently a verified purchase — the
                      only path to create one is app/api/reviews/route.ts,
                      which requires order.status = 'completed' and the
                      product to be in that order's items (see the route's
                      comment). No separate "verified" column to check. */}
                  <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">
                    {t("verifiedPurchase")}
                  </span>
                </div>
                {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {!!related?.length && (
        <section className="mt-16">
          <h2 className="mb-4 font-heading text-xl font-medium">{t("relatedTitle")}</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((r) => {
              const rpc = r.product_country?.[0];
              const rImage = [...(r.product_images ?? [])].sort(
                (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
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
