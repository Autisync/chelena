-- advance_order_status(): the only way an admin transitions an order (PRD:
-- "Verifying requires pickup date + payment instructions"; "every status
-- transition ... triggers a notification automatically"). Admin already has
-- full RLS access to `orders` via orders_admin_all, but going through this
-- RPC (rather than a plain UPDATE from the client) keeps the "verified
-- requires pickup_date + payment_instructions" rule and the notification
-- enqueue in one server-trusted place instead of duplicated across every
-- admin UI action.
create or replace function advance_order_status(
  p_order_id uuid,
  p_new_status order_status,
  p_pickup_date date default null,
  p_payment_instructions text default null,
  p_payment_method text default null,
  p_payment_reference text default null,
  p_cancelled_reason text default null,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_template_key text;
begin
  if not is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found' using errcode = '22023';
  end if;

  if p_new_status = 'verified' and (p_pickup_date is null or p_payment_instructions is null) then
    raise exception 'verifying requires pickup_date and payment_instructions' using errcode = '22023';
  end if;

  update orders set
    status = p_new_status,
    pickup_date = coalesce(p_pickup_date, pickup_date),
    payment_instructions = coalesce(p_payment_instructions, payment_instructions),
    payment_method = coalesce(p_payment_method, payment_method),
    payment_reference = coalesce(p_payment_reference, payment_reference),
    paid_at = case when p_new_status = 'paid' then now() else paid_at end,
    cancelled_reason = coalesce(p_cancelled_reason, cancelled_reason),
    updated_at = now()
  where id = p_order_id;

  -- orders_log_status_change trigger (migration 002) writes order_status_history
  -- automatically on this UPDATE; add a note-carrying row here only when the
  -- caller supplied one (the trigger's auto-row has note = null).
  if p_note is not null then
    update order_status_history
      set note = p_note
      where id = (
        select id from order_status_history
        where order_id = p_order_id and to_status = p_new_status
        order by created_at desc limit 1
      );
  end if;

  -- Only statuses with an approved WhatsApp template (docs/whatsapp-templates.md)
  -- get a notification; completed/cancelled/awaiting_payment have no template yet.
  v_template_key := case p_new_status
    when 'verified' then 'order_verified'
    when 'paid' then 'payment_confirmed'
    when 'preparing' then 'order_preparing'
    when 'ready_for_pickup' then 'order_ready'
    else null
  end;

  if v_template_key is not null then
    insert into notifications (order_id, channel, template_key, payload)
    values (
      p_order_id,
      v_order.preferred_channel,
      v_template_key,
      jsonb_build_object(
        'order_number', v_order.order_number,
        'pickup_date', p_pickup_date,
        'payment_instructions', p_payment_instructions
      )
    );
  end if;
end;
$$;

grant execute on function advance_order_status(uuid, order_status, date, text, text, text, text, text) to authenticated;
