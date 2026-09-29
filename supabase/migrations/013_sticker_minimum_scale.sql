alter table public.stickers
  drop constraint if exists stickers_default_scale_check;

alter table public.stickers
  add constraint stickers_default_scale_check
  check (default_scale between 0.1 and 2.5);