import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/currency";

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Por verificar",
  verified: "Verificado",
  awaiting_payment: "Aguarda pagamento",
  paid: "Pago",
  preparing: "Em preparação",
  ready_for_pickup: "Pronto",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const LOW_STOCK_THRESHOLD = 5;

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ data: orders }, { data: lowStock }, { data: orderItems }] = await Promise.all([
    supabase.from("orders").select("status, country, subtotal, currency"),
    supabase
      .from("product_country")
      .select("stock, country, products(name)")
      .lt("stock", LOW_STOCK_THRESHOLD)
      .eq("is_visible", true)
      .order("stock"),
    supabase.from("order_items").select("product_name, quantity"),
  ]);

  const byStatus = new Map<string, number>();
  const revenueByCountry = new Map<string, { total: number; currency: string }>();
  for (const order of orders ?? []) {
    byStatus.set(order.status, (byStatus.get(order.status) ?? 0) + 1);
    if (order.status !== "cancelled" && order.status !== "pending_review") {
      const existing = revenueByCountry.get(order.country) ?? { total: 0, currency: order.currency };
      existing.total += order.subtotal;
      revenueByCountry.set(order.country, existing);
    }
  }

  const topProducts = new Map<string, number>();
  for (const item of orderItems ?? []) {
    topProducts.set(item.product_name, (topProducts.get(item.product_name) ?? 0) + item.quantity);
  }
  const topProductsList = [...topProducts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Encomendas por estado</h2>
          <div className="flex flex-col gap-1 text-sm">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <div key={status} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{byStatus.get(status) ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Receita por país</h2>
          <div className="flex flex-col gap-1 text-sm">
            {[...revenueByCountry.entries()].map(([country, { total, currency }]) => (
              <div key={country} className="flex justify-between">
                <span className="text-muted-foreground">{country}</span>
                <span className="font-medium">{formatMoney(total, currency, "pt")}</span>
              </div>
            ))}
            {!revenueByCountry.size && <span className="text-muted-foreground">Sem dados ainda.</span>}
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Stock baixo (&lt;{LOW_STOCK_THRESHOLD})</h2>
          <div className="flex flex-col gap-1 text-sm">
            {(lowStock ?? []).map((row, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">
                  {row.products?.name} ({row.country})
                </span>
                <span className="font-medium text-destructive">{row.stock}</span>
              </div>
            ))}
            {!lowStock?.length && <span className="text-muted-foreground">Nenhum produto com stock baixo.</span>}
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Produtos mais vendidos</h2>
          <div className="flex flex-col gap-1 text-sm">
            {topProductsList.map(([name, qty]) => (
              <div key={name} className="flex justify-between">
                <span className="text-muted-foreground">{name}</span>
                <span className="font-medium">{qty}</span>
              </div>
            ))}
            {!topProductsList.length && <span className="text-muted-foreground">Sem vendas ainda.</span>}
          </div>
        </div>
      </div>
    </main>
  );
}
