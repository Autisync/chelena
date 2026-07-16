import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validation/checkout";
import { rateLimit } from "@/lib/rate-limit";

// Business logic (stock check, price snapshot, order_number/tracking_token
// generation) lives entirely in the create_order() Postgres function (hard
// rule #3) — this route is just validation + rate limiting + the RPC call,
// never trusting client-supplied prices or product names.
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`checkout:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  if (input.website) {
    // Honeypot tripped — pretend success so the bot doesn't learn anything,
    // but do nothing.
    return NextResponse.json({ order_number: "CH-0000-000000", tracking_token: crypto.randomUUID() });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_order", {
    p_country: input.country,
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
    // The generated Args type marks these `string` (not `string | null`) —
    // Postgres's function-arg introspection doesn't surface nullability for
    // params without a DEFAULT, even though create_order() handles NULL fine
    // (see migration 003/005: p_customer_email/p_notes are only ever read,
    // never assumed non-null).
    p_customer_email: (input.customerEmail || null) as string,
    p_preferred_channel: input.preferredChannel,
    p_pickup_point_id: input.pickupPointId,
    p_notes: (input.notes || null) as string,
    p_items: input.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  const order = data?.[0];
  return NextResponse.json({ order_number: order?.order_number, tracking_token: order?.tracking_token });
}
