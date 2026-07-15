# Chelena — Product Overview

**Version:** 1.0 · **Date:** July 2026 · **Owner:** Mauru (Autisync)

## What is Chelena?

Chelena is a modern, bilingual (Portuguese-first) e-commerce web app selling cosmetics and lifestyle products to customers in **Angola** and **Portugal**. It is a **single-seller shop** (Chelena is the merchant), not a multi-vendor marketplace.

The core differentiator is a **conversational, admin-verified purchase flow** adapted to how people actually buy in Angola and Portugal: customers build a cart (no account required), the admin verifies stock and sets a pickup date, and the customer receives payment instructions and constant status updates via **WhatsApp or email** until the order is ready for pickup.

## Value proposition

**For customers:**
- Browse a beautiful, fast catalog filtered by country (Angola or Portugal), with local currency (AOA / EUR) and local pickup points.
- Order without creating an account — just name + phone/email.
- Pay the way they already pay: Multicaixa reference / Multicaixa Express (AO), MB Way / bank transfer (PT). No card required.
- Get every update (order verified, payment received, preparing, ready for pickup) on WhatsApp — no need to check the site.

**For the admin (Chelena):**
- A CRM-style portal to manage products, prices per country, stock, orders, pickup points, banners/ads, and reviews.
- An image pipeline that compresses uploads automatically (small, web-optimized files) and lets the admin crop and flag images as "advertisable" for banner/hero placements.
- Full control over order acceptance: every cart is reviewed before it becomes a confirmed order.
- WhatsApp Business catalog sync — products managed once in Chelena, visible in the WhatsApp catalog too.

## Target users

| Persona | Description |
|---|---|
| **Shopper (AO)** | Mobile-first buyer in Luanda/other cities; pays via Multicaixa Express or ATM reference; WhatsApp is the primary channel. |
| **Shopper (PT)** | Buyer in Portugal; pays via MB Way or transfer; comfortable with email or WhatsApp. |
| **Admin** | Chelena operator; uploads products, verifies orders, sets pickup dates, confirms payments, advances delivery stages, manages banners. |

## Key experience principles

1. **Modern and simple** — clean typography, generous whitespace, product photography as the hero. No clutter.
2. **Mobile-first** — the majority of Angolan traffic will be mobile; every flow must be one-thumb friendly.
3. **Country-aware everywhere** — a persistent AO/PT switcher drives catalog, currency, pickup points, and payment instructions.
4. **Zero-friction checkout** — guest checkout by default; account creation is optional and offered *after* purchase ("track your orders faster next time").
5. **Trust through communication** — proactive WhatsApp/email updates at every stage replace the anxiety of "where is my order?".

## Business model (v1)

Direct product sales. Advertising slots are self-promotional (admin promotes own products/campaigns); third-party paid ads are a future consideration.

## What v1 is NOT (see PRD non-goals)

- Not a multi-vendor marketplace.
- Not home delivery — pickup points only.
- Not automated online payment capture — payments are by reference/instruction, confirmed manually by admin (gateway automation is Phase 2).
- Not a native mobile app — responsive web app first (architecture keeps a future Flutter/React Native app possible via the same Supabase backend).
