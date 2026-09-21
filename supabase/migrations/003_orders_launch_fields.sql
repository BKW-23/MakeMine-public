do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'products'
      and c.conname = 'products_stock_nonneg'
  ) then
    alter table public.products
      add constraint products_stock_nonneg check (stock >= 0) not valid;
  end if;

  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'products'
      and c.conname = 'products_stock_nonneg'
  ) then
    alter table public.products validate constraint products_stock_nonneg;
  end if;
end $$;

alter table public.orders
  add column if not exists shipping_fee integer not null default 0,
  add column if not exists discount integer not null default 0,
  add column if not exists customization_fee integer not null default 0,
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','cod','failed')),
  add column if not exists order_notes text,
  add column if not exists status_history jsonb not null default '[]'::jsonb;

create or replace function public.create_order_with_stock_update(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_address text,
  p_items jsonb,
  p_total integer,
  p_preview_confirmed boolean,
  p_user_id uuid,
  p_order_notes text,
  p_shipping_fee integer,
  p_discount integer,
  p_customization_fee integer,
  p_payment_status text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_product_id uuid;
  v_quantity integer;
  v_stock integer;
  v_order_code text;
begin
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Order items must be an array';
  end if;

  if coalesce(jsonb_array_length(p_items), 0) = 0 then
    raise exception 'Order items are required';
  end if;

  if p_customer_name is null or length(trim(p_customer_name)) = 0 then
    raise exception 'Customer name is required';
  end if;

  if p_customer_phone is null or length(trim(p_customer_phone)) = 0 then
    raise exception 'Customer phone is required';
  end if;

  if p_address is null or length(trim(p_address)) = 0 then
    raise exception 'Address is required';
  end if;

  for v_product_id, v_quantity in
    select (i->>'product_id')::uuid, sum((i->>'quantity')::int)
    from jsonb_array_elements(p_items) i
    group by 1
    order by 1
  loop
    if v_product_id is null then
      raise exception 'Each order item requires a valid product_id';
    end if;

    select stock into v_stock
    from public.products
    where id = v_product_id
    for update;

    if v_stock is null then
      raise exception 'Product not found';
    end if;

    if v_stock < v_quantity then
      raise exception 'Out of stock for product %', v_product_id;
    end if;

    update public.products
    set stock = stock - v_quantity
    where id = v_product_id;
  end loop;

  v_order_code := 'MM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.orders (
    order_code,
    customer_name,
    customer_phone,
    customer_email,
    address,
    items,
    total,
    status,
    preview_confirmed,
    user_id,
    order_notes,
    shipping_fee,
    discount,
    customization_fee,
    payment_status,
    status_history
  )
  values (
    v_order_code,
    trim(p_customer_name),
    trim(p_customer_phone),
    nullif(trim(p_customer_email), ''),
    trim(p_address),
    p_items,
    coalesce(p_total, 0),
    'pending',
    coalesce(p_preview_confirmed, false),
    p_user_id,
    nullif(trim(p_order_notes), ''),
    coalesce(p_shipping_fee, 0),
    coalesce(p_discount, 0),
    coalesce(p_customization_fee, 0),
    coalesce(p_payment_status, 'pending'),
    jsonb_build_array(jsonb_build_object('status', 'pending', 'updated_at', now()))
  )
  returning * into v_order;

  return v_order;
end;
$$;

revoke execute on function public.create_order_with_stock_update(
  text,
  text,
  text,
  text,
  jsonb,
  integer,
  boolean,
  uuid,
  text,
  integer,
  integer,
  integer,
  text
) from public, anon, authenticated;

grant execute on function public.create_order_with_stock_update(
  text,
  text,
  text,
  text,
  jsonb,
  integer,
  boolean,
  uuid,
  text,
  integer,
  integer,
  integer,
  text
) to service_role;
