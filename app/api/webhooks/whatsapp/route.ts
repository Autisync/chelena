import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Meta's webhook verification handshake (one-time, when registering
// the URL in the WhatsApp Business dashboard).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

// POST: delivery-status callbacks + inbound messages (only "STOP" handling
// per hard rule #6; general inbound chat isn't in scope for v1). Meta's
// payload shape: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const supabase = createAdminClient();

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};

      for (const status of value.statuses ?? []) {
        // status.id is the WhatsApp message id we stored as provider_message_id.
        const mapped = status.status === "delivered" ? "delivered" : status.status === "failed" ? "failed" : null;
        if (mapped) {
          await supabase.from("notifications").update({ status: mapped }).eq("provider_message_id", status.id);
        }
      }

      for (const message of value.messages ?? []) {
        const text = String(message.text?.body ?? "").trim().toUpperCase();
        if (text === "STOP") {
          // Opt-out: no unsubscribe table exists yet (P1 abandoned-cart
          // recovery is the only feature that would need one) — log for now
          // so it's at least visible, rather than silently dropping it.
          console.warn(`[WhatsApp] STOP received from ${message.from} — no opt-out list wired yet`);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
