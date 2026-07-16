// Automates the manual RLS checks recorded in test/integration/live-supabase.md
// against the real linked Supabase project (see .env.local — gitignored,
// never runs in CI without real credentials). Run with:
//   node --env-file=.env.local node_modules/.bin/vitest run test/integration/rls.test.ts
import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const skip = !url || !anonKey;
const anon = skip ? null : createClient(url!, anonKey!);

describe.skipIf(skip)("RLS policies (live project)", () => {
  it("allows anon to read public catalog tables", async () => {
    const { data, error } = await anon!.from("categories").select("slug").limit(1);
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it("allows anon to read active pickup points", async () => {
    const { data, error } = await anon!.from("pickup_points").select("id").limit(1);
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it("blocks anon from reading settings (admin-only)", async () => {
    const { data, error } = await anon!.from("settings").select("key");
    expect(error).toBeNull(); // RLS returns an empty set, not an error
    expect(data).toEqual([]);
  });

  it("blocks anon from reading notifications (admin-only)", async () => {
    const { data } = await anon!.from("notifications").select("id");
    expect(data).toEqual([]);
  });

  it("blocks anon from reading order_status_history (admin-only)", async () => {
    const { data } = await anon!.from("order_status_history").select("id");
    expect(data).toEqual([]);
  });

  it("blocks anon from inserting directly into orders (no insert policy — must use create_order RPC)", async () => {
    const { error } = await anon!.from("orders").insert({
      order_number: "SHOULD-NOT-EXIST",
      country: "PT",
      currency: "EUR",
      customer_name: "RLS Test",
      customer_phone: "+351900000000",
      subtotal: 0,
    });
    expect(error).not.toBeNull();
  });

  it("create_order rejects an empty cart", async () => {
    const { error } = await anon!.rpc("create_order", {
      p_country: "PT",
      p_customer_name: "RLS Test",
      p_customer_phone: "+351900000000",
      p_customer_email: null as unknown as string,
      p_preferred_channel: "whatsapp",
      p_pickup_point_id: null as unknown as string,
      p_notes: null as unknown as string,
      p_items: [],
    });
    expect(error).not.toBeNull();
    expect(error?.message).toContain("cart is empty");
  });
});
