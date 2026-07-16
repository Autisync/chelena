import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviewSchema } from "@/lib/validation/review";
import { rateLimit } from "@/lib/rate-limit";

// Reviews are only insertable via this route (RLS has no anon/customer
// insert policy on `reviews` — see migration 002 comment) because the
// authorization check ("this order is completed AND actually contains this
// product") is business logic that belongs server-side, not in an RLS
// policy that can only see the row being inserted. Uses the service role
// deliberately, same reasoning as get_order_by_token: the tracking_token
// itself (random uuid, unguessable) is the authorization.
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await rateLimit(`review:${ip}`, 5, 60_000))) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  if (input.website) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_name, status")
    .eq("tracking_token", input.trackingToken)
    .single();

  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
  if (order.status !== "completed") {
    return NextResponse.json({ error: "order is not completed" }, { status: 403 });
  }

  const { data: item } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", order.id)
    .eq("product_id", input.productId)
    .maybeSingle();

  if (!item) {
    return NextResponse.json({ error: "product was not part of this order" }, { status: 403 });
  }

  const { error } = await supabase.from("reviews").insert({
    order_id: order.id,
    product_id: input.productId,
    customer_name: order.customer_name,
    rating: input.rating,
    body: input.body || null,
    is_approved: false,
  });

  if (error) {
    // unique (order_id, product_id) — one review per product per order.
    if (error.code === "23505") {
      return NextResponse.json({ error: "already reviewed" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: settingsRow } = await supabase.from("settings").select("value").eq("key", "google_place_id").maybeSingle();
  const placeId = settingsRow?.value && settingsRow.value !== "null" ? String(settingsRow.value).replace(/"/g, "") : null;
  const googleReviewUrl = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : null;

  return NextResponse.json({ ok: true, googleReviewUrl });
}
