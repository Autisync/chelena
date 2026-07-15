# Launch checklist

Manual/business prerequisites from `docx/04-implementation-plan.md`, plus the technical
switches that flip at launch. Nothing here blocks development — the app runs fully in
`MOCK_PROVIDERS=true` mode without any of it.

## Business (Mauru — parallel track)

- [ ] Meta Business verification + WhatsApp Business Account + phone number.
- [ ] Submit utility message templates for approval — drafts in `docs/whatsapp-templates.md`.
- [ ] Google Business Profile for Chelena (enables the review deep link + rating widget;
      the site degrades gracefully without it — see PRD open questions).
- [ ] Bank / Multicaixa details for payment instruction templates (AO + PT).
- [ ] Domain + logo/brand tokens.

## Technical, before flipping `MOCK_PROVIDERS=false`

- [ ] `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` set; webhook URL
      registered with Meta (`/api/webhooks/whatsapp`).
- [ ] `RESEND_API_KEY` set; sending domain verified.
- [ ] `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` set.
- [ ] `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` set (see `docs/DECISIONS.md` —
      in-memory rate limiting is dev-only, not safe for multi-instance production).
- [ ] Real pickup points entered (seed data is placeholder).
- [ ] Real payment instruction templates entered in Settings (AO + PT).
- [ ] First admin user created (see README "Create the first admin").
- [ ] Supabase prod project migrated (`supabase db push`) and seeded.
- [ ] Custom domain attached in Vercel; `NEXT_PUBLIC_SITE_URL` updated.
- [ ] Lighthouse mobile on the PDP: SEO ≥ 95, Performance ≥ 85 (re-check on prod domain).
- [ ] Google Search Console: submit sitemap, verify Rich Results for a live product.
