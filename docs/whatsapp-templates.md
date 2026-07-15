# WhatsApp Cloud API templates (for Meta approval)

Utility templates, Portuguese (pt), one WABA. Submit each of these in Meta Business Manager →
WhatsApp Manager → Message Templates. `{{n}}` are template variables, filled in by the
notification dispatcher from `notifications.payload`.

Category: **Utility** (transactional order updates, not marketing — required for pre-approval
outside the 24h customer-service window).

---

## `order_received`

> Olá {{1}}! Recebemos o seu pedido {{2}} na Chelena. Vamos verificar o stock e enviamos-lhe a
> confirmação em breve. Obrigado pela preferência!

Variables: `1` customer_name, `2` order_number.

## `order_verified`

> O seu pedido {{1}} foi confirmado! Levantamento em {{2}} a partir de {{3}}. Instruções de
> pagamento: {{4}}. Qualquer dúvida, responda a esta mensagem.

Variables: `1` order_number, `2` pickup_point_name, `3` pickup_date, `4` payment_instructions.

## `payment_confirmed`

> Pagamento do pedido {{1}} confirmado! Já estamos a preparar a sua encomenda.

Variables: `1` order_number.

## `order_preparing`

> O seu pedido {{1}} está a ser preparado. Avisamos assim que estiver pronto para levantamento.

Variables: `1` order_number.

## `order_ready`

> O seu pedido {{1}} está pronto para levantamento em {{2}}! Horário: {{3}}. Gostou da nossa
> loja? Deixe uma avaliação: {{4}}

Variables: `1` order_number, `2` pickup_point_name, `3` pickup_point_hours, `4` google_review_url.

---

## Notes for submission

- All templates are **Utility** category, language **Portuguese (pt_PT)**.
- Keep variable order stable — `lib/notifications/templates.ts` (Milestone 4) maps
  `template_key` → the exact variable order above.
- On rejection or edit, update both this file and the code mapping in the same change.
