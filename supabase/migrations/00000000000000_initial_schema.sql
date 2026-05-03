-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Table (extends Supabase Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  full_name text,
  role text check (role in ('CUSTOMER', 'ADMIN')) default 'CUSTOMER',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to create a user in public.users when a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'CUSTOMER');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS on users
alter table public.users enable row level security;
create policy "Users can view own profile." on public.users for select using (auth.uid() = id);
create policy "Users can update own profile." on public.users for update using (auth.uid() = id);

-- 2. Categories Table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on categories
alter table public.categories enable row level security;
create policy "Categories are viewable by everyone." on public.categories for select using (true);
create policy "Categories are insertable by admins." on public.categories for insert with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);
create policy "Categories are updatable by admins." on public.categories for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);

-- 3. Products Table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.categories on delete set null,
  name text not null,
  slug text not null unique,
  description text not null,
  base_price numeric(10, 2) not null,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on products
alter table public.products enable row level security;
create policy "Products are viewable by everyone." on public.products for select using (true);
create policy "Products are insertable by admins." on public.products for insert with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);
create policy "Products are updatable by admins." on public.products for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);

-- 4. Product Variants Table
create table public.product_variants (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products on delete cascade not null,
  sku text not null unique,
  name text not null, -- e.g., "Oak Finish", "Red Leather"
  price numeric(10, 2) not null,
  stock_quantity integer not null default 0,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on variants
alter table public.product_variants enable row level security;
create policy "Product variants are viewable by everyone." on public.product_variants for select using (true);
create policy "Product variants are insertable by admins." on public.product_variants for insert with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);
create policy "Product variants are updatable by admins." on public.product_variants for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);

-- 5. Product Images Table
create table public.product_images (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products on delete cascade not null,
  url text not null,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on images
alter table public.product_images enable row level security;
create policy "Product images are viewable by everyone." on public.product_images for select using (true);
create policy "Product images are insertable by admins." on public.product_images for insert with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);
create policy "Product images are updatable by admins." on public.product_images for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);

-- 6. Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete set null, -- Nullable for guest checkout
  status text check (status in ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED')) default 'PENDING',
  total_amount numeric(10, 2) not null,
  stripe_session_id text unique,
  customer_email text,
  shipping_address jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on orders
alter table public.orders enable row level security;
create policy "Users can view own orders." on public.orders for select using (auth.uid() = user_id);
create policy "Admins can view all orders." on public.orders for select using (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);
-- Orders typically inserted via server action bypass RLS or use service role, 
-- but let's allow users to insert their own orders if they are logged in:
create policy "Users can insert own orders." on public.orders for insert with check (auth.uid() = user_id);

-- 7. Order Items Table
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders on delete cascade not null,
  product_variant_id uuid references public.product_variants on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on order items
alter table public.order_items enable row level security;
create policy "Users can view own order items." on public.order_items for select using (
  exists (select 1 from public.orders where id = order_items.order_id and user_id = auth.uid())
);
create policy "Admins can view all order items." on public.order_items for select using (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);
create policy "Users can insert own order items." on public.order_items for insert with check (
  exists (select 1 from public.orders where id = order_items.order_id and user_id = auth.uid())
);
