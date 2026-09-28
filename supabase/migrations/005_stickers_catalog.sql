create table if not exists public.stickers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  emoji text,
  image_url text,
  icon_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.stickers enable row level security;

-- Public catalog read, admin write.
drop policy if exists "stickers_select_public" on public.stickers;
create policy "stickers_select_public" on public.stickers
  for select using (true);

drop policy if exists "stickers_insert_admin" on public.stickers;
create policy "stickers_insert_admin" on public.stickers
  for insert with check (public.is_admin());

drop policy if exists "stickers_update_admin" on public.stickers;
create policy "stickers_update_admin" on public.stickers
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "stickers_delete_admin" on public.stickers;
create policy "stickers_delete_admin" on public.stickers
  for delete using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.stickers to anon, authenticated;
grant insert, update, delete on public.stickers to authenticated;

create index if not exists stickers_active_sort_idx on public.stickers (active, sort_order, created_at desc);
