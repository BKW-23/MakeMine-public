alter table public.stickers
  add column if not exists default_scale numeric(2, 1) not null default 1;

alter table public.stickers
  drop constraint if exists stickers_default_scale_check;

alter table public.stickers
  add constraint stickers_default_scale_check
  check (default_scale between 0.5 and 2.5);