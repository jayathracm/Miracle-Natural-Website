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
-- 2. ADMIN HELPER
-- private.is_admin() lives outside the `public` schema on purpose: it's used
-- inside RLS policies throughout this file, but must NOT be directly
-- callable via the PostgREST API (Supabase auto-exposes any function with
-- EXECUTE granted in an exposed schema as /rest/v1/rpc/<name>). Keeping it
-- in `private` (not an exposed schema) avoids that while still working fine
-- inside policies. Defined early, right after profiles, since every table
-- below this point references it in an admin policy.
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
-- Mirrors src/data/productCatalog.js. `id` uses the same slugs already used
-- in the frontend so the two can be matched up later.
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  size text,
  price numeric(10, 2) not null,
  -- Optional "was" price. When set (and > price), the storefront shows a
  -- real SALE badge + a struck-through original price — never fabricated,
  -- since it's just another product column an admin sets.
  compare_at_price numeric(10, 2),
  image_url text,
  description text,
  ingredients text,
  benefits text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_compare_at_price_check
    check (compare_at_price is null or compare_at_price > price)
);

alter table public.products enable row level security;

drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products"
  on public.products for select
  using (is_active = true);

-- Admins manage the full catalog, including deactivated products the policy
-- above hides from everyone else.
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

-- Permanent delete. Safe against orphaning: order_items/quotation_items/
-- analytics_events.product_id are ON DELETE SET NULL (and already store
-- their own denormalized product_name/unit_price at transaction time),
-- wishlist_items.product_id is ON DELETE CASCADE. bundle_items.product_id
-- has no ON DELETE action (defaults to RESTRICT), so deleting a product
-- still used in a bundle correctly fails until it's removed from the bundle.
drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  using (private.is_admin());

-- ----------------------------------------------------------------------------
-- 4. ORDERS
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
  -- Distinguishes B2B/bulk orders from retail (functional-requirements §2.3).
  -- Set by the checkout flow itself based on the signed-in user's role at
  -- the moment of purchase — not something the client can misreport in a
  -- way that matters, since it's purely a reporting/filtering label, not an
  -- authorization boundary.
  channel text not null default 'retail' check (channel in ('retail', 'b2b')),
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
-- 5. ORDER ITEMS
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

-- ----------------------------------------------------------------------------
-- 9. INVENTORY — multi-pool (retail / wholesale) + raw materials
-- Supersedes the original single-pool design. products.stock_count/
-- low_stock_threshold below are left in place (never wired to anything) for
-- history rather than dropped; product_inventory is the authoritative source
-- from here on.
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

-- Admin-only end to end — stock levels aren't shown to customers anywhere
-- yet, so there's no public read policy (unlike products).
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

-- Auto-provision both pool rows for every new product, so the inventory
-- screen and the decrement function below never have to special-case a
-- missing row.
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

-- Raw materials: a separate, simpler inventory track for manufacturing
-- ingredients (not finished products). Admin-managed only, manual stock
-- adjustment — nothing auto-decrements it yet (would need a
-- bill-of-materials linking table, out of scope for this pass).
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

-- Real-time stock decrement on checkout. Idempotent by design: flips
-- inventory_adjusted false->true and only proceeds if that update actually
-- affected a row, so calling this twice for the same order (e.g. a retried
-- client call) can't double-decrement. Callable by anon/authenticated since
-- guest checkout has no user_id to gate on — safety instead comes from only
-- ever touching the exact order_id passed in, using data checkout itself
-- just inserted.
alter table public.orders
  add column if not exists inventory_adjusted boolean not null default false;

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
    -- Either already adjusted, or the order id doesn't exist — no-op.
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
-- Productionizes the bundle cards currently hardcoded in PricingSection.jsx.
-- bundle_items links a bundle to real product rows (with quantities).
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
-- Corporate Partners request a formal quote for a custom product list
-- rather than placing an order outright (§2.4). Status flow: requested ->
-- quoted -> accepted/declined.
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
-- History storage for the future AI Customer Support Chatbot (§4.2) — the
-- Ritual Builder doesn't use this, it's deliberately single-shot/stateless.
-- No client-facing RLS policies on purpose: only the chatbot's Edge
-- Function (via the service-role key, which bypasses RLS) reads/writes
-- these — the frontend never talks to them directly. RLS stays enabled so
-- they fail closed if that assumption ever changes. An admin read policy is
-- included so a future "review chat logs" screen needs no new migration.
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
-- Lightweight behavioral event log — write-only from the frontend,
-- admin-only to read. Basic Analytics (§3.5) is computed directly from
-- orders/order_items and does not depend on this table; this feeds richer
-- signal (funnel drop-off, product-view interest) into the AI Business
-- Analytics Assistant (§4.3) later. No tracking calls are wired into the
-- frontend yet.
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
-- 14. B2B PRICING MATRIX ENGINE (functional-requirements §2.2)
-- private.is_corporate_partner() mirrors private.is_admin() exactly — same
-- reasoning, kept out of `public` so it isn't directly callable via
-- PostgREST but works inside RLS policies and SECURITY DEFINER functions.
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

-- Per-product minimum order quantity override. Null means "use the global
-- fallback MOQ" (25 — see calculate_b2b_price() below).
alter table public.products
  add column if not exists moq integer;

alter table public.products
  add constraint products_moq_check check (moq is null or moq > 0);

-- Admin-configurable quantity breakpoints for wholesale pricing. Global for
-- now (applies to every product) — a per-product override table is a
-- natural later extension if a specific product ever needs its own tier
-- schedule instead of the shared one.
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

-- Wholesale pricing is only visible to the roles allowed to see it at all
-- (functional-requirements §0: customers can't view wholesale pricing).
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

-- Unlike products/bundles, nothing references discount_tiers by foreign key,
-- so a real delete is safe here (no orphaning risk).
drop policy if exists "Admins can delete discount tiers" on public.discount_tiers;
create policy "Admins can delete discount tiers"
  on public.discount_tiers for delete
  using (private.is_admin());

-- Single source of truth for B2B pricing math, so the frontend, a future
-- Edge Function, and admin reporting all get the same answer instead of
-- duplicating this logic in JS.
--
-- SECURITY DEFINER on purpose: discount_tiers' own RLS only lets
-- admin/corporate_partner read it directly, but this function needs to read
-- it regardless of caller in order to compute a real MOQ-not-met/retail-only
-- response for a plain customer too. Eligibility is instead enforced
-- explicitly inside the function body, the same "gate manually, then bypass
-- RLS" pattern is_admin() itself already relies on. Lives in `public` (not
-- `private`) because, unlike is_admin(), this one *is* meant to be called
-- directly by the frontend/Edge Functions via
-- /rest/v1/rpc/calculate_b2b_price — confirmed via the Supabase security
-- advisor that anon/authenticated can call it; that's intentional, not a gap.
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

-- Starter tiers so there's something to see immediately; fully editable
-- from day one via the discount_tiers table (no admin UI yet).
insert into public.discount_tiers (min_quantity, discount_percent)
values (50, 10), (100, 15), (250, 20)
on conflict (min_quantity) do update set discount_percent = excluded.discount_percent;

-- ----------------------------------------------------------------------------
-- 15. CORPORATE_PARTNER_APPLICATIONS (functional-requirements §2.1/§3.4)
-- Public "apply for a business account" form. Form fields only, no document
-- upload — admin can verify manually offline if something looks off.
-- Applicant already has (or gets, via normal signup) a customer-role
-- account; approving an application is what flips profiles.role to
-- corporate_partner, unlocking wholesale pricing/bulk ordering.
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

-- Prevents duplicate concurrent pending applications from the same user,
-- while still allowing a fresh re-application after a rejection (only one
-- row per user can ever be 'pending' at a time). Verified manually: a
-- second pending insert for the same user correctly raises a unique
-- violation.
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

-- Deliberately no UPDATE/DELETE policies at all, for anyone, admin included.
-- Every status change must go through review_corporate_partner_application()
-- below, which is the only place that (a) stamps reviewed_by/reviewed_at
-- and (b) flips profiles.role atomically with the status change — a raw
-- `.update()` from the client could do one without the other.

-- The only supported way to approve/reject an application. SECURITY
-- DEFINER so it can both update this table (which has no client update
-- policy) and flip profiles.role for a *different* user than the caller —
-- both need to bypass RLS, but only after an explicit is_admin() check,
-- same pattern as calculate_b2b_price(). Verified manually: non-admin
-- caller is rejected, a full approve cycle correctly stamps
-- reviewed_by/reviewed_at and flips the applicant's profiles.role, then the
-- test row/role change were reverted.
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
-- 16. SUPERADMIN ROLE + ACCOUNT MANAGEMENT (functional-requirements §3.6)
-- Adds a rank above 'admin'. private.is_admin() is redefined to treat
-- superadmin as admin-equivalent (role in ('admin','superadmin')), so every
-- existing admin-gated policy/page above this point automatically extends
-- to superadmins with no other changes. private.is_superadmin() is a
-- separate, stricter check (role = 'superadmin' only) used solely to gate
-- the two RPCs below.
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

-- Read-only account directory for the /admin/accounts page. profiles has no
-- email column (email lives in auth.users), so this joins the two tables
-- server-side rather than exposing auth.users to the client directly.
-- SECURITY DEFINER, gated internally by private.is_superadmin() — there is
-- no client-facing "select all profiles" RLS policy, same "no direct table
-- access, only through a checked RPC" pattern as section 15 above.
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

-- The only supported way to change someone's role. There is no client
-- update policy on profiles.role for anyone but the row owner, and even
-- that "Users can update their own profile" policy has no WITH CHECK
-- restricting which columns change — this RPC is the actual, controlled
-- write path going forward. Gated by private.is_superadmin(). Refuses to
-- demote the last remaining superadmin so this page can never lock everyone
-- out of itself. Verified manually: non-superadmin callers rejected, a full
-- promote/demote roundtrip on a real account worked and was reverted, and
-- attempting to demote the sole superadmin correctly raised an exception.
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
-- 17. ADMIN PROFILE VISIBILITY (supports Quotation Requests UI, §2.4)
-- profiles was the one customer-facing table that never got an "Admins can
-- view all X" policy (every other table — orders, applications, quotations,
-- messages — already has one). AdminQuotations.jsx needs to show who
-- requested a quote (name/phone), which means looking up a profiles row
-- that isn't the admin's own — nothing else needed that until now. Read-only,
-- admin-gated, same pattern used everywhere else in this file.
-- ----------------------------------------------------------------------------
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (private.is_admin());
