-- Bug found via live-DB verification of the guest tracking page: order_items
-- has no RLS policy that lets a guest (user_id = null on the order) read
-- their own line items, even with a valid tracking_token — only the parent
-- `orders` row has a token-scoped bypass (get_order_by_token). Mirrors that
-- function's pattern: SECURITY DEFINER, the token itself is the
-- authorization check (unguessable random uuid), scoped by joining through
-- orders.tracking_token so a caller can only ever see items for the order
-- their token belongs to.
create or replace function get_order_items_by_token(p_tracking_token uuid)
returns setof order_items
language sql
security definer
set search_path = public
stable
as $$
  select oi.* from order_items oi
  join orders o on o.id = oi.order_id
  where o.tracking_token = p_tracking_token;
$$;

grant execute on function get_order_items_by_token(uuid) to anon, authenticated;
