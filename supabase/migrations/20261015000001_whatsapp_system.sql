-- =========================================================================
-- WhatsApp Coexistence & Retail Sales Automation Schema
-- =========================================================================

-- 1. Raw Webhook Events
create table if not exists public.whatsapp_raw_events (
  id uuid default gen_random_uuid() primary key,
  received_at timestamptz default timezone('utc'::text, now()) not null,
  payload jsonb not null,
  processed boolean default false not null,
  error text
);

alter table public.whatsapp_raw_events enable row level security;
create policy "Allow logged-in users to view raw events" on public.whatsapp_raw_events
  for select using (auth.role() = 'authenticated');

-- 2. WhatsApp Contacts (phone and BSUID supported)
create table if not exists public.whatsapp_contacts (
  id uuid default gen_random_uuid() primary key,
  wa_id text unique,
  bsuid text unique,
  phone text,
  profile_name text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.whatsapp_contacts enable row level security;
create policy "Allow logged-in users to view contacts" on public.whatsapp_contacts
  for select using (auth.role() = 'authenticated');
create policy "Allow service role full access to contacts" on public.whatsapp_contacts
  for all using (true);

-- 3. WhatsApp Conversations
create table if not exists public.whatsapp_conversations (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.whatsapp_contacts(id) on delete cascade not null,
  last_message_at timestamptz default timezone('utc'::text, now()) not null,
  last_message_preview text,
  unread_count integer default 0,
  status text default 'ACTIVE',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.whatsapp_conversations enable row level security;
create policy "Allow logged-in users to view conversations" on public.whatsapp_conversations
  for select using (auth.role() = 'authenticated');
create policy "Allow logged-in users to update conversations" on public.whatsapp_conversations
  for update using (auth.role() = 'authenticated');

-- 4. WhatsApp Messages
create table if not exists public.whatsapp_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.whatsapp_conversations(id) on delete cascade not null,
  contact_id uuid references public.whatsapp_contacts(id) on delete cascade not null,
  wam_id text unique not null,
  direction text check (direction in ('INBOUND', 'OUTBOUND')) not null,
  sender_type text check (sender_type in ('CUSTOMER', 'BUSINESS_APP', 'BUSINESS_AI', 'SYSTEM')) default 'CUSTOMER',
  message_type text default 'text',
  body text,
  media_url text,
  raw_data jsonb,
  timestamp timestamptz not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_whatsapp_messages_wam_id on public.whatsapp_messages(wam_id);
create index if not exists idx_whatsapp_messages_conversation on public.whatsapp_messages(conversation_id, timestamp desc);

alter table public.whatsapp_messages enable row level security;
create policy "Allow logged-in users to view messages" on public.whatsapp_messages
  for select using (auth.role() = 'authenticated');

-- 5. Leads
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.whatsapp_contacts(id) on delete cascade,
  conversation_id uuid references public.whatsapp_conversations(id) on delete set null,
  name text,
  phone text,
  interested_in text,
  estimated_value numeric(10, 2),
  status text check (status in ('NEW', 'INTERESTED', 'PROMISED', 'LAYBY', 'CONVERTED', 'LOST')) default 'NEW',
  notes text,
  confidence numeric(3, 2) default 1.0,
  needs_review boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.leads enable row level security;
create policy "Allow logged-in users to view and manage leads" on public.leads
  for all using (auth.role() = 'authenticated');

-- 6. Promises
create table if not exists public.promises (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.whatsapp_contacts(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  promise_type text check (promise_type in ('PAYMENT', 'VISIT', 'CALL_BACK', 'OTHER')) default 'PAYMENT',
  promised_amount numeric(10, 2),
  promised_date date,
  status text check (status in ('PENDING', 'FULFILLED', 'BROKEN', 'CANCELLED')) default 'PENDING',
  notes text,
  confidence numeric(3, 2) default 1.0,
  needs_review boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.promises enable row level security;
create policy "Allow logged-in users to view and manage promises" on public.promises
  for all using (auth.role() = 'authenticated');

-- 7. Layby Agreements
create table if not exists public.layby_agreements (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.whatsapp_contacts(id) on delete cascade,
  product_name text not null,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  total_price numeric(10, 2) not null,
  deposit_paid numeric(10, 2) default 0.00,
  balance_due numeric(10, 2) not null,
  status text check (status in ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED')) default 'ACTIVE',
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.layby_agreements enable row level security;
create policy "Allow logged-in users to view and manage laybys" on public.layby_agreements
  for all using (auth.role() = 'authenticated');

-- 8. Layby Payments
create table if not exists public.layby_payments (
  id uuid default gen_random_uuid() primary key,
  layby_id uuid references public.layby_agreements(id) on delete cascade not null,
  amount numeric(10, 2) not null,
  payment_date timestamptz default timezone('utc'::text, now()) not null,
  payment_method text default 'EcoCash',
  reference text,
  confidence numeric(3, 2) default 1.0,
  needs_review boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.layby_payments enable row level security;
create policy "Allow logged-in users to view and manage layby payments" on public.layby_payments
  for all using (auth.role() = 'authenticated');
