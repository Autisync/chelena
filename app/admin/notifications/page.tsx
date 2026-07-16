import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  queued: "Em fila",
  sent: "Enviado",
  delivered: "Entregue",
  failed: "Falhou",
};

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, order_id, channel, template_key, status, attempts, error, created_at, sent_at, orders(order_number)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Notificações</h1>
      <div className="overflow-hidden rounded-md border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Encomenda</th>
              <th className="p-3 font-medium">Canal</th>
              <th className="p-3 font-medium">Template</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3 font-medium">Tentativas</th>
              <th className="p-3 font-medium">Erro</th>
            </tr>
          </thead>
          <tbody>
            {(notifications ?? []).map((n) => (
              <tr key={n.id} className="border-b last:border-0">
                <td className="p-3">{n.orders?.order_number ?? "—"}</td>
                <td className="p-3">{n.channel}</td>
                <td className="p-3">{n.template_key}</td>
                <td className="p-3">
                  <span
                    className={
                      n.status === "sent" || n.status === "delivered"
                        ? "rounded-full bg-success/15 px-2 py-0.5 text-xs text-success"
                        : n.status === "failed"
                          ? "rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive"
                          : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    }
                  >
                    {STATUS_LABEL[n.status] ?? n.status}
                  </span>
                </td>
                <td className="p-3">{n.attempts}</td>
                <td className="max-w-xs truncate p-3 text-xs text-muted-foreground">{n.error ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
