-- ==============================================================================
-- Migration: Stock Movements & Asset Inventory Tracking
-- KK Furnitures / ZimFurnitureHub
-- ==============================================================================

create table if not exists public.stock_movements (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id) on delete set null,
  movement_type text check (movement_type in ('PURCHASE_RESTOCK', 'SALE_DEDUCTION', 'DAMAGE_LOSS', 'ADJUSTMENT')) not null,
  quantity integer not null,
  unit_cost numeric(10, 2),
  supplier text,
  reference_notes text,
  logged_by text default 'Admin',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_stock_movements_product on public.stock_movements(product_id);
create index if not exists idx_stock_movements_created on public.stock_movements(created_at desc);

-- Enable RLS
alter table public.stock_movements enable row level security;
create policy "Allow logged-in users to view stock movements" on public.stock_movements
  for select using (true);
create policy "Allow logged-in users to insert stock movements" on public.stock_movements
  for insert with check (true);
create policy "Allow service role full access to stock movements" on public.stock_movements
  for all using (true);
