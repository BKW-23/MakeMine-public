-- Security hardening for the migration generated from the Base44 entity specs.
-- Customer data is never readable by anon/authenticated clients; server endpoints
-- use the service role only after applying their own validation/auth checks.

revoke all on public.orders from anon;
revoke select, update on public.orders from authenticated;
grant insert on public.orders to anon, authenticated;

revoke all on public.chat_suggestions from anon, authenticated;

drop policy if exists "orders_select_admin" on public.orders;
create policy "orders_select_admin" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "orders_insert_anyone" on public.orders;
create policy "orders_insert_anyone" on public.orders
  for insert to anon, authenticated
  with check (
    length(customer_name) between 1 and 120
    and length(customer_phone) between 7 and 30
    and length(address) between 1 and 300
    and jsonb_typeof(items) = 'array'
    and total >= 0
  );

create index if not exists orders_order_code_idx on public.orders (order_code);
create index if not exists orders_customer_phone_idx on public.orders (customer_phone);
