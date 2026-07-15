import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/app/admin/products/product-form";
import { updateProduct } from "@/app/admin/products/actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, product_country(*)")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const countries: Record<string, unknown> = {};
  for (const row of product.product_country ?? []) {
    countries[row.country] = {
      currency: row.currency,
      price: row.price,
      compareAtPrice: row.compare_at_price,
      stock: row.stock,
      isVisible: row.is_visible,
    };
  }

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Editar produto</h1>
      <ProductForm
        action={updateProduct.bind(null, id)}
        submitLabel="Guardar alterações"
        defaultValues={{
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          descriptionPt: product.description_pt,
          descriptionEn: product.description_en,
          tags: product.tags ?? [],
          seoTitle: product.seo_title,
          seoDescription: product.seo_description,
          isActive: product.is_active,
          countries: countries as never,
        }}
      />
    </main>
  );
}
