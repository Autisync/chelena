import { ProductForm } from "@/app/admin/products/product-form";
import { createProduct } from "@/app/admin/products/actions";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name_pt")
    .order("sort_order");

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Novo produto</h1>
      <ProductForm action={createProduct} submitLabel="Criar produto" categories={categories ?? []} />
    </main>
  );
}
