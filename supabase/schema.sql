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
-- above hides from everyone else. No delete policy on purpose — the admin
-- UI only supports create/edit/deactivate, to avoid orphaning
-- order_items/wishlist_items rows that reference a product id.
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
-- 9. INVENTORY (basic, single-pool)
-- Per the Decisions Log: a single stock-count field per product, with a
-- per-product low-stock threshold (not a single global number). Separate
-- retail/wholesale/raw-material pools stay a [Stretch] item.
-- ----------------------------------------------------------------------------
alter table public.products
  add column if not exists stock_count integer not null default 0 check (stock_count >= 0),
  add column if not exists low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0);

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
