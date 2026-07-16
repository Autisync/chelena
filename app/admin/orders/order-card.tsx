"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/currency";
import { advanceOrderStatus } from "@/app/admin/orders/actions";
import { VerifyDialog } from "@/app/admin/orders/verify-dialog";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  currency: string;
  status: string;
  created_at: string | null;
};

const NEXT_STATUS: Record<string, string | null> = {
  verified: "awaiting_payment",
  awaiting_payment: "paid",
  paid: "preparing",
  preparing: "ready_for_pickup",
  ready_for_pickup: "completed",
};

const NEXT_LABEL: Record<string, string> = {
  awaiting_payment: "Marcar aguarda pagamento",
  paid: "Marcar como pago",
  preparing: "Iniciar preparação",
  ready_for_pickup: "Marcar pronto",
  completed: "Concluir",
};

export function OrderCard({ order, paymentTemplate }: { order: Order; paymentTemplate: string }) {
  const [pending, setPending] = useState(false);
  const nextStatus = NEXT_STATUS[order.status];

  async function advance(newStatus: string) {
    setPending(true);
    await advanceOrderStatus({ orderId: order.id, newStatus });
    setPending(false);
  }

  async function cancel() {
    const reason = window.prompt("Motivo do cancelamento:");
    if (reason === null) return;
    setPending(true);
    await advanceOrderStatus({ orderId: order.id, newStatus: "cancelled", cancelledReason: reason });
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-background p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{order.order_number}</span>
        <span className="text-muted-foreground">{formatMoney(order.subtotal, order.currency, "pt")}</span>
      </div>
      <span className="text-muted-foreground">{order.customer_name}</span>
      <span className="text-xs text-muted-foreground">{order.customer_phone}</span>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {order.status === "pending_review" && (
          <VerifyDialog orderId={order.id} defaultTemplate={paymentTemplate} />
        )}
        {nextStatus && (
          <Button size="sm" disabled={pending} onClick={() => advance(nextStatus)}>
            {NEXT_LABEL[nextStatus]}
          </Button>
        )}
        {order.status !== "completed" && order.status !== "cancelled" && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={cancel}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
