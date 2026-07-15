# Chelena — Architecture & Technical Design

**Version:** 1.0 · **Stack decision: Accepted**

## ADR-001: Stack

**Status:** Accepted · **Date:** July 2026 · **Decider:** Mauru

**Context:** SEO is a hard requirement (goal: rank organically in AO/PT). Team is fluent in Flutter and Python, but Flutter Web renders to canvas and is effectively invisible to crawlers. Supabase is mandated for DB + storage.

**Decision:** **Next.js 14+ (App Router, TypeScript) on Vercel + Supabase** (Postgres, Auth, Storage, Edge Functions). Tailwind CSS + shadcn/ui for the design system.

**Options considered:** Flutter Web (rejected: SEO, initial-load weight), plain React SPA (rejected: SEO), Next.js SSR/ISR (accepted: crawlable HTML, image optimization, ISR for catalog pages, first-class Vercel deploy).

**Consequences:** Easier — SEO, performance, image handling, structured data. Harder — team learns Next.js App Router conventions. Revisit — if a native app ships (Phase 3), all business logic must stay in Supabase (RLS + RPC + Edge Functions), never in Next-only code. This is a build rule.

## ADR-002: Payments (v1)

**Decision:** Manual "payment by instruction" flow in v1. On admin verification, the order gets country-specific payment instructions (AO: Multicaixa reference / IBAN; PT: MB Way number / IBAN) sent via WhatsApp/email. Admin marks paid manually.

**Why:** Angolan gateways (AppyPay, ProxyPay/EMIS GPO) require a contract with an Angolan bank — a business process that must not block launch. The data model carries `payment_method`, `payment_reference`, `paid_at`, so Phase 2 gateway webhooks slot in without migration pain.

## 1. System overview

```
Browser (Next.js SSR/ISR pages, React client components)
   │
   ├── Next.js Route Handlers (server): checkout, admin mutations,
   │     image processing (sharp), Places API proxy, notification dispatch
   │
   └── Supabase
        ├── Postgres (RLS on all tables)
        ├── Auth (email OTP + Google OAuth; optional for shoppers)
        ├── Storage: product-images (public read), banners (public read)
        └── Edge Function / cron (Phase 1.5): WhatsApp catalog feed sync

External: WhatsApp Cloud API (Meta Graph API) · Resend (email)
          Google Places API (rating display) · geo-IP (country suggestion)
```

**Notification flow:** admin status change → server route updates order + inserts `order_status_history` → same transaction enqueues `notifications` row → dispatcher (route handler invoked inline + retry cron) calls WhatsApp Cloud API template or Resend → updates `notifications.status` from provider response/webhook.

**Image flow:** admin uploads original → Next server route (sharp): auto-rotate, strip EXIF, resize variants (thumb 200 / card 600 / detail 1200 / banner 1600), WebP q≈80, enforce ≤ 200 KB on detail (step quality down if needed) → upload variants to Storage → insert `product_images` row. Admin can open cropper (react-easy-crop) on any image, save a new derived variant, and toggle `is_advertisable`. Banner manager only lists images where `is_advertisable = true`.

## 2. Database schema (Postgres / Supabase)

```sql
-- ENUMS
create type country_code as enum ('AO','PT');
create type order_status as enum ('pending_review','verified','awaiting_payment',
  'paid','preparing','ready_for_pickup','completed','cancelled');
create type contact_channel as enum ('whatsapp','email');
create type notification_status as enum ('queued','sent','delivered','failed');
create type fulfillment_type as enum ('pickup'); -- 'delivery' added in Phase 3

-- PROFILES (extends auth.users; shoppers optional, admin required)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  default_country country_code,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_pt text not null, name_en text,
  image_path text, sort_order int default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  brand text,
  description_pt text, description_en text,
  category_id uuid references categories,
  tags text[] default '{}',
  seo_title text, seo_description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- per-country price/stock/visibility
create table product_country (
  product_id uuid references products on delete cascade,
  country country_code,
  currency text not null,            -- 'AOA' | 'EUR'
  price numeric(12,2) not null,
  compare_at_price numeric(12,2),    -- for promo strikethrough
  stock int not null default 0,
  is_visible boolean default true,
  primary key (product_id, country)
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products on delete cascade,
  storage_path_thumb text not null,
  storage_path_card text not null,
  storage_path_detail text not null,
  storage_path_banner text,          -- present if banner-crop was made
  alt_text text,
  is_primary boolean default false,
  is_advertisable boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table pickup_points (
  id uuid primary key default gen_random_uuid(),
  country country_code not null,
  name text not null, address text not null, city text not null,
  hours text, maps_url text,
  is_active boolean default true
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,           -- e.g. CH-2026-000123
  tracking_token uuid unique default gen_random_uuid(), -- guest tracking link
  user_id uuid references profiles,            -- nullable (guest)
  country country_code not null,
  currency text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  preferred_channel contact_channel not null default 'whatsapp',
  pickup_point_id uuid references pickup_points,
  fulfillment fulfillment_type not null default 'pickup',
  status order_status not null default 'pending_review',
  subtotal numeric(12,2) not null,
  notes text,
  -- verification / payment (set by admin)
  pickup_date date,
  payment_instructions text,
  payment_method text,          -- 'multicaixa_ref' | 'mbway' | 'iban' | ...
  payment_reference text,
  paid_at timestamptz,
  cancelled_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders on delete cascade,
  product_id uuid references products,
  product_name text not null,        -- snapshot
  unit_price numeric(12,2) not null, -- snapshot
  quantity int not null check (quantity > 0)
);

create table order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid references orders on delete cascade,
  from_status order_status, to_status order_status not null,
  changed_by uuid references profiles,
  note text,
  created_at timestamptz default now()
);

create table notifications (
  id bigint generated always as identity primary key,
  order_id uuid references orders,
  channel contact_channel not null,
  template_key text not null,        -- 'order_received' | 'order_verified' | ...
  payload jsonb not null,
  status notification_status not null default 'queued',
  provider_message_id text,
  error text,
  attempts int default 0,
  created_at timestamptz default now(),
  sent_at timestamptz
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders,
  product_id uuid references products,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  body text,
  is_approved boolean default false,
  admin_reply text,
  created_at timestamptz default now(),
  unique (order_id, product_id)      -- one review per product per order
);

create table banners (
  id uuid primary key default gen_random_uuid(),
  image_id uuid references product_images, -- must be is_advertisable
  custom_image_path text,                  -- or a standalone uploaded creative
  title text, target_url text,
  placement text not null check (placement in ('home_hero','home_strip','category_top')),
  country country_code,                    -- null = both
  starts_at timestamptz, ends_at timestamptz,
  is_active boolean default true,
  sort_order int default 0
);

create table wishlist_items (                -- P1
  user_id uuid references profiles on delete cascade,
  product_id uuid references products on delete cascade,
  notify_back_in_stock boolean default false,
  created_at timestamptz default now(),
  primary key (user_id, product_id)
);

create table settings (                      -- key-value: google_place_id,
  key text primary key, value jsonb          -- whatsapp numbers, payment templates
);
```

### RLS policy summary

| Table | anon/customer | admin |
|---|---|---|
| products, product_country, product_images, categories, pickup_points, banners | `select` where active/visible | all |
| orders, order_items | `insert` via checkout RPC only; `select` own (`user_id = auth.uid()`) — guest tracking goes through a server route validating `tracking_token` | all |
| reviews | `select` where approved; `insert` via server route validating order token + status = completed | all |
| notifications, order_status_history, settings | none | all |

Admin checks use a `is_admin()` security-definer function reading `profiles.role`. All admin mutations additionally go through Next server routes that re-verify the session (defense in depth).

## 3. Frontend structure

```
app/
  (store)/[locale]/
    page.tsx                 # home (ISR 60s): hero banner, categories, featured
    products/page.tsx        # listing + filters (server components + URL state)
    products/[slug]/page.tsx # PDP (ISR, generateMetadata, JSON-LD)
    cart/page.tsx
    checkout/page.tsx
    orders/[token]/page.tsx  # guest tracking
    account/…                # optional auth area
  admin/
    layout.tsx               # role guard
    dashboard / products / orders (pipeline board) / pickup-points /
    banners / reviews / settings
  api/ … route handlers (checkout, images/process, notify, places, webhooks/whatsapp)
```

- **State:** cart in localStorage + React context; server is source of truth after checkout.
- **i18n:** `next-intl`, locales `pt` (default) and `en`; country ≠ locale (an EN speaker in Angola sees AOA).
- **Design system:** Tailwind + shadcn/ui; tokens for brand color, radius, spacing; product-photography-first layout; skeleton loading; `next/image` everywhere.

## 4. Integrations

**WhatsApp Cloud API** — WABA + phone number ID in `settings`. Utility templates (submitted for Meta approval, PT language): `order_received`, `order_verified` (vars: order#, pickup date, pickup point, payment instructions), `payment_confirmed`, `order_preparing`, `order_ready` (+ Google review link var). Webhook endpoint records delivery status into `notifications`. Phase 1.5: nightly product feed sync to Meta Commerce Manager catalog.

**Email (Resend)** — mirrored templates (React Email). Used when customer picks email, or as fallback after 2 failed WhatsApp attempts.

**Google** — Places API Details (rating, reviews) fetched server-side, cached 24 h in `settings`; review deep link `https://search.google.com/local/writereview?placeid=<PLACE_ID>` used post-review and in the `order_ready` message. On-site reviews cannot be pushed to Google (API is read/reply only) — this is by design.

## 5. SEO plan

ISR pages with full HTML; `generateMetadata` per product/category (admin-editable SEO fields); JSON-LD Product with `offers` (per-country price via country cookie → serve default country by domain path `/pt` and `/ao` sections for indexability — hreflang `pt-PT`, `pt-AO`, `en`); sitemap.xml generated from DB; OG image per product (satori or primary image); Core Web Vitals budget enforced (image variants, font subset, zero client JS on PDP above the fold beyond gallery).

## 6. Environments & config

Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `RESEND_API_KEY`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`, `GEOIP_PROVIDER_KEY`.

Deploy: Vercel (production + preview) · Supabase project with migrations in repo (`supabase/migrations`) · seed script for categories, pickup points, demo products.
