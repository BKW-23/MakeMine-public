alter table public.orders
  add column if not exists customer_request jsonb not null default '{}'::jsonb;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled'));

update public.orders
set status = 'processing'
where status = 'paid'
  and payment_status = 'cod';

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
      payment_status = case
        when p_status = 'delivered' and v_order.payment_status = 'cod' then 'paid'
        else payment_status
      end,
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

create or replace function public.submit_order_customer_request(
  p_order_code text,
  p_customer_phone text,
  p_type text,
  p_message text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_request jsonb;
begin
  if p_type not in ('edit', 'cancel') then raise exception 'Invalid customer request type'; end if;
  if p_type = 'edit' and length(trim(coalesce(p_message, ''))) = 0 then
    raise exception 'Please describe the requested change';
  end if;

  select * into v_order
  from public.orders
  where order_code = p_order_code and customer_phone = p_customer_phone
  for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status not in ('pending', 'processing') then raise exception 'Order is no longer editable'; end if;
  if v_order.customer_request->>'status' = 'pending' then raise exception 'A customer request is already pending'; end if;

  v_request := jsonb_build_object(
    'type', p_type,
    'message', left(trim(coalesce(p_message, '')), 500),
    'status', 'pending',
    'requested_at', now()
  );
  update public.orders set customer_request = v_request where id = v_order.id returning * into v_order;
  return v_order;
end;
$$;

revoke execute on function public.submit_order_customer_request(text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_order_customer_request(text, text, text, text) to service_role;

create or replace function public.admin_resolve_order_request(
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
begin
  if p_status not in ('resolved', 'rejected') then raise exception 'Invalid customer request status'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.customer_request->>'status' <> 'pending' then raise exception 'No pending customer request'; end if;
  if v_order.customer_request->>'type' = 'cancel' and p_status = 'resolved' then
    raise exception 'Cancel the order to resolve a cancellation request';
  end if;

  update public.orders
  set customer_request = jsonb_set(
    jsonb_set(v_order.customer_request, '{status}', to_jsonb(p_status), true),
    '{resolved_at}', to_jsonb(now()), true
  )
  where id = p_order_id
  returning * into v_order;
  return v_order;
end;
$$;

revoke execute on function public.admin_resolve_order_request(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_resolve_order_request(uuid, text) to service_role;