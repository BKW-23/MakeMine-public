alter table public.products
  drop constraint if exists products_model_front_axis_check;

alter table public.products
  add constraint products_model_front_axis_check
  check (model_front_axis in ('x', 'y', 'z'));

update public.products
set model_front_axis = 'z'
where category = 'lược'
  and model_url <> '';