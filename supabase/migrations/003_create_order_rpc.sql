-- create_order(): the only way an order row can be created (see RLS policy
-- orders_select_own — there is no insert policy for anon/customer on purpose).
-- SECURITY DEFINER so it can bypass RLS, but it does its own validation:
-- locks product_country rows, checks visibility + stock, snapshots price/name,
-- decrements stock, and writes everything in one transaction.

create sequence if not exists order_number_seq;

create or replace function create_order(
  p_country country_code,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_preferred_channel contact_channel,
  p_pickup_point_id uuid,
  p_notes text,
  p_items jsonb  -- [{ "product_id": "...", "quantity": 2 }, ...]
)
returns table (order_id uuid, order_number text, tracking_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product_id uuid;
  v_quantity int;
  v_pc product_country%rowtype;
  v_product_name text;
  v_currency text;
  v_subtotal numeric(12,2) := 0;
  v_order_id uuid;
  v_order_number text;
  v_tracking_token uuid;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty' using errcode = '22023';
  end if;

  if p_pickup_point_id is not null then
    perform 1 from pickup_points
      where id = p_pickup_point_id and country = p_country and is_active;
    if not found then
      raise exception 'invalid pickup point for country' using errcode = '22023';
    end if;
  end if;

  -- Pass 1: lock rows, validate stock/visibility, compute currency + subtotal.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::int;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'invalid quantity for product %', v_product_id using errcode = '22023';
    end if;

    select * into v_pc from product_country
      where product_id = v_product_id and country = p_country
      for update;

    if not found or not v_pc.is_visible then
      raise exception 'product % is not available in %', v_product_id, p_country using errcode = '22023';
    end if;

    if v_pc.stock < v_quantity then
      raise exception 'insufficient stock for product %', v_product_id using errcode = '22023';
    end if;

    v_currency := v_pc.currency;
    v_subtotal := v_subtotal + (v_pc.price * v_quantity);
  end loop;

  v_order_number := 'CH-' || extract(year from now())::text || '-' ||
    lpad(nextval('order_number_seq')::text, 6, '0');

  insert into orders (
    order_number, user_id, country, currency, customer_name, customer_phone,
    customer_email, preferred_channel, pickup_point_id, notes, subtotal, status
  ) values (
    v_order_number, auth.uid(), p_country, v_currency, p_customer_name, p_customer_phone,
    p_customer_email, p_preferred_channel, p_pickup_point_id, p_notes, v_subtotal, 'pending_review'
  ) returning id, tracking_token into v_order_id, v_tracking_token;

  -- Pass 2: decrement stock and snapshot each line item.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::int;

    select price, (select name from products where id = v_product_id) into v_pc.price, v_product_name
      from product_country where product_id = v_product_id and country = p_country;

    update product_country set stock = stock - v_quantity
      where product_id = v_product_id and country = p_country;

    insert into order_items (order_id, product_id, product_name, unit_price, quantity)
      values (v_order_id, v_product_id, v_product_name, v_pc.price, v_quantity);
  end loop;

  insert into order_status_history (order_id, from_status, to_status, note)
    values (v_order_id, null, 'pending_review', 'order created via create_order()');

  insert into notifications (order_id, channel, template_key, payload)
    values (v_order_id, p_preferred_channel, 'order_received',
      jsonb_build_object('order_number', v_order_number));

  return query select v_order_id, v_order_number, v_tracking_token;
end;
$$;

-- Guests (anon) and authenticated customers may both call this; it is the sole
-- write path for orders so granting execute is safe despite RLS having no
-- insert policy on orders/order_items.
grant execute on function create_order(country_code, text, text, text, contact_channel, uuid, text, jsonb) to anon, authenticated;

-- get_order_by_token(): the guest-tracking read path. SECURITY DEFINER so a
-- caller with the right tracking_token can read an order without an insert/
-- select RLS grant — the token itself (a random uuid, unguessable) is the
-- authorization check, validated by the WHERE clause below.
create or replace function get_order_by_token(p_tracking_token uuid)
returns setof orders
language sql
security definer
set search_path = public
stable
as $$
  select * from orders where tracking_token = p_tracking_token;
$$;

grant execute on function get_order_by_token(uuid) to anon, authenticated;
