alter table public.products
  add column if not exists model_front_axis text not null default 'y'
  check (model_front_axis in ('x', 'y'));

update public.products
set model_front_axis = 'x'
where category = 'lược'
  and model_url <> '';