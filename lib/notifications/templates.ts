// Mirrors docs/whatsapp-templates.md exactly — variable order must match
// what's submitted to Meta for approval. Update both files together.

export type TemplateKey =
  | "order_received"
  | "order_verified"
  | "payment_confirmed"
  | "order_preparing"
  | "order_ready";

// Loosely typed on purpose — the caller (lib/notifications/dispatch.ts)
// assembles this from a mix of DB columns (typed) and jsonb payload fields
// (untyped at the type-checker level, validated at runtime by their absence
// just rendering as an empty string below rather than throwing).
export type TemplateInput = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function renderWhatsAppText(templateKey: TemplateKey, input: TemplateInput): string {
  const orderNumber = str(input.orderNumber);
  switch (templateKey) {
    case "order_received":
      return `Olá ${str(input.customerName)}! Recebemos o seu pedido ${orderNumber} na Chelena. Vamos verificar o stock e enviamos-lhe a confirmação em breve. Obrigado pela preferência!`;
    case "order_verified":
      return `O seu pedido ${orderNumber} foi confirmado! Levantamento em ${str(input.pickupPointName)} a partir de ${str(input.pickupDate)}. Instruções de pagamento: ${str(input.paymentInstructions)}. Qualquer dúvida, responda a esta mensagem.`;
    case "payment_confirmed":
      return `Pagamento do pedido ${orderNumber} confirmado! Já estamos a preparar a sua encomenda.`;
    case "order_preparing":
      return `O seu pedido ${orderNumber} está a ser preparado. Avisamos assim que estiver pronto para levantamento.`;
    case "order_ready":
      return `O seu pedido ${orderNumber} está pronto para levantamento em ${str(input.pickupPointName)}! Horário: ${str(input.pickupPointHours)}. Gostou da nossa loja? Deixe uma avaliação: ${str(input.googleReviewUrl)}`;
  }
}

const SUBJECTS: Record<TemplateKey, string> = {
  order_received: "Recebemos o seu pedido — Chelena",
  order_verified: "O seu pedido foi confirmado — Chelena",
  payment_confirmed: "Pagamento confirmado — Chelena",
  order_preparing: "O seu pedido está a ser preparado — Chelena",
  order_ready: "O seu pedido está pronto — Chelena",
};

export function renderEmail(templateKey: TemplateKey, input: TemplateInput) {
  const text = renderWhatsAppText(templateKey, input);
  return {
    subject: SUBJECTS[templateKey],
    html: `<div style="font-family: sans-serif; font-size: 15px; color: #2a1810; max-width: 480px;">
      <p>${text.replace(/\n/g, "<br/>")}</p>
      <p style="color: #8a7a6a; font-size: 12px;">Chelena</p>
    </div>`,
    text,
  };
}
