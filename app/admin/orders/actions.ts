"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dispatchQueuedNotifications } from "@/lib/notifications/dispatch";

type AdvanceArgs = {
  orderId: string;
  newStatus: string;
  pickupDate?: string;
  paymentInstructions?: string;
  paymentMethod?: string;
  paymentReference?: string;
  cancelledReason?: string;
};

export async function advanceOrderStatus(args: AdvanceArgs) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_order_status", {
    p_order_id: args.orderId,
    // Cast: the enum is validated by Postgres itself (invalid values 42804
    // out of this RPC) — args.newStatus always comes from a fixed set of
    // buttons/selects in this file's callers, never free user text.
    p_new_status: args.newStatus as never,
    p_pickup_date: args.pickupDate || undefined,
    p_payment_instructions: args.paymentInstructions || undefined,
    p_payment_method: args.paymentMethod || undefined,
    p_payment_reference: args.paymentReference || undefined,
    p_cancelled_reason: args.cancelledReason || undefined,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");

  dispatchQueuedNotifications().catch((err) => console.error("notification dispatch failed", err));
}
