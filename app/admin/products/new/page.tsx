import { ProductForm } from "@/app/admin/products/product-form";
import { createProduct } from "@/app/admin/products/actions";

export default function NewProductPage() {
  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Novo produto</h1>
      <ProductForm action={createProduct} submitLabel="Criar produto" />
    </main>
  );
}
