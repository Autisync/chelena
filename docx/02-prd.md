# Chelena — Product Requirements Document (PRD)

**Version:** 1.0 · **Status:** Approved for build · **Stack:** Next.js + Supabase

## 1. Problem statement

Selling cosmetics to customers in Angola and Portugal today means juggling WhatsApp chats, manual price lists, and ad-hoc payment confirmations. There is no single place where customers can browse a professional catalog in their country's currency, order without friction, and be kept informed automatically. The cost of not solving it: lost sales from abandoned WhatsApp conversations, admin time wasted on repetitive updates, and no SEO presence to attract new customers.

## 2. Goals

1. **Launch a production-ready web shop** serving both Angola and Portugal with country-specific catalog, pricing, and pickup points.
2. **≥ 70% of orders completed via guest checkout** without support intervention (checkout works without an account).
3. **100% of order status changes trigger an automatic WhatsApp or email notification** within 60 seconds.
4. **Catalog pages indexed by Google** with Product structured data (rich results eligible) within 30 days of launch.
5. **Admin can list a new product — including processed images — in under 3 minutes.**

## 3. Non-goals (v1)

- **Multi-vendor marketplace** — single seller only; multi-vendor is a separate future initiative.
- **Home delivery / courier integration** — pickup points only; shipping adds logistics complexity not needed for launch.
- **Automated payment capture** — no Stripe/AppyPay integration in v1; admin confirms payments manually (Phase 2).
- **Native mobile apps** — responsive web only; backend is app-ready for later.
- **Posting reviews to Google via API** — technically impossible; we use on-site reviews + a Google review deep link + display of Google rating.
- **Third-party paid advertising** — banner slots are for the admin's own campaigns.

## 4. User stories

### Shopper
- As a shopper in Angola, I want to switch the site to "Angola" so that I only see products available in my country, priced in Kwanzas.
- As a shopper, I want to browse by category, search, and filter (price, brand, new, promo) so that I find products quickly.
- As a shopper, I want to add products to a cart and check out with just my name and WhatsApp number so that I don't need to create an account.
- As a shopper, I want to choose a pickup point near me so that I know where to collect my order.
- As a shopper, I want to receive a WhatsApp message when my order is verified, with the pickup date and payment instructions, so that I know exactly what to do next.
- As a shopper, I want status updates (payment received → preparing → ready for pickup) so that I never have to ask "where is my order?".
- As a returning shopper, I want to optionally create an account so that I can see my order history and reorder faster.
- As a shopper, I want to leave a review with a star rating after my purchase, and be invited to also post it on Google, so that I can share my experience.
- As a shopper, I want to save products to a wishlist and be notified when out-of-stock items return.

### Admin
- As the admin, I want to create/edit products with per-country availability, price, and stock so that one catalog serves both markets.
- As the admin, I want uploaded images to be automatically compressed and converted so that pages load fast without manual work.
- As the admin, I want to crop/adjust a processed image and mark it "advertisable" so that only approved visuals appear in banners and promos.
- As the admin, I want a pipeline view of incoming carts so that I can verify each order, set a pickup date, and attach payment instructions.
- As the admin, I want to mark an order "payment received" and advance it through stages so that the customer is automatically notified at each step.
- As the admin, I want to manage banner/ad slots (image, link, country, schedule) so that I can run promotions on the homepage and category pages.
- As the admin, I want to moderate reviews (approve/hide) so that the storefront stays trustworthy.
- As the admin, I want the product catalog synced to my WhatsApp Business catalog so that customers browsing on WhatsApp see the same products.

## 5. Requirements

### P0 — Must have (launch blockers)

**Storefront**
- [ ] Country selector (AO/PT) persisted in cookie; drives catalog, currency, pickup points, and payment instructions. First visit: geo-IP suggestion with manual override.
- [ ] Home page: hero banner slot, featured products, category tiles, promo banner slots, new arrivals.
- [ ] Category and search pages with filters (category, price range, brand, in-stock) and sorting.
- [ ] Product detail page: image gallery, description, price in local currency, stock state, reviews, related products, JSON-LD Product schema.
- [ ] Cart (client-side persisted) with quantity edit and country-consistency (cart locked to one country).
- [ ] Guest checkout: name, phone (with country code), optional email, preferred contact channel (WhatsApp/email), pickup point selection, order notes.
- [ ] Order confirmation page + tracking page accessible via tokenized link (no login needed).
- [ ] Optional account (Supabase Auth: email OTP + Google). Post-checkout prompt to claim the order into a new account.
- [ ] PT language (pt-PT) complete; EN secondary. hreflang for pt-PT / pt-AO / en.

**Admin CRM (role-protected /admin)**
- [ ] Product CRUD: name, slug, description, brand, category, per-country price (EUR/AOA), per-country stock and visibility, images, tags, SEO fields (meta title/description).
- [ ] Image pipeline: upload → server-side processing (resize to variants: thumb 200px, card 600px, detail 1200px; convert to WebP; target ≤ 200 KB for detail size) → stored in Supabase Storage. Admin cropper (aspect presets: 1:1 product, 16:9 banner) and "advertisable" flag per image.
- [ ] Order pipeline board: `pending_review → verified → awaiting_payment → paid → preparing → ready_for_pickup → completed` (+ `cancelled`). Verifying requires pickup date + payment instructions (templated per country, editable).
- [ ] Every status transition writes to `order_status_history` and triggers a notification (WhatsApp template or email) automatically.
- [ ] Pickup points CRUD (name, address, city, country, hours, map link).
- [ ] Banner/ads manager: image (must be an "advertisable" image), target URL, placement (home-hero, home-strip, category-top), country, start/end date, active toggle.
- [ ] Reviews moderation (approve/hide/reply).
- [ ] Dashboard: orders by status, revenue by country, low-stock alerts, top products.

**Notifications**
- [ ] WhatsApp Cloud API integration with pre-approved utility templates: order received, order verified (date + payment info), payment confirmed, preparing, ready for pickup.
- [ ] Email fallback (Resend) with the same events; channel chosen by customer at checkout, with automatic fallback to the other channel on delivery failure.
- [ ] Notification log table (event, channel, status, provider message id) visible in admin.

**Reviews**
- [ ] On-site reviews: 1–5 stars + text; only for completed orders (verified-purchase badge); moderation before publish.
- [ ] "Also review us on Google" deep link (place-id review URL) shown after submitting an on-site review and in the ready-for-pickup notification.
- [ ] Display Google rating + latest Google reviews on site via Places API (server-side, cached 24 h).

**SEO**
- [ ] SSR/ISR for all public pages; semantic HTML; Core Web Vitals budget (LCP < 2.5 s on 4G).
- [ ] Per-page metadata, Open Graph images, canonical URLs.
- [ ] JSON-LD: Organization, WebSite (+ SearchAction), Product (price, availability, aggregateRating), BreadcrumbList.
- [ ] sitemap.xml (products, categories, per locale) + robots.txt; hreflang alternates.

**Security & quality**
- [ ] Supabase RLS on every table; admin actions via server routes checking a `role = 'admin'` claim.
- [ ] Rate limiting on checkout and review endpoints; honeypot + server validation.
- [ ] All secrets server-side only; signed URLs or public-read bucket policy for images only.

### P1 — Nice to have (fast follows)
- Wishlist + back-in-stock notification.
- Abandoned cart recovery via WhatsApp (with prior opt-in only).
- Promo/discount codes.
- WhatsApp Business catalog sync (product feed to Meta Commerce Manager via scheduled Edge Function).
- Admin analytics: conversion funnel, notification delivery rates.
- Customer accounts: address book, reorder button.

### P2 — Future considerations (design for, don't build)
- Automated payments: AppyPay/ProxyPay (AO), Stripe + IfthenPay MB Way (PT). → Order model already has `payment_method`, `payment_reference`, `paid_at` to plug gateways in.
- Home delivery with courier tracking. → `fulfillment_type` enum on orders defaults to `pickup`.
- Native app (Flutter) on the same Supabase backend.
- Multi-admin roles (staff vs owner).
- Third-party advertisers in banner slots.

## 6. Success metrics

**Leading (first 30 days):** checkout completion rate ≥ 60% from cart; notification delivery success ≥ 95%; median admin verify-time < 12 h; Lighthouse SEO ≥ 95, Performance ≥ 85 mobile.

**Lagging (90 days):** ≥ 25% repeat purchase rate; ≥ 30% of completed orders leave a review; organic search ≥ 20% of traffic.

## 7. Open questions

| Question | Owner | Blocking? |
|---|---|---|
| Which WhatsApp Business number(s)? One number for both countries or one per country? | Mauru | No — build supports either; templates are per-WABA. |
| Google Business Profile exists for Chelena (needed for place-id review link)? | Mauru | No — feature degrades gracefully if absent. |
| Bank details / Multicaixa entity for payment instruction templates | Mauru | Yes, before first real order — but placeholders fine for build. |
| Brand assets (logo, colors)? | Mauru | No — build with a defined design system, swap tokens later. |

## 8. Timeline & phasing

- **Phase 1 (build target for Sonnet):** all P0 — production-ready storefront + admin + notifications + SEO.
- **Phase 2:** P1 items + payment gateway automation (AO: AppyPay/ProxyPay contract; PT: Stripe/IfthenPay).
- **Phase 3:** native app, delivery, multi-admin.
