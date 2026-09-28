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

insert into public.stickers (slug, label, emoji, image_url, icon_url, active, sort_order)
values
  ('bow', 'Nơ xinh xinh', '🎀', '/stickers/bow.jpg', null, true, 0),
  ('heart', 'Tim tí hon', '♡', '/stickers/heart.jpg', null, true, 10),
  ('hello-kitty', 'Kitty miu miu', '♡', '/stickers/hello-kitty.jpg', null, true, 20),
  ('star', 'Sao lấp lánh', '★', '/stickers/star.jpg', null, true, 30),
  ('bear', 'Gấu mũm mĩm', '🐻', '/stickers/bear.jpg', '/stickers/bear-icon.png', true, 40),
  ('sparkle', 'Lấp la lấp lánh', '✦', '/stickers/sparkle.jpg', null, true, 50)
on conflict (slug) do update
set label = excluded.label,
    emoji = excluded.emoji,
    image_url = excluded.image_url,
    icon_url = excluded.icon_url,
    active = excluded.active,
    sort_order = excluded.sort_order;

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
