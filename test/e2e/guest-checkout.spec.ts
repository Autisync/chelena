import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Golden path per hard rule #10: browse → cart → checkout (guest). Runs
// against the real linked Supabase project (not a mock DB) — see
// playwright.config.ts. Cleans up the order it creates so repeated runs
// don't pollute the dashboard/order board with test data.
const PRODUCT_SLUG = "creme-hidratante-facial";

test("guest can browse, add to cart, and check out", async ({ page }) => {
  await page.goto(`/pt/products/${PRODUCT_SLUG}`);

  // Fresh cart for a deterministic test.
  await page.evaluate(() => localStorage.removeItem("chelena_cart"));
  await page.evaluate(() => {
    document.cookie = "chelena_country=PT; path=/";
  });
  await page.reload();

  await expect(page.getByRole("heading", { name: "Creme Hidratante Facial" })).toBeVisible();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("chelena_cart")))
    .toContain(PRODUCT_SLUG);

  await page.goto("/pt/checkout");
  await page.getByLabel("Nome completo").fill("Playwright Teste");
  await page.getByPlaceholder("+351911111111").fill("+351912345678");
  // Pickup point <select> has no accessible label wired to it yet — select
  // by role instead of getByLabel (see docs/DECISIONS.md if this becomes a
  // recurring pattern worth fixing at the component level).
  const pickupSelect = page.locator("#pickupPointId");
  await pickupSelect.selectOption({ index: 0 });

  await page.getByRole("button", { name: "Confirmar encomenda" }).click();

  await expect(page).toHaveURL(/\/pt\/orders\/[0-9a-f-]{36}/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Acompanhar encomenda" })).toBeVisible();
  await expect(page.getByText(/CH-\d{4}-\d{6}/)).toBeVisible();

  // Cleanup: delete the order this test just created and restore the stock
  // create_order() decremented (service role) — keeps repeated runs from
  // slowly draining the seed data's stock or polluting the admin order board.
  const trackingToken = page.url().split("/orders/")[1];
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: order } = await admin.from("orders").select("id").eq("tracking_token", trackingToken).single();
  if (order) {
    const { data: product } = await admin.from("products").select("id").eq("slug", PRODUCT_SLUG).single();
    if (product) {
      const { data: pc } = await admin
        .from("product_country")
        .select("stock")
        .eq("product_id", product.id)
        .eq("country", "PT")
        .single();
      if (pc) {
        await admin
          .from("product_country")
          .update({ stock: pc.stock + 1 })
          .eq("product_id", product.id)
          .eq("country", "PT");
      }
    }
    await admin.from("notifications").delete().eq("order_id", order.id);
    await admin.from("orders").delete().eq("id", order.id);
  }
});
