-- ============================================================================
-- Miracle Natural — Supabase schema
--
-- How to apply: paste this whole file into the Supabase SQL Editor and run
-- it, then run supabase/seed.sql for the product catalog.
--
-- Creates profiles, products, orders, order_items, etc, all with Row Level
-- Security so users only see/change their own data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES
-- Extra signup fields (name, phone, default address) for each auth user.
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

-- Auto-creates a profile row on signup, from the extra signup fields.
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
-- 2. ADMIN HELPER
-- Kept in `private`, not `public`, so it can't be called directly over the
-- API — only used inside other policies/functions.
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
-- 3. PRODUCTS
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  size text,
  price numeric(10, 2) not null,
  -- Optional "was" price for a sale badge.
  compare_at_price numeric(10, 2),
  image_url text,
  description text,
  ingredients text,
  benefits text,
  is_active boolean not null default true,
  -- Which storefront this belongs to.
  brand text not null default 'miracle_natural'
    check (brand in ('miracle_natural', 'laira', 'leora_wellness')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_compare_at_price_check
    check (compare_at_price is null or compare_at_price > price)
);

create index if not exists products_brand_idx on public.products (brand);

alter table public.products enable row level security;

drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products"
  on public.products for select
  using (is_active = true);

-- Admins also see deactivated products.
drop policy if exists "Admins can view all products" on public.products;
create policy "Admins can view all products"
  on public.products for select
  using (private.is_admin());

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
  on public.products for insert
  with check (private.is_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update
  using (private.is_admin());

-- Real delete — safe, other tables either null out or cascade product_id.
drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  using (private.is_admin());

-- ----------------------------------------------------------------------------
-- 4. ORDERS
-- user_id is nullable so guest checkout still works.
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
  -- Retail vs. wholesale/bulk order.
  channel text not null default 'retail' check (channel in ('retail', 'b2b')),
  -- Which storefront the order came from.
  brand text not null default 'miracle_natural'
    check (brand in ('miracle_natural', 'laira', 'leora_wellness')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists orders_brand_idx on public.orders (brand);

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
-- 5. ORDER ITEMS
-- Name/price copied at order time so history stays accurate later.
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
-- 6. ADDRESSES
-- Saved delivery addresses, managed from the profile page.
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

-- Flips the default address atomically.
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

-- ----------------------------------------------------------------------------
-- 9. INVENTORY — retail/wholesale pools + raw materials
-- product_inventory is the real source of stock now; the columns on
-- products below are old and unused.
-- ----------------------------------------------------------------------------
alter table public.products
  add column if not exists stock_count integer not null default 0 check (stock_count >= 0),
  add column if not exists low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0);

create table if not exists public.product_inventory (
  product_id text not null references public.products (id) on delete cascade,
  pool text not null check (pool in ('retail', 'wholesale')),
  stock_count integer not null default 0 check (stock_count >= 0),
  low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, pool)
);

alter table public.product_inventory enable row level security;

-- Admin-only — stock isn't shown to customers.
drop policy if exists "Admins can view all inventory" on public.product_inventory;
create policy "Admins can view all inventory"
  on public.product_inventory for select
  using (private.is_admin());

drop policy if exists "Admins can insert inventory rows" on public.product_inventory;
create policy "Admins can insert inventory rows"
  on public.product_inventory for insert
  with check (private.is_admin());

drop policy if exists "Admins can update inventory" on public.product_inventory;
create policy "Admins can update inventory"
  on public.product_inventory for update
  using (private.is_admin());

-- Creates both pool rows automatically for every new product.
create or replace function private.ensure_product_inventory_rows()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.product_inventory (product_id, pool, stock_count, low_stock_threshold)
  values (new.id, 'retail', 0, 10), (new.id, 'wholesale', 0, 10)
  on conflict (product_id, pool) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ensure_product_inventory on public.products;
create trigger trg_ensure_product_inventory
  after insert on public.products
  for each row execute function private.ensure_product_inventory_rows();

-- Raw materials: separate, simpler stock tracking for manufacturing
-- ingredients. Admin-managed, manual adjustments only.
create table if not exists public.raw_materials (
  id text primary key,
  name text not null,
  unit text not null default 'units',
  stock_count numeric(10, 2) not null default 0 check (stock_count >= 0),
  low_stock_threshold numeric(10, 2) not null default 0 check (low_stock_threshold >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.raw_materials enable row level security;

drop policy if exists "Admins manage raw materials" on public.raw_materials;
create policy "Admins manage raw materials"
  on public.raw_materials for all
  using (private.is_admin())
  with check (private.is_admin());

-- Decrements stock on checkout. inventory_adjusted flag stops it running
-- twice for the same order.
alter table public.orders
  add column if not exists inventory_adjusted boolean not null default false;

-- PayHere online payments. payment_status is separate from the fulfillment
-- `status` column — an order can be paid but not yet shipped. COD orders
-- default to 'not_required' since there's no gateway involved.
alter table public.orders
  add column if not exists payment_status text not null default 'not_required'
    check (payment_status in ('not_required', 'pending', 'paid', 'failed', 'cancelled', 'chargedback')),
  add column if not exists payhere_payment_id text;

create or replace function public.decrement_inventory_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_channel text;
begin
  update public.orders
    set inventory_adjusted = true
    where id = p_order_id and inventory_adjusted = false
    returning channel into v_channel;

  if not found or v_channel is null then
    -- Already adjusted, or order doesn't exist.
    return;
  end if;

  update public.product_inventory pi
    set stock_count = greatest(0, pi.stock_count - oi.quantity),
        updated_at = now()
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.product_id = pi.product_id
      and pi.pool = (case when v_channel = 'b2b' then 'wholesale' else 'retail' end);
end;
$$;

revoke all on function public.decrement_inventory_for_order(uuid) from public;
grant execute on function public.decrement_inventory_for_order(uuid) to authenticated, anon;

-- ----------------------------------------------------------------------------
-- 10. BUNDLES + BUNDLE_ITEMS
-- ----------------------------------------------------------------------------
create table if not exists public.bundles (
  id text primary key,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  points text[] not null default '{}',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bundles enable row level security;

drop policy if exists "Anyone can view active bundles" on public.bundles;
create policy "Anyone can view active bundles"
  on public.bundles for select
  using (is_active = true);

drop policy if exists "Admins can view all bundles" on public.bundles;
create policy "Admins can view all bundles"
  on public.bundles for select
  using (private.is_admin());

drop policy if exists "Admins can insert bundles" on public.bundles;
create policy "Admins can insert bundles"
  on public.bundles for insert
  with check (private.is_admin());

drop policy if exists "Admins can update bundles" on public.bundles;
create policy "Admins can update bundles"
  on public.bundles for update
  using (private.is_admin());

create table if not exists public.bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id text not null references public.bundles (id) on delete cascade,
  product_id text not null references public.products (id),
  quantity integer not null default 1 check (quantity > 0),
  unique (bundle_id, product_id)
);

alter table public.bundle_items enable row level security;

drop policy if exists "Anyone can view items of active bundles" on public.bundle_items;
create policy "Anyone can view items of active bundles"
  on public.bundle_items for select
  using (
    exists (
      select 1 from public.bundles
      where bundles.id = bundle_items.bundle_id
      and bundles.is_active = true
    )
  );

drop policy if exists "Admins can view all bundle items" on public.bundle_items;
create policy "Admins can view all bundle items"
  on public.bundle_items for select
  using (private.is_admin());

drop policy if exists "Admins can insert bundle items" on public.bundle_items;
create policy "Admins can insert bundle items"
  on public.bundle_items for insert
  with check (private.is_admin());

drop policy if exists "Admins can update bundle items" on public.bundle_items;
create policy "Admins can update bundle items"
  on public.bundle_items for update
  using (private.is_admin());

drop policy if exists "Admins can delete bundle items" on public.bundle_items;
create policy "Admins can delete bundle items"
  on public.bundle_items for delete
  using (private.is_admin());

-- ----------------------------------------------------------------------------
-- 11. QUOTATIONS + QUOTATION_ITEMS
-- Corporate partners request a formal quote instead of ordering outright.
-- Status flow: requested -> quoted -> accepted/declined.
-- ----------------------------------------------------------------------------
create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'quoted', 'accepted', 'declined')),
  customer_notes text,
  admin_notes text,
  quoted_total numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quotations enable row level security;

drop policy if exists "Corporate partners can request quotations" on public.quotations;
create policy "Corporate partners can request quotations"
  on public.quotations for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('corporate_partner', 'admin')
    )
  );

drop policy if exists "Users can view their own quotations" on public.quotations;
create policy "Users can view their own quotations"
  on public.quotations for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all quotations" on public.quotations;
create policy "Admins can view all quotations"
  on public.quotations for select
  using (private.is_admin());

drop policy if exists "Admins can update quotations" on public.quotations;
create policy "Admins can update quotations"
  on public.quotations for update
  using (private.is_admin())
  with check (private.is_admin());

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  quoted_unit_price numeric(10, 2),
  quoted_line_total numeric(10, 2)
);

alter table public.quotation_items enable row level security;

drop policy if exists "Owners can add items to their own quotation" on public.quotation_items;
create policy "Owners can add items to their own quotation"
  on public.quotation_items for insert
  with check (
    exists (
      select 1 from public.quotations
      where quotations.id = quotation_items.quotation_id
      and quotations.user_id = auth.uid()
    )
  );

drop policy if exists "Owners can view items of their own quotation" on public.quotation_items;
create policy "Owners can view items of their own quotation"
  on public.quotation_items for select
  using (
    exists (
      select 1 from public.quotations
      where quotations.id = quotation_items.quotation_id
      and quotations.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can view all quotation items" on public.quotation_items;
create policy "Admins can view all quotation items"
  on public.quotation_items for select
  using (private.is_admin());

drop policy if exists "Admins can update quotation items" on public.quotation_items;
create policy "Admins can update quotation items"
  on public.quotation_items for update
  using (private.is_admin())
  with check (private.is_admin());

-- ----------------------------------------------------------------------------
-- 12. AI_CONVERSATIONS + AI_MESSAGES
-- History for the support chatbot. Only the chatbot's Edge Function (via
-- the service-role key) reads/writes these — no client-facing policies.
-- ----------------------------------------------------------------------------
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  session_id text,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

alter table public.ai_conversations enable row level security;

drop policy if exists "Admins can view all ai conversations" on public.ai_conversations;
create policy "Admins can view all ai conversations"
  on public.ai_conversations for select
  using (private.is_admin());

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_messages enable row level security;

drop policy if exists "Admins can view all ai messages" on public.ai_messages;
create policy "Admins can view all ai messages"
  on public.ai_messages for select
  using (private.is_admin());

-- ----------------------------------------------------------------------------
-- 13. ANALYTICS_EVENTS
-- Write-only event log, admin-only to read. Not used by the analytics
-- dashboard yet (that reads orders directly) — for future use.
-- ----------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references auth.users (id) on delete set null,
  session_id text,
  product_id text references public.products (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

drop policy if exists "Anyone can log an analytics event" on public.analytics_events;
create policy "Anyone can log an analytics event"
  on public.analytics_events for insert
  with check (true);

drop policy if exists "Admins can view analytics events" on public.analytics_events;
create policy "Admins can view analytics events"
  on public.analytics_events for select
  using (private.is_admin());

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_type_idx on public.analytics_events (event_type);

-- ----------------------------------------------------------------------------
-- 14. B2B PRICING MATRIX ENGINE
-- ----------------------------------------------------------------------------
create or replace function private.is_corporate_partner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'corporate_partner'
  );
$$;

revoke all on function private.is_corporate_partner() from public;
grant execute on function private.is_corporate_partner() to authenticated, anon;

-- Per-product MOQ override. Null falls back to 25.
alter table public.products
  add column if not exists moq integer;

alter table public.products
  add constraint products_moq_check check (moq is null or moq > 0);

-- Quantity breakpoints for wholesale discounts. Global for all products.
create table if not exists public.discount_tiers (
  id uuid primary key default gen_random_uuid(),
  min_quantity integer not null check (min_quantity > 0),
  discount_percent numeric(5, 2) not null check (discount_percent > 0 and discount_percent <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (min_quantity)
);

alter table public.discount_tiers enable row level security;

-- Only admin/corporate partner can see wholesale pricing.
drop policy if exists "B2B roles can view discount tiers" on public.discount_tiers;
create policy "B2B roles can view discount tiers"
  on public.discount_tiers for select
  using (private.is_admin() or private.is_corporate_partner());

drop policy if exists "Admins can insert discount tiers" on public.discount_tiers;
create policy "Admins can insert discount tiers"
  on public.discount_tiers for insert
  with check (private.is_admin());

drop policy if exists "Admins can update discount tiers" on public.discount_tiers;
create policy "Admins can update discount tiers"
  on public.discount_tiers for update
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "Admins can delete discount tiers" on public.discount_tiers;
create policy "Admins can delete discount tiers"
  on public.discount_tiers for delete
  using (private.is_admin());

-- Single source of truth for B2B pricing — used by the frontend directly.
-- SECURITY DEFINER so it can check eligibility itself and still return a
-- real (non-discounted) response for regular customers.
create or replace function public.calculate_b2b_price(p_product_id text, p_quantity integer)
returns table (
  base_price numeric,
  moq integer,
  requested_quantity integer,
  is_eligible boolean,
  meets_moq boolean,
  applied_discount_percent numeric,
  unit_price numeric,
  line_total numeric,
  next_tier_min_quantity integer,
  next_tier_discount_percent numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_base_price numeric;
  v_moq integer;
  v_effective_moq integer;
  v_is_eligible boolean;
  v_discount numeric;
  v_next_min integer;
  v_next_discount numeric;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be a positive integer';
  end if;

  select price, products.moq into v_base_price, v_moq
  from public.products
  where id = p_product_id and is_active = true;

  if not found then
    raise exception 'Product % not found or inactive', p_product_id;
  end if;

  v_effective_moq := coalesce(v_moq, 25);
  v_is_eligible := private.is_admin() or private.is_corporate_partner();

  if not v_is_eligible then
    return query select
      v_base_price, v_effective_moq, p_quantity,
      false, (p_quantity >= v_effective_moq),
      0::numeric, v_base_price, round(v_base_price * p_quantity, 2),
      null::integer, null::numeric;
    return;
  end if;

  if p_quantity < v_effective_moq then
    return query select
      v_base_price, v_effective_moq, p_quantity,
      true, false,
      0::numeric, v_base_price, round(v_base_price * p_quantity, 2),
      null::integer, null::numeric;
    return;
  end if;

  select discount_percent into v_discount
  from public.discount_tiers
  where is_active = true and min_quantity <= p_quantity
  order by min_quantity desc
  limit 1;

  v_discount := coalesce(v_discount, 0);

  select min_quantity, discount_percent into v_next_min, v_next_discount
  from public.discount_tiers
  where is_active = true and min_quantity > p_quantity
  order by min_quantity asc
  limit 1;

  return query select
    v_base_price, v_effective_moq, p_quantity,
    true, true,
    v_discount, round(v_base_price * (1 - v_discount / 100), 2), round(v_base_price * (1 - v_discount / 100) * p_quantity, 2),
    v_next_min, v_next_discount;
end;
$$;

revoke all on function public.calculate_b2b_price(text, integer) from public;
grant execute on function public.calculate_b2b_price(text, integer) to authenticated, anon;

-- Starter tiers, editable later.
insert into public.discount_tiers (min_quantity, discount_percent)
values (50, 10), (100, 15), (250, 20)
on conflict (min_quantity) do update set discount_percent = excluded.discount_percent;

-- ----------------------------------------------------------------------------
-- 15. CORPORATE_PARTNER_APPLICATIONS
-- "Apply for a business account" form. Approving one flips the applicant's
-- role to corporate_partner.
-- ----------------------------------------------------------------------------
create table if not exists public.corporate_partner_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  business_name text not null,
  registration_number text not null,
  contact_person text not null,
  contact_phone text not null,
  contact_email text not null,
  estimated_order_volume text not null,
  delivery_region text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one pending application per user at a time.
create unique index if not exists corporate_partner_applications_one_pending_per_user
  on public.corporate_partner_applications (user_id)
  where status = 'pending';

alter table public.corporate_partner_applications enable row level security;

drop policy if exists "Users can submit their own application" on public.corporate_partner_applications;
create policy "Users can submit their own application"
  on public.corporate_partner_applications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own applications" on public.corporate_partner_applications;
create policy "Users can view their own applications"
  on public.corporate_partner_applications for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all applications" on public.corporate_partner_applications;
create policy "Admins can view all applications"
  on public.corporate_partner_applications for select
  using (private.is_admin());

-- No update/delete policy for anyone — status changes only go through
-- review_corporate_partner_application() below.

-- The only way to approve/reject an application.
create or replace function public.review_corporate_partner_application(
  p_application_id uuid,
  p_decision text,
  p_admin_notes text default null
)
returns public.corporate_partner_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.corporate_partner_applications;
begin
  if not private.is_admin() then
    raise exception 'Only admins can review corporate partner applications';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be either ''approved'' or ''rejected''';
  end if;

  update public.corporate_partner_applications
  set status = p_decision,
      admin_notes = p_admin_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id
  returning * into v_result;

  if not found then
    raise exception 'Application % not found', p_application_id;
  end if;

  if p_decision = 'approved' then
    update public.profiles
    set role = 'corporate_partner', updated_at = now()
    where id = v_result.user_id;
  end if;

  return v_result;
end;
$$;

revoke all on function public.review_corporate_partner_application(uuid, text, text) from public;
grant execute on function public.review_corporate_partner_application(uuid, text, text) to authenticated, anon;

-- ----------------------------------------------------------------------------
-- 16. SUPERADMIN ROLE + ACCOUNT MANAGEMENT
-- A rank above admin. is_admin() treats superadmin as admin too, so
-- existing admin checks extend automatically.
-- ----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'corporate_partner', 'admin', 'superadmin'));

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

create or replace function private.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  );
$$;

revoke all on function private.is_superadmin() from public;
grant execute on function private.is_superadmin() to authenticated, anon;

-- Account directory for /admin/accounts. Joins auth.users for email since
-- profiles doesn't store it.
create or replace function public.list_accounts_for_admin(
  p_search text default null,
  p_role_filter text default null
)
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not private.is_superadmin() then
    raise exception 'Only superadmins can list accounts';
  end if;

  return query
    select p.id, u.email::text, p.full_name, p.phone, p.role, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where
      (p_role_filter is null or p_role_filter = 'all' or p.role = p_role_filter)
      and (
        p_search is null or trim(p_search) = ''
        or p.full_name ilike '%' || trim(p_search) || '%'
        or u.email ilike '%' || trim(p_search) || '%'
      )
    order by p.created_at desc;
end;
$$;

revoke all on function public.list_accounts_for_admin(text, text) from public;
grant execute on function public.list_accounts_for_admin(text, text) to authenticated, anon;

-- The only way to change someone's role. Won't demote the last superadmin.
create or replace function public.update_account_role(
  p_user_id uuid,
  p_new_role text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_role text;
  v_other_superadmins integer;
  v_result public.profiles;
begin
  if not private.is_superadmin() then
    raise exception 'Only superadmins can change account roles';
  end if;

  if p_new_role not in ('customer', 'corporate_partner', 'admin', 'superadmin') then
    raise exception 'Invalid role: %', p_new_role;
  end if;

  select role into v_current_role from public.profiles where id = p_user_id;

  if not found then
    raise exception 'Account % not found', p_user_id;
  end if;

  if v_current_role = 'superadmin' and p_new_role <> 'superadmin' then
    select count(*) into v_other_superadmins
    from public.profiles
    where role = 'superadmin' and id <> p_user_id;

    if v_other_superadmins = 0 then
      raise exception 'Cannot remove the last superadmin';
    end if;
  end if;

  update public.profiles
  set role = p_new_role, updated_at = now()
  where id = p_user_id
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.update_account_role(uuid, text) from public;
grant execute on function public.update_account_role(uuid, text) to authenticated, anon;

-- ----------------------------------------------------------------------------
-- 17. ADMIN PROFILE VISIBILITY
-- Lets admins look up a customer's profile (e.g. for quotation requests).
-- ----------------------------------------------------------------------------
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (private.is_admin());

-- ----------------------------------------------------------------------------
-- 18. LOW-STOCK ALERTS
-- Posts a system message to /admin/messages when a pool crosses below its
-- threshold. Only fires on the crossing, not every update, so it doesn't
-- spam once something's already low.
-- ----------------------------------------------------------------------------
create or replace function private.notify_low_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_name text;
begin
  if new.stock_count <= new.low_stock_threshold
     and old.stock_count > old.low_stock_threshold then
    select name into v_product_name from public.products where id = new.product_id;

    insert into public.contact_messages (user_id, customer_name, customer_email, subject, message, status)
    values (
      null,
      'Inventory Alert System',
      'system@inventory.alerts',
      'Low Stock Alert: ' || coalesce(v_product_name, new.product_id) || ' (' || new.pool || ')',
      coalesce(v_product_name, new.product_id) || '''s ' || new.pool || ' pool has dropped to ' ||
        new.stock_count || ' unit' || (case when new.stock_count = 1 then '' else 's' end) ||
        ', at or below its low-stock threshold of ' || new.low_stock_threshold || ' units. Restock soon to avoid running out.',
      'new'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_low_stock on public.product_inventory;
create trigger trg_notify_low_stock
  after update on public.product_inventory
  for each row execute function private.notify_low_stock();

-- ----------------------------------------------------------------------------
-- 19. CART ITEMS — per-account cart persistence
-- Signed-out carts stay local (localStorage). Signed-in carts also save
-- here so the cart follows the customer across devices.
-- ----------------------------------------------------------------------------
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  brand text not null check (brand in ('miracle_natural', 'laira')),
  product_id text not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  updated_at timestamptz not null default now(),
  unique (user_id, brand, product_id)
);

alter table public.cart_items enable row level security;

drop policy if exists "Users manage their own cart" on public.cart_items;
create policy "Users manage their own cart"
  on public.cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
