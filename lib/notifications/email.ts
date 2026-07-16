import "server-only";
import { Resend } from "resend";
import { renderEmail, type TemplateKey } from "@/lib/notifications/templates";

export async function sendEmailMessage(
  to: string,
  templateKey: TemplateKey,
  payload: Record<string, unknown>
): Promise<{ providerMessageId: string }> {
  const { subject, html, text } = renderEmail(templateKey, payload);

  if (process.env.MOCK_PROVIDERS !== "false") {
    console.log(`[MOCK Email -> ${to}] (${templateKey}) ${subject}: ${text}`);
    return { providerMessageId: `mock-${crypto.randomUUID()}` };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: "Chelena <encomendas@chelena.example>",
    to,
    subject,
    html,
    text,
  });

  if (error) throw new Error(error.message);
  return { providerMessageId: data?.id ?? "unknown" };
}
