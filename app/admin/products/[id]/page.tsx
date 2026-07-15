import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/app/admin/products/product-form";
import { updateProduct } from "@/app/admin/products/actions";
import { ImageUploader } from "@/components/admin/image-uploader";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, product_country(*), product_images(*)").eq("id", id).single(),
    supabase.from("categories").select("id, name_pt").order("sort_order"),
  ]);

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
        categories={categories ?? []}
        defaultValues={{
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          descriptionPt: product.description_pt,
          descriptionEn: product.description_en,
          categoryId: product.category_id,
          tags: product.tags ?? [],
          seoTitle: product.seo_title,
          seoDescription: product.seo_description,
          isActive: product.is_active ?? true,
          countries: countries as never,
        }}
      />

      <div className="mt-10 max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold">Imagens</h2>
        <ImageUploader productId={product.id} images={product.product_images ?? []} />
      </div>
    </main>
  );
}
