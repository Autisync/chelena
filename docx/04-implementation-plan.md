# Chelena — Implementation Plan

**Build order is dependency-driven. Each milestone ends in a working, testable state.**

## Milestone 0 — Foundation (½ day)
- [ ] Next.js 14+ App Router + TypeScript + Tailwind + shadcn/ui scaffold; ESLint/Prettier.
- [ ] Supabase project: run migration 001 (full schema from architecture doc), RLS policies, `is_admin()` fn, storage buckets (`product-images`, `banners`) with public-read policy.
- [ ] Auth wiring (email OTP + Google), `profiles` trigger on signup, seed one admin user.
- [ ] `next-intl` setup (pt default, en), country cookie middleware + geo-IP suggestion.
- [ ] Seed script: 2 categories, 4 pickup points (2 AO / 2 PT), 8 demo products with images.

## Milestone 1 — Admin: products & images (1–2 days)
- [ ] Admin layout with role guard; dashboard shell.
- [ ] Product CRUD with per-country price/stock/visibility tabs (AO/PT).
- [ ] Image upload route: sharp pipeline (variants thumb/card/detail/banner, WebP, ≤200 KB detail), EXIF strip.
- [ ] Image manager per product: reorder, set primary, alt text, cropper (1:1, 16:9), `is_advertisable` toggle.
- [ ] Pickup points CRUD. Settings page (WhatsApp/payment templates/Google place-id placeholders).

**Exit test:** admin creates a product with 3 photos in < 3 min; images served as WebP < 200 KB.

## Milestone 2 — Storefront (2–3 days)
- [ ] Home: hero banner slot, category tiles, featured, promo strip (banner-driven).
- [ ] Listing page: filters (category, brand, price, in-stock), sort, pagination — URL-state, server-rendered.
- [ ] PDP: gallery, price (country currency), stock badge, related products, reviews section, JSON-LD.
- [ ] Country switcher (header) — changing country revalidates catalog + clears incompatible cart with confirm dialog.
- [ ] Cart page + mini-cart; localStorage persistence.
- [ ] SEO: metadata, OG images, sitemap.xml, robots.txt, hreflang.

**Exit test:** Lighthouse mobile: SEO ≥ 95, Perf ≥ 85; Rich Results test passes for Product.

## Milestone 3 — Checkout & orders (2 days)
- [ ] Checkout form (name, phone intl input, optional email, channel choice, pickup point, notes) → `create_order` RPC (validates stock, snapshots prices, generates order_number + tracking_token).
- [ ] Confirmation page + guest tracking page (`/orders/[token]`) with status timeline.
- [ ] Post-checkout "create account to track orders" claim flow.
- [ ] Admin order pipeline board (columns per status, drag or button transitions):
      verify modal (pickup date + payment instructions template per country), paid, preparing, ready, completed, cancel with reason.
- [ ] `order_status_history` written on every transition.

**Exit test:** full guest order lifecycle in staging without errors; stock decremented on verify; restored on cancel.

## Milestone 4 — Notifications (1–2 days)
- [ ] Notification enqueue on status transitions; dispatcher with retry (max 3) + channel fallback.
- [ ] WhatsApp Cloud API sender + webhook (delivery receipts, inbound "STOP" handling).
- [ ] Resend email templates (React Email) mirroring WhatsApp templates.
- [ ] Admin notification log view.
- [ ] Template documents for Meta approval (PT utility templates) included in repo `/docs/whatsapp-templates.md`.

**Exit test:** every status change produces a sent notification (sandbox/test number) in < 60 s; failure falls back to email.

## Milestone 5 — Reviews, Google, banners, polish (1–2 days)
- [ ] Review submission (tokenized, completed orders only) + moderation + display with aggregateRating in JSON-LD.
- [ ] Google review deep link post-submission and in `order_ready` message; Places rating widget (cached).
- [ ] Banner manager + rendering in the three placements with scheduling and country filter.
- [ ] Wishlist + back-in-stock (P1 if time allows).
- [ ] Error/empty/loading states everywhere; 404/500 pages; accessibility pass (focus, contrast, labels).

## Milestone 6 — Production readiness (1 day)
- [ ] Rate limiting (checkout, reviews, auth) — Upstash or Vercel middleware.
- [ ] Security review: RLS test suite, no service-role key on client, input validation (zod) on every route.
- [ ] E2E happy paths (Playwright): browse → cart → checkout → admin verify → status advance → notification asserted (mock providers).
- [ ] Analytics (Vercel Analytics or Plausible) + basic event tracking (add-to-cart, checkout, order).
- [ ] Deploy: Vercel production, Supabase prod project, env vars set, custom domain, WhatsApp webhook URL registered.
- [ ] Launch checklist: real payment instruction templates, real pickup points, Meta template approval, Google Place ID.

## Manual/business prerequisites (Mauru — parallel track)
1. Meta Business verification + WhatsApp Business Account + phone number.
2. Submit utility message templates for approval (drafts provided in repo).
3. Google Business Profile for Chelena (enables review link + rating widget).
4. Bank/Multicaixa details for payment instruction templates (AO + PT).
5. Domain + logo/brand tokens.

## Phase 2 backlog (post-launch)
Payment gateways (AppyPay/ProxyPay AO — requires bank contract; Stripe/IfthenPay PT), abandoned-cart WhatsApp recovery (opt-in), WhatsApp catalog feed sync, promo codes, richer analytics.
