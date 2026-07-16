-- claim_order(): lets a newly-authenticated customer attach a guest order to
-- their account (PRD P0: "Post-checkout prompt to claim the order into a new
-- account"). The tracking_token is the proof of ownership (same reasoning as
-- get_order_by_token/get_order_items_by_token) — SECURITY DEFINER so it can
-- write `orders.user_id` despite no RLS update policy existing for this case,
-- but only ever touches the one order matching both the token AND still
-- having user_id = null (never re-assigns an order that's already claimed or
-- belongs to someone else).
create or replace function claim_order(p_tracking_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  if auth.uid() is null then
    raise exception 'must be signed in to claim an order' using errcode = '42501';
  end if;

  update orders
    set user_id = auth.uid()
    where tracking_token = p_tracking_token and user_id is null;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

grant execute on function claim_order(uuid) to authenticated;
