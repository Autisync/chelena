import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";
import { sendEmailMessage } from "@/lib/notifications/email";
import type { TemplateKey } from "@/lib/notifications/templates";

const MAX_ATTEMPTS = 3;

// Dispatches every queued notification. Retry (max 3 attempts) + channel
// fallback per hard rule #6: after 2 failed WhatsApp attempts, the next try
// switches to email — matches docs/03-architecture.md "Email ... used ...
// as fallback after 2 failed WhatsApp attempts."
export async function dispatchQueuedNotifications() {
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("notifications")
    .select("id, order_id, channel, template_key, payload, attempts")
    .eq("status", "queued")
    .lt("attempts", MAX_ATTEMPTS);

  const results = [];
  for (const row of rows ?? []) {
    results.push(await dispatchOne(supabase, row));
  }
  return results;
}

async function dispatchOne(
  supabase: ReturnType<typeof createAdminClient>,
  row: {
    id: number;
    order_id: string | null;
    channel: string;
    template_key: string;
    payload: unknown;
    attempts: number | null;
  }
) {
  const attempts = (row.attempts ?? 0) + 1;

  if (!row.order_id) return { id: row.id, ok: false, error: "no order_id" };
  const { data: order } = await supabase
    .from("orders")
    .select("customer_name, customer_phone, customer_email, pickup_points(name, hours)")
    .eq("id", row.order_id)
    .single();
  if (!order) return { id: row.id, ok: false, error: "order not found" };

  const rowPayload = row.payload as Record<string, unknown>;
  const payload = {
    customerName: order.customer_name,
    orderNumber: rowPayload.order_number,
    pickupDate: rowPayload.pickup_date,
    paymentInstructions: rowPayload.payment_instructions,
    pickupPointName: order.pickup_points?.name,
    pickupPointHours: order.pickup_points?.hours,
    googleReviewUrl: rowPayload.google_review_url,
  };
  const templateKey = row.template_key as TemplateKey;

  try {
    const target = row.channel === "whatsapp" ? order.customer_phone : order.customer_email;
    if (!target) throw new Error(`no ${row.channel} address on order`);

    const { providerMessageId } =
      row.channel === "whatsapp"
        ? await sendWhatsAppMessage(target, templateKey, payload)
        : await sendEmailMessage(target, templateKey, payload);

    await supabase
      .from("notifications")
      .update({ status: "sent", provider_message_id: providerMessageId, attempts, sent_at: new Date().toISOString(), error: null })
      .eq("id", row.id);

    return { id: row.id, ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const fallbackToEmail = row.channel === "whatsapp" && attempts >= 2;
    const nextChannel: "whatsapp" | "email" = fallbackToEmail ? "email" : (row.channel as "whatsapp" | "email");
    const exhausted = attempts >= MAX_ATTEMPTS;

    await supabase
      .from("notifications")
      .update({
        status: exhausted ? "failed" : "queued",
        channel: nextChannel,
        attempts,
        error: message,
      })
      .eq("id", row.id);

    return { id: row.id, ok: false, error: message };
  }
}
