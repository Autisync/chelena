import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, brand, is_active, product_country(country, price, currency, stock)")
    .order("created_at", { ascending: false });

  return (
    <main className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <Link href="/admin/products/new" className={buttonVariants()}>
          Novo produto
        </Link>
      </div>

      {!products?.length ? (
        <p className="text-muted-foreground">Ainda não há produtos. Crie o primeiro.</p>
      ) : (
        <div className="overflow-hidden rounded-md border bg-background">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Marca</th>
                <th className="p-3 font-medium">AO</th>
                <th className="p-3 font-medium">PT</th>
                <th className="p-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const ao = product.product_country?.find((c) => c.country === "AO");
                const pt = product.product_country?.find((c) => c.country === "PT");
                return (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <Link href={`/admin/products/${product.id}`} className="font-medium hover:underline">
                        {product.name}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{product.brand ?? "—"}</td>
                    <td className="p-3">{ao ? `${ao.price} ${ao.currency} · ${ao.stock} un.` : "—"}</td>
                    <td className="p-3">{pt ? `${pt.price} ${pt.currency} · ${pt.stock} un.` : "—"}</td>
                    <td className="p-3">{product.is_active ? "Ativo" : "Inativo"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
