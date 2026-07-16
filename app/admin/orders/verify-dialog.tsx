"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { advanceOrderStatus } from "@/app/admin/orders/actions";

// Verifying requires pickup date + payment instructions (PRD) — a small
// inline form rather than a full modal component library, to keep this
// admin-only surface simple.
export function VerifyDialog({ orderId, defaultTemplate }: { orderId: string; defaultTemplate: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Verificar
      </Button>
    );
  }

  return (
    <form
      action={async (formData) => {
        setPending(true);
        await advanceOrderStatus({
          orderId,
          newStatus: "verified",
          pickupDate: String(formData.get("pickupDate")),
          paymentInstructions: String(formData.get("paymentInstructions")),
        });
        setPending(false);
        setOpen(false);
      }}
      className="mt-2 flex flex-col gap-2 rounded-md border bg-muted/40 p-3"
    >
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Data de levantamento</Label>
        <Input type="date" name="pickupDate" required className="h-8" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Instruções de pagamento</Label>
        <Textarea name="paymentInstructions" required rows={3} defaultValue={defaultTemplate} className="text-xs" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "A confirmar…" : "Confirmar verificação"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
