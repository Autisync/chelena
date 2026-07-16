import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/currency";
import { ReviewForm } from "@/components/store/review-form";

const STATUS_STEPS = [
  "pending_review",
  "verified",
  "awaiting_payment",
  "paid",
  "preparing",
  "ready_for_pickup",
  "completed",
] as const;

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ token: string; locale: string }>;
}) {
  const { token, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Tracking");

  const supabase = await createClient();
  const { data: orders } = await supabase.rpc("get_order_by_token", { p_tracking_token: token });
  const order = orders?.[0];
  if (!order) notFound();

  // order_items has no RLS policy that lets a guest (user_id = null) read
  // their own rows directly — same token-scoped SECURITY DEFINER pattern as
  // get_order_by_token, see migration 006 for why.
  const { data: items } = await supabase.rpc("get_order_items_by_token", { p_tracking_token: token });

  const isCancelled = order.status === "cancelled";
  const currentStepIndex = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 font-heading text-3xl font-medium">{t("title")}</h1>
      <p className="mb-8 text-muted-foreground">{order.order_number}</p>

      {isCancelled ? (
        <p className="mb-8 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t("cancelled")}
          {order.cancelled_reason ? `: ${order.cancelled_reason}` : ""}
        </p>
      ) : (
        <ol className="mb-8 flex flex-col gap-2">
          {STATUS_STEPS.map((step, i) => (
            <li
              key={step}
              className={`flex items-center gap-3 text-sm ${
                i <= currentStepIndex ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <span
                className={`size-2 rounded-full ${i <= currentStepIndex ? "bg-primary" : "bg-border"}`}
              />
              {t(`status.${step}`)}
            </li>
          ))}
        </ol>
      )}

      {order.pickup_date && (
        <p className="mb-4 text-sm">
          {t("pickupDate")}: <strong>{order.pickup_date}</strong>
        </p>
      )}
      {order.payment_instructions && (
        <div className="mb-4 rounded-lg bg-muted p-4 text-sm whitespace-pre-line">
          {order.payment_instructions}
        </div>
      )}

      <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {(items ?? []).map((item, i) => (
          <div key={i} className="flex justify-between p-3 text-sm">
            <span>
              {item.product_name} × {item.quantity}
            </span>
            <span>{formatMoney(item.unit_price * item.quantity, order.currency, locale)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-sm font-medium">
        <span>{t("subtotal")}</span>
        <span>{formatMoney(order.subtotal, order.currency, locale)}</span>
      </div>

      {order.status === "completed" && !!items?.length && (
        <section className="mt-10">
          <h2 className="mb-3 font-heading text-lg font-medium">{t("reviewsTitle")}</h2>
          <div className="flex flex-col gap-3">
            {items.map((item) =>
              item.product_id ? (
                <ReviewForm
                  key={item.product_id}
                  trackingToken={token}
                  productId={item.product_id}
                  productName={item.product_name}
                />
              ) : null
            )}
          </div>
        </section>
      )}
    </main>
  );
}
