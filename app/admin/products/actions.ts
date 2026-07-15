"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validation/product";

// Both create and update rely on RLS (products_admin_all / product_country_admin_all
// via is_admin()) rather than the service role — the caller's own session is the
// authorization, which is the point of hard rule #3 ("never trust the client" cuts
// both ways: also never widen privilege beyond what the signed-in admin actually has).
function parseFormData(formData: FormData) {
  const countries: Record<string, unknown> = {};
  for (const country of ["AO", "PT"] as const) {
    if (formData.get(`countries.${country}.enabled`) !== "on") continue;
    countries[country] = {
      currency: formData.get(`countries.${country}.currency`),
      price: formData.get(`countries.${country}.price`),
      compareAtPrice: formData.get(`countries.${country}.compareAtPrice`) || null,
      stock: formData.get(`countries.${country}.stock`),
      isVisible: formData.get(`countries.${country}.isVisible`) === "on",
    };
  }

  return productSchema.parse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    brand: formData.get("brand") || null,
    descriptionPt: formData.get("descriptionPt") || null,
    descriptionEn: formData.get("descriptionEn") || null,
    categoryId: formData.get("categoryId") || null,
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    seoTitle: formData.get("seoTitle") || null,
    seoDescription: formData.get("seoDescription") || null,
    isActive: formData.get("isActive") === "on",
    countries,
  });
}

export async function createProduct(formData: FormData) {
  const input = parseFormData(formData);
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      slug: input.slug,
      name: input.name,
      brand: input.brand,
      description_pt: input.descriptionPt,
      description_en: input.descriptionEn,
      category_id: input.categoryId,
      tags: input.tags,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
      is_active: input.isActive,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await upsertCountryRows(supabase, product.id, input);

  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  const input = parseFormData(formData);
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      slug: input.slug,
      name: input.name,
      brand: input.brand,
      description_pt: input.descriptionPt,
      description_en: input.descriptionEn,
      category_id: input.categoryId,
      tags: input.tags,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
      is_active: input.isActive,
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  await upsertCountryRows(supabase, productId, input);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
}

async function upsertCountryRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  input: ReturnType<typeof productSchema.parse>
) {
  for (const country of ["AO", "PT"] as const) {
    const pricing = input.countries[country];
    if (!pricing) {
      await supabase
        .from("product_country")
        .delete()
        .eq("product_id", productId)
        .eq("country", country);
      continue;
    }

    const { error } = await supabase.from("product_country").upsert({
      product_id: productId,
      country,
      currency: pricing.currency,
      price: pricing.price,
      compare_at_price: pricing.compareAtPrice ?? null,
      stock: pricing.stock,
      is_visible: pricing.isVisible,
    });

    if (error) throw new Error(error.message);
  }
}
