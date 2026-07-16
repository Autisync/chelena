import { createClient } from "@/lib/supabase/server";
import { OrderCard } from "@/app/admin/orders/order-card";

const COLUMNS = [
  { status: "pending_review", label: "Por verificar" },
  { status: "verified", label: "Verificado" },
  { status: "awaiting_payment", label: "Aguarda pagamento" },
  { status: "paid", label: "Pago" },
  { status: "preparing", label: "Em preparação" },
  { status: "ready_for_pickup", label: "Pronto" },
  { status: "completed", label: "Concluído" },
] as const;

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const [{ data: orders }, { data: settingsRow }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, subtotal, currency, status, created_at, country")
      .neq("status", "cancelled")
      .order("created_at", { ascending: true }),
    supabase.from("settings").select("value").eq("key", "payment_templates").maybeSingle(),
  ]);

  const paymentTemplates = (settingsRow?.value as Record<string, string> | null) ?? {};

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Encomendas</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnOrders = (orders ?? []).filter((o) => o.status === column.status);
          return (
            <div key={column.status} className="flex w-72 shrink-0 flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-medium">{column.label}</h2>
                <span className="text-xs text-muted-foreground">{columnOrders.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {columnOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    paymentTemplate={paymentTemplates[order.country] ?? ""}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
