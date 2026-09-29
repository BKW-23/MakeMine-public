create or replace function public.add_product_stock(
  p_product_id uuid,
  p_quantity integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock integer;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 1000000 then
    raise exception 'Stock addition must be between 1 and 1000000';
  end if;

  update public.products
  set stock = stock + p_quantity
  where id = p_product_id
  returning stock into v_stock;

  if not found then
    raise exception 'Product not found';
  end if;

  return v_stock;
end;
$$;

revoke execute on function public.add_product_stock(uuid, integer) from public, anon, authenticated;
grant execute on function public.add_product_stock(uuid, integer) to service_role;