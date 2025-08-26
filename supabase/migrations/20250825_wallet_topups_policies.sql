-- Wallet topups table
create table if not exists public.wallet_topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_kobo bigint not null check (amount_kobo > 0),
  status text not null check (status in ('pending','confirmed','failed')) default 'pending',
  provider text,
  provider_txn_id text,
  created_at timestamptz not null default now()
);

-- Helpful index
create index if not exists wallet_topups_user_created_idx on public.wallet_topups(user_id, created_at desc);

-- Unique same-day contributions per user
do $$ begin
  alter table public.contributions add constraint unique_user_day unique (user_id, contributed_at);
exception when duplicate_object then null; end $$;

-- RLS policies
alter table public.wallet_topups enable row level security;

-- Allow owner to view their topups
create policy if not exists "owner select wallet_topups" on public.wallet_topups for select
  using (auth.uid() = user_id);

-- Allow admins to view all topups
create policy if not exists "admins select wallet_topups" on public.wallet_topups for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Allow inserting topups by the owner and by admins (webhooks will use service key / edge function bypass)
create policy if not exists "owner insert wallet_topups" on public.wallet_topups for insert
  with check (auth.uid() = user_id);

create policy if not exists "admins insert wallet_topups" on public.wallet_topups for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Customers table agent create/select policies (idempotent style)
-- Agents/admins can insert customers
create policy if not exists "agents create customers" on public.customers for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('agent','admin')));

-- Agents/admins can select customers
create policy if not exists "agents select customers" on public.customers for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('agent','admin')));

-- Contributions policies (owner + agent/admin insert)
create policy if not exists "owner insert contribution" on public.contributions for insert
  with check (auth.uid() = user_id);

create policy if not exists "agent insert contribution" on public.contributions for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('agent','admin')));
