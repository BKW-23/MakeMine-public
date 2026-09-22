create extension if not exists pgcrypto;

-- ===================== PROFILES =====================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role) values (new.id, 'user');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===================== IS_ADMIN HELPER =====================
-- security definer + search_path cố định để tránh (a) đệ quy vô hạn của RLS
-- và (b) lỗ hổng leo quyền qua search_path.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ===================== PRODUCTS =====================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text not null check (category in ('móc khoá','gương','lược','kẹp tóc','khác')),
  base_price integer not null check (base_price >= 0),
  short_description text,
  image_url text,
  customizable boolean not null default false,
  colors text[] not null default '{}',
  fonts text[] not null default '{}',
  featured boolean not null default false,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);

-- ===================== ORDERS =====================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  address text not null,
  items jsonb not null,
  total integer not null check (total >= 0),
  status text not null default 'pending'
    check (status in ('pending','paid','shipped','delivered','cancelled')),
  preview_confirmed boolean not null default false,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ===================== CHAT_SUGGESTIONS =====================
create table if not exists public.chat_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_query text,
  occasion text,
  recipient text,
  budget text,
  suggested_product_ids uuid[],
  suggestions jsonb,
  created_at timestamptz not null default now()
);

-- ===================== RLS =====================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.chat_suggestions enable row level security;

-- profiles: đọc chính mình, admin đọc/sửa tất cả
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- products: public đọc, chỉ admin ghi
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products
  for select using (true);
drop policy if exists "products_write_admin" on public.products;
create policy "products_write_admin" on public.products
  for insert with check (public.is_admin());
drop policy if exists "products_update_admin" on public.products;
create policy "products_update_admin" on public.products
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "products_delete_admin" on public.products;
create policy "products_delete_admin" on public.products
  for delete using (public.is_admin());

-- orders: bất kỳ ai cũng tạo được, chỉ admin đọc/sửa qua client
drop policy if exists "orders_insert_anyone" on public.orders;
create policy "orders_insert_anyone" on public.orders
  for insert with check (true);
drop policy if exists "orders_select_admin" on public.orders;
create policy "orders_select_admin" on public.orders
  for select using (public.is_admin());
drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- chat_suggestions: chỉ insert, không ai select qua client
drop policy if exists "chat_suggestions_insert_anyone" on public.chat_suggestions;
create policy "chat_suggestions_insert_anyone" on public.chat_suggestions
  for insert with check (true);

-- ===================== GRANTS =====================
-- RLS chỉ lọc HÀNG; phải GRANT quyền ở tầng bảng thì client mới chạm được bảng.
grant usage on schema public to anon, authenticated;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

grant insert on public.orders to anon, authenticated;
grant select, update on public.orders to authenticated;

grant insert on public.chat_suggestions to anon, authenticated;

grant select, update on public.profiles to authenticated;
