-- Chelena initial schema
-- Source: docx/03-architecture.md §2 "Database schema", reproduced verbatim except
-- for genuine syntax fixes (see docs/DECISIONS.md for the list).
create extension if not exists pgcrypto;

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
  country country_code not null,
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

-- Indexes for common lookups (not in spec doc verbatim; added for real-world performance)
create index idx_products_category on products(category_id);
create index idx_products_active on products(is_active);
create index idx_product_country_country on product_country(country);
create index idx_product_images_product on product_images(product_id);
create index idx_orders_user on orders(user_id);
create index idx_orders_status on orders(status);
create index idx_orders_country on orders(country);
create index idx_order_items_order on order_items(order_id);
create index idx_order_status_history_order on order_status_history(order_id);
create index idx_notifications_order on notifications(order_id);
create index idx_notifications_status on notifications(status);
create index idx_reviews_product on reviews(product_id);
create index idx_reviews_approved on reviews(is_approved);
create index idx_banners_placement on banners(placement, is_active);
