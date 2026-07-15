# Chelena

Single-seller cosmetics e-commerce for Angola and Portugal — country-aware catalog, guest
checkout, admin CRM with an image pipeline, and automatic WhatsApp/email order notifications.
See `docx/01-product-overview.md` through `docx/04-implementation-plan.md` for the full spec, and
`STATUS.md` for current build progress against the milestone plan.

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind + shadcn/ui · Supabase (Postgres/Auth/Storage) ·
next-intl · WhatsApp Cloud API · Resend · Google Places API.

## Env vars

Copy `.env.example` to `.env.local` and fill in what you have. Everything works with only
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` set and
`MOCK_PROVIDERS=true` (the default) — WhatsApp/Resend/Places calls are logged instead of sent.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client + server, RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, bypasses RLS — image pipeline, notification dispatcher, guest order lookups |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_VERIFY_TOKEN` | Meta WhatsApp Cloud API |
| `RESEND_API_KEY` | Email notifications |
| `GOOGLE_PLACES_API_KEY` / `GOOGLE_PLACE_ID` | Rating widget + review deep link |
| `GEOIP_PROVIDER_KEY` | Optional — improves the first-visit country suggestion |
| `MOCK_PROVIDERS` | `true` (default): log instead of calling WhatsApp/Resend/Places |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting store; falls back to in-memory when unset (dev only, see `docs/DECISIONS.md`) |
| `NEXT_PUBLIC_SITE_URL` | Absolute base URL for OG tags / notification links |

## Local dev

```bash
npm install
supabase start                # local Postgres/Auth/Storage via Docker
supabase db push               # apply supabase/migrations/*.sql
supabase db seed -f supabase/seed.sql
supabase gen types typescript --local > lib/supabase/types.ts
cp .env.example .env.local     # fill in the local Supabase URL/keys `supabase start` prints
npm run dev
```

## Create the first admin

Sign up normally (email OTP or Google) to get a `profiles` row, then promote it:

```sql
update profiles set role = 'admin' where id = '<user-id-from-auth.users>';
```

## Deploy

1. Create a Supabase project (production), run `supabase link` then `supabase db push`, and
   `supabase db seed` against it once (adjust seed data for real pickup points).
2. Deploy to Vercel, connect this repo, set the env vars above (`MOCK_PROVIDERS=false` once real
   provider credentials exist — see `docs/LAUNCH-CHECKLIST.md`).
3. Register the WhatsApp webhook URL (`https://<domain>/api/webhooks/whatsapp`) with Meta.
4. Attach a custom domain and set `NEXT_PUBLIC_SITE_URL` to it.

## Tests

```bash
npm test          # unit tests (image pipeline, create_order)
npx playwright test   # e2e (browse → cart → checkout, admin verify → notification, review flow)
```
