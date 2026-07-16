import "server-only";
import { renderWhatsAppText, type TemplateKey } from "@/lib/notifications/templates";

// MOCK_PROVIDERS=true (the .env.example default) logs instead of calling
// Meta — this repo's real .env.local has no WhatsApp credentials, so this
// path is what's actually exercised in this environment (hard rule #6:
// "fully testable without real provider credentials").
export async function sendWhatsAppMessage(
  phone: string,
  templateKey: TemplateKey,
  payload: Record<string, unknown>
): Promise<{ providerMessageId: string }> {
  const text = renderWhatsAppText(templateKey, payload);

  if (process.env.MOCK_PROVIDERS !== "false") {
    console.log(`[MOCK WhatsApp -> ${phone}] (${templateKey}): ${text}`);
    return { providerMessageId: `mock-${crypto.randomUUID()}` };
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID not configured");
  }

  // Real send uses the pre-approved template message format (Meta rejects
  // free-form text outside the 24h customer-service window) — see
  // docs/whatsapp-templates.md for the exact template bodies/variable order.
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace(/[^\d+]/g, ""),
      type: "template",
      template: {
        name: templateKey,
        language: { code: "pt_PT" },
        components: [{ type: "body", parameters: [{ type: "text", text }] }],
      },
    }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? `WhatsApp send failed (${res.status})`);
  return { providerMessageId: body?.messages?.[0]?.id ?? "unknown" };
}
