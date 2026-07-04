-- ============================================================================
-- Miracle Natural — Supabase schema
--
-- How to apply this:
--   1. Go to your Supabase project dashboard -> SQL Editor -> New query.
--   2. Paste the entire contents of this file and run it.
--   3. Then run supabase/seed.sql to load the existing product catalog.
--
-- This creates: profiles, products, orders, order_items, all with Row Level
-- Security enabled so users can only see/modify their own data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES
-- One row per auth.users account, holding the extra fields collected at
-- signup (name, phone, optional default delivery address).
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  default_delivery_zone text check (default_delivery_zone in ('colombo_1_15', 'island_wide')),
  default_delivery_address text,
  role text not null default 'customer' check (role in ('customer', 'corporate_partner', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever someone signs up.
-- Reads the extra fields passed in supabase.auth.signUp({ options: { data } }).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, default_delivery_zone, default_delivery_address)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'default_delivery_zone',
    new.raw_user_meta_data ->> 'default_delivery_address'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. PRODUCTS
-- Mirrors src/data/productCatalog.js. `id` uses the same slugs already used
-- in the frontend so the two can be matched up later.
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  size text,
  price numeric(10, 2) not null,
  image_url text,
  description text,
  ingredients text,
  benefits text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products"
  on public.products for select
  using (is_active = true);

-- ----------------------------------------------------------------------------
-- 3. ORDERS
-- user_id is nullable so guest checkout (no account) keeps working exactly
-- like the current email-based Shop checkout.
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  payment_method text not null default 'cash_on_delivery',
  delivery_zone text not null check (delivery_zone in ('colombo_1_15', 'island_wide')),
  delivery_address text not null,
  subtotal numeric(10, 2) not null,
  shipping_cost numeric(10, 2) not null default 0,
  grand_total numeric(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Anyone can place an order" on public.orders;
create policy "Anyone can place an order"
  on public.orders for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
  on public.orders for select
  using (private.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update
  using (private.is_admin());

-- ----------------------------------------------------------------------------
-- 4. ORDER ITEMS
-- product_name/unit_price are captured at order time (denormalized) so an
-- order's history stays accurate even if a product's price changes later.
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  line_total numeric(10, 2) not null
);

alter table public.order_items enable row level security;

drop policy if exists "Users can view items from their own orders" on public.order_items;
create policy "Users can view items from their own orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

drop policy if exists "Anyone can add items to an order" on public.order_items;
create policy "Anyone can add items to an order"
  on public.order_items for insert
  with check (true);

drop policy if exists "Admins can view all order items" on public.order_items;
create policy "Admins can view all order items"
  on public.order_items for select
  using (private.is_admin());

-- ----------------------------------------------------------------------------
-- 5. ADMIN HELPER
-- private.is_admin() lives outside the `public` schema on purpose: it's used
-- inside RLS policies above, but must NOT be directly callable via the
-- PostgREST API (Supabase auto-exposes any function with EXECUTE granted in
-- an exposed schema as /rest/v1/rpc/<name>). Keeping it in `private` (not an
-- exposed schema) avoids that while still working fine inside policies.
-- ----------------------------------------------------------------------------
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, anon;

-- ----------------------------------------------------------------------------
-- 6. ADDRESSES
-- Multiple saved delivery addresses per customer, managed from the profile
-- page. set_default_address() flips the default atomically.
-- ----------------------------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null default 'Home',
  delivery_zone text not null check (delivery_zone in ('colombo_1_15', 'island_wide')),
  address_text text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.addresses enable row level security;

drop policy if exists "Users manage their own addresses" on public.addresses;
create policy "Users manage their own addresses"
  on public.addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_default_address(target_address_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update public.addresses set is_default = false, updated_at = now()
    where user_id = auth.uid() and is_default = true;
  update public.addresses set is_default = true, updated_at = now()
    where id = target_address_id and user_id = auth.uid();
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. WISHLIST ITEMS
-- ----------------------------------------------------------------------------
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.wishlist_items enable row level security;

drop policy if exists "Users manage their own wishlist" on public.wishlist_items;
create policy "Users manage their own wishlist"
  on public.wishlist_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 8. CONTACT MESSAGES — customer-to-admin messages
-- ----------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "Users can view their own messages" on public.contact_messages;
create policy "Users can view their own messages"
  on public.contact_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can send a message" on public.contact_messages;
create policy "Users can send a message"
  on public.contact_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins can view all messages" on public.contact_messages;
create policy "Admins can view all messages"
  on public.contact_messages for select
  using (private.is_admin());

drop policy if exists "Admins can update messages" on public.contact_messages;
create policy "Admins can update messages"
  on public.contact_messages for update
  using (private.is_admin());
