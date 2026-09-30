alter table public.orders
  add column if not exists customer_received_at timestamptz;

create or replace function public.admin_set_order_status(
  p_order_id uuid,
  p_status text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_customer_request jsonb;
begin
  if p_status not in ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Invalid order status';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status = p_status then return v_order; end if;
  if not (
    (v_order.status = 'pending' and p_status in ('processing', 'cancelled'))
    or (v_order.status = 'processing' and p_status in ('shipped', 'cancelled'))
    or (v_order.status = 'paid' and p_status = 'shipped')
    or (v_order.status = 'shipped' and p_status = 'delivered')
  ) then
    raise exception 'Invalid order status transition';
  end if;

  v_customer_request := v_order.customer_request;
  if p_status = 'cancelled' then
    for v_item in
      select item.value from jsonb_array_elements(coalesce(v_order.items, '[]'::jsonb)) as item(value)
    loop
      v_product_id := nullif(v_item->>'product_id', '')::uuid;
      v_quantity := coalesce((v_item->>'quantity')::integer, 0);
      if v_product_id is not null and v_quantity > 0 then
        update public.products set stock = stock + v_quantity where id = v_product_id;
      end if;
    end loop;
    if v_customer_request->>'status' = 'pending' then
      v_customer_request := jsonb_set(v_customer_request, '{status}', '"resolved"'::jsonb, true);
      v_customer_request := jsonb_set(v_customer_request, '{resolved_at}', to_jsonb(now()), true);
    end if;
  end if;

  update public.orders
  set status = p_status,
      customer_request = v_customer_request,
      status_history = coalesce(status_history, '[]'::jsonb)
        || jsonb_build_array(jsonb_build_object('status', p_status, 'updated_at', now()))
  where id = p_order_id
  returning * into v_order;
  return v_order;
end;
$$;

revoke execute on function public.admin_set_order_status(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_order_status(uuid, text) to service_role;

create or replace function public.confirm_order_received(
  p_order_code text,
  p_customer_phone text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order
  from public.orders
  where order_code = p_order_code
    and customer_phone = p_customer_phone
  for update;

  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status <> 'delivered' then
    raise exception 'Order is not marked delivered';
  end if;
  if v_order.customer_received_at is not null then
    return v_order;
  end if;

  update public.orders
  set customer_received_at = now(),
      payment_status = case when payment_status = 'cod' then 'paid' else payment_status end,
      status_history = coalesce(status_history, '[]'::jsonb)
        || jsonb_build_array(jsonb_build_object('event', 'customer_received', 'status', 'delivered', 'updated_at', now()))
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke execute on function public.confirm_order_received(text, text) from public, anon, authenticated;
grant execute on function public.confirm_order_received(text, text) to service_role;

create or replace function public.admin_undo_order_status(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_history_length integer;
  v_last_event jsonb;
  v_previous_status text;
  v_stock_item record;
  v_current_stock integer;
  v_customer_request jsonb;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.customer_received_at is not null then
    raise exception 'Customer already confirmed receipt';
  end if;

  v_history_length := jsonb_array_length(coalesce(v_order.status_history, '[]'::jsonb));
  if v_history_length < 2 then
    raise exception 'No previous order status to undo';
  end if;

  v_last_event := v_order.status_history -> (v_history_length - 1);
  if coalesce(v_last_event->>'undo', 'false') = 'true'
    or v_last_event->>'event' = 'customer_received' then
    raise exception 'No status change to undo';
  end if;

  v_previous_status := v_order.status_history -> (v_history_length - 2) ->> 'status';
  if v_previous_status is null or v_previous_status = v_order.status then
    raise exception 'Previous order status is unavailable';
  end if;
  if not (
    (v_order.status = 'processing' and v_previous_status = 'pending')
    or (v_order.status = 'shipped' and v_previous_status in ('processing', 'paid'))
    or (v_order.status = 'delivered' and v_previous_status = 'shipped')
    or (v_order.status = 'cancelled' and v_previous_status in ('pending', 'processing'))
  ) then
    raise exception 'This order status cannot be undone';
  end if;

  if v_order.status = 'cancelled' then
    for v_stock_item in
      select (item.value->>'product_id')::uuid as product_id,
             sum((item.value->>'quantity')::integer)::integer as quantity
      from jsonb_array_elements(coalesce(v_order.items, '[]'::jsonb)) as item(value)
      where nullif(item.value->>'product_id', '') is not null
      group by 1
      order by 1
    loop
      select stock into v_current_stock
      from public.products
      where id = v_stock_item.product_id
      for update;

      if v_current_stock is null or v_current_stock < v_stock_item.quantity then
        raise exception 'Not enough stock to undo cancellation';
      end if;

      update public.products
      set stock = stock - v_stock_item.quantity
      where id = v_stock_item.product_id;
    end loop;
  end if;

  v_customer_request := v_order.customer_request;
  if v_order.status = 'cancelled' and v_customer_request->>'type' = 'cancel'
    and v_customer_request->>'status' = 'resolved' then
    v_customer_request := (v_customer_request - 'resolved_at') || '{"status":"pending"}'::jsonb;
  end if;

  update public.orders
  set status = v_previous_status,
      customer_request = v_customer_request,
      status_history = coalesce(status_history, '[]'::jsonb)
        || jsonb_build_array(jsonb_build_object(
          'status', v_previous_status,
          'undo', true,
          'undone_from', v_order.status,
          'updated_at', now()
        ))
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke execute on function public.admin_undo_order_status(uuid) from public, anon, authenticated;
grant execute on function public.admin_undo_order_status(uuid) to service_role;