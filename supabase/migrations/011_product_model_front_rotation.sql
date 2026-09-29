alter table public.products
  add column if not exists model_front_rotation smallint not null default 0;

alter table public.products
  drop constraint if exists products_model_front_rotation_check;

alter table public.products
  add constraint products_model_front_rotation_check
  check (model_front_rotation between -180 and 180);