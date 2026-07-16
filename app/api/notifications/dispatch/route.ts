import { NextResponse } from "next/server";
import { dispatchQueuedNotifications } from "@/lib/notifications/dispatch";

// Invoked inline (fire-and-forget) right after create_order/advance_order_status
// enqueue a notification, and can also be hit by a retry cron for anything
// that failed transiently (architecture doc: "dispatcher (route handler
// invoked inline + retry cron)"). No auth on this route is a deliberate
// simplification for now — it only ever processes rows already queued by
// trusted server code, never accepts attacker-controlled input; revisit
// with a shared-secret header before wiring a public cron to it.
export async function POST() {
  const results = await dispatchQueuedNotifications();
  return NextResponse.json({ dispatched: results.length, results });
}
