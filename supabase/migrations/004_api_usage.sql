create table if not exists public.api_usage_daily (
  provider text not null,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  last_used_at timestamptz,
  primary key (provider, usage_date)
);

alter table public.api_usage_daily enable row level security;
revoke all on public.api_usage_daily from anon, authenticated;

create or replace function public.increment_api_usage(p_provider text, p_success boolean default true)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.api_usage_daily (provider, usage_date, request_count, error_count, last_used_at)
  values (trim(p_provider), current_date, 1, case when p_success then 0 else 1 end, now())
  on conflict (provider, usage_date) do update set
    request_count = public.api_usage_daily.request_count + 1,
    error_count = public.api_usage_daily.error_count + case when p_success then 0 else 1 end,
    last_used_at = now();
$$;

revoke execute on function public.increment_api_usage(text, boolean) from public, anon, authenticated;
grant execute on function public.increment_api_usage(text, boolean) to service_role;