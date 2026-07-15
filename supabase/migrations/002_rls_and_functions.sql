-- RLS policies + support functions/triggers
-- Policy summary source: docx/03-architecture.md §2 "RLS policy summary"

-- is_admin(): security-definer so it can read profiles.role even under RLS.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- New auth.users row -> profiles row (role defaults to 'customer').
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger set_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- Every status transition is logged automatically (defense in depth; the
-- create_order/advance_order_status RPCs also write history explicitly with a note).
create or replace function log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger orders_log_status_change
  after update on orders
  for each row execute function log_order_status_change();

-- ============ RLS ============

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_country enable row level security;
alter table product_images enable row level security;
alter table pickup_points enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table notifications enable row level security;
alter table reviews enable row level security;
alter table banners enable row level security;
alter table wishlist_items enable row level security;
alter table settings enable row level security;

-- profiles: a user can read/update their own row; admin can do anything.
create policy profiles_select_own on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_update_own on profiles for update using (id = auth.uid() or is_admin());
create policy profiles_admin_all on profiles for all using (is_admin()) with check (is_admin());

-- catalog tables: public read of active/visible rows; admin full control.
create policy categories_select on categories for select using (true);
create policy categories_admin_all on categories for all using (is_admin()) with check (is_admin());

create policy products_select on products for select using (is_active or is_admin());
create policy products_admin_all on products for all using (is_admin()) with check (is_admin());

create policy product_country_select on product_country for select using (is_visible or is_admin());
create policy product_country_admin_all on product_country for all using (is_admin()) with check (is_admin());

create policy product_images_select on product_images for select using (true);
create policy product_images_admin_all on product_images for all using (is_admin()) with check (is_admin());

create policy pickup_points_select on pickup_points for select using (is_active or is_admin());
create policy pickup_points_admin_all on pickup_points for all using (is_admin()) with check (is_admin());

-- orders/order_items: no direct insert policy for anon/customer — checkout goes
-- through the create_order() SECURITY DEFINER RPC only. Select is own-row or admin;
-- guest tracking bypasses RLS via a server route using the service role + tracking_token.
create policy orders_select_own on orders for select using (user_id = auth.uid() or is_admin());
create policy orders_admin_all on orders for all using (is_admin()) with check (is_admin());

create policy order_items_select_own on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
);
create policy order_items_admin_all on order_items for all using (is_admin()) with check (is_admin());

-- reviews: public read of approved; insert only via server route (service role,
-- after validating order token + status = completed); admin full control.
create policy reviews_select_approved on reviews for select using (is_approved or is_admin());
create policy reviews_admin_all on reviews for all using (is_admin()) with check (is_admin());

-- banners: public read of active; admin full control.
create policy banners_select on banners for select using (is_active or is_admin());
create policy banners_admin_all on banners for all using (is_admin()) with check (is_admin());

-- wishlist_items: owner only.
create policy wishlist_select_own on wishlist_items for select using (user_id = auth.uid());
create policy wishlist_all_own on wishlist_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy wishlist_admin_all on wishlist_items for all using (is_admin()) with check (is_admin());

-- admin-only tables
create policy order_status_history_admin_only on order_status_history for all using (is_admin()) with check (is_admin());
create policy notifications_admin_only on notifications for all using (is_admin()) with check (is_admin());
create policy settings_admin_only on settings for all using (is_admin()) with check (is_admin());
