import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Covers the review flow (hard rule #10's third bullet: "review submit +
// moderate"). Creates a real completed order directly via create_order +
// service-role status update (faster and more deterministic than driving
// checkout AND the — currently unbuildable without admin login — verify/
// advance flow through the UI), then drives the actual review form through
// the browser.
const PRODUCT_SLUG = "batom-mate-terracota";

test("customer can submit a review on a completed order, and it renders once approved", async ({ page }) => {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: product } = await admin.from("products").select("id").eq("slug", PRODUCT_SLUG).single();
  const { data: pickupPoint } = await admin.from("pickup_points").select("id").eq("country", "PT").limit(1).single();

  const { data: orderResult, error: createError } = await admin.rpc("create_order", {
    p_country: "PT",
    p_customer_name: "Playwright Review Tester",
    p_customer_phone: "+351913334444",
    p_customer_email: null,
    p_preferred_channel: "whatsapp",
    p_pickup_point_id: pickupPoint!.id,
    p_notes: null,
    p_items: [{ product_id: product!.id, quantity: 1 }],
  });
  expect(createError).toBeNull();
  const order = orderResult![0];

  await admin.from("orders").update({ status: "completed" }).eq("id", order.order_id);

  try {
    await page.goto(`/pt/orders/${order.tracking_token}`);
    await expect(page.getByRole("heading", { name: "Avalie a sua compra" })).toBeVisible();

    // 5th star in the rating row for this product's review form.
    await page.getByRole("button", { name: "5 estrelas" }).click();
    await page.getByPlaceholder("Conte-nos a sua experiência (opcional)").fill("Excelente produto, chegou rápido!");
    await page.getByRole("button", { name: "Enviar avaliação" }).click();

    await expect(page.getByText("Obrigado pela sua avaliação!")).toBeVisible();

    // Approve it (simulating admin moderation) and confirm it renders on the PDP.
    await admin.from("reviews").update({ is_approved: true }).eq("order_id", order.order_id);
    await page.goto(`/pt/products/${PRODUCT_SLUG}`);
    await expect(page.getByText("Excelente produto, chegou rápido!")).toBeVisible();
  } finally {
    const { data: pc } = await admin
      .from("product_country")
      .select("stock")
      .eq("product_id", product!.id)
      .eq("country", "PT")
      .single();
    if (pc) {
      await admin
        .from("product_country")
        .update({ stock: pc.stock + 1 })
        .eq("product_id", product!.id)
        .eq("country", "PT");
    }
    await admin.from("reviews").delete().eq("order_id", order.order_id);
    await admin.from("notifications").delete().eq("order_id", order.order_id);
    await admin.from("orders").delete().eq("id", order.order_id);
  }
});
