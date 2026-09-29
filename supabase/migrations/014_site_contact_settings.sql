create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
grant all on public.site_settings to service_role;

insert into public.site_settings (key, value)
values (
  'contact',
  '{"address":"ĐH FPT, TP. Hà Nội","email":"hotro@makemine.vn","tiktok":"makemine"}'::jsonb
)
on conflict (key) do nothing;