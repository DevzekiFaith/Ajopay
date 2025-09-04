-- Schema for Ajopay MVP: commissions, wallets, transactions, RLS, trigger
-- Idempotent-ish creation (use with care). Adjust to your existing schema as needed.

begin;

-- Extensions
create extension if not exists pgcrypto;

-- Profiles (assuming auth.users exists)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text check (role in ('customer','agent','admin')) default 'customer',
  cluster_id uuid null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clusters
create table if not exists public.clusters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Cluster membership
create table if not exists public.cluster_members (
  cluster_id uuid not null references public.clusters(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (cluster_id, profile_id)
);

-- Wallets
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  balance_kobo bigint not null default 0,
  updated_at timestamptz default now()
);

-- Wallet transactions
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  amount_kobo bigint not null,
  type text not null check (type in ('credit','debit')),
  meta jsonb,
  created_at timestamptz default now()
);

-- Contributions
create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid null references public.profiles(id) on delete set null,
  cluster_id uuid null references public.clusters(id) on delete set null,
  amount_kobo bigint not null check (amount_kobo >= 20000),
  method text not null check (method in ('wallet','cash')),
  status text not null check (status in ('pending','approved','rejected','confirmed')) default 'pending',
  proof_url text null,
  contributed_at date not null default current_date,
  approved_at timestamptz null,
  created_at timestamptz default now()
);

-- Agent commissions
create table if not exists public.agent_commissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  contribution_id uuid not null references public.contributions(id) on delete cascade,
  amount_kobo bigint not null,
  created_at timestamptz default now()
);

-- RLS enable
alter table public.profiles enable row level security;
alter table public.clusters enable row level security;
alter table public.cluster_members enable row level security;
alter table public.contributions enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.agent_commissions enable row level security;

-- Helper: current uid
create or replace function public.uid() returns uuid language sql stable as $$
  select coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
$$;

-- Profiles RLS
create policy if not exists profiles_select_self on public.profiles
  for select using (id = public.uid() or role = 'admin');
create policy if not exists profiles_update_self on public.profiles
  for update using (id = public.uid());

-- Clusters RLS (agent owner + members can read)
create policy if not exists clusters_select_owner_or_member on public.clusters
  for select using (
    agent_id = public.uid() or
    exists (
      select 1 from public.cluster_members cm
      where cm.cluster_id = clusters.id and cm.profile_id = public.uid()
    ) or
    exists (select 1 from public.profiles p where p.id = public.uid() and p.role = 'admin')
  );

-- Cluster members RLS
create policy if not exists cluster_members_agent_read on public.cluster_members
  for select using (
    exists (select 1 from public.clusters c where c.id = cluster_members.cluster_id and c.agent_id = public.uid()) or
    profile_id = public.uid() or
    exists (select 1 from public.profiles p where p.id = public.uid() and p.role = 'admin')
  );
create policy if not exists cluster_members_agent_insert on public.cluster_members
  for insert with check (
    exists (select 1 from public.clusters c where c.id = cluster_members.cluster_id and c.agent_id = public.uid())
  );

-- Contributions RLS
create policy if not exists contributions_select_scope on public.contributions
  for select using (
    user_id = public.uid() or
    exists (select 1 from public.clusters c where c.id = contributions.cluster_id and c.agent_id = public.uid()) or
    exists (select 1 from public.profiles p where p.id = public.uid() and p.role = 'admin')
  );
create policy if not exists contributions_insert_customer on public.contributions
  for insert with check (user_id = public.uid());
create policy if not exists contributions_update_agent_approve on public.contributions
  for update using (
    exists (select 1 from public.clusters c where c.id = contributions.cluster_id and c.agent_id = public.uid())
  );

-- Wallets RLS
create policy if not exists wallets_select_self on public.wallets
  for select using (profile_id = public.uid() or exists (select 1 from public.profiles p where p.id = public.uid() and p.role = 'admin'));

create policy if not exists wallets_insert_self on public.wallets
  for insert with check (profile_id = public.uid());
create policy if not exists wallet_tx_select_scope on public.wallet_transactions
  for select using (
    exists (select 1 from public.wallets w where w.id = wallet_transactions.wallet_id and (w.profile_id = public.uid() or exists (select 1 from public.profiles p where p.id = public.uid() and p.role = 'admin')))
  );

-- Commission trigger on approval
create or replace function public.handle_contribution_approval() returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    -- commission: 2%
    if new.cluster_id is not null then
      insert into public.agent_commissions (agent_id, contribution_id, amount_kobo)
      select c.agent_id, new.id, (new.amount_kobo * 2 / 100)
      from public.clusters c where c.id = new.cluster_id;

      -- ensure agent wallet
      insert into public.wallets (profile_id)
      values ((select c.agent_id from public.clusters c where c.id = new.cluster_id))
      on conflict (profile_id) do nothing;

      -- credit transaction
      insert into public.wallet_transactions (wallet_id, amount_kobo, type, meta)
      select w.id, (new.amount_kobo * 2 / 100), 'credit', jsonb_build_object('commission_for', new.id)
      from public.wallets w join public.clusters c on w.profile_id = c.agent_id where c.id = new.cluster_id;

      -- recompute wallet balance
      update public.wallets w set balance_kobo = (
        select coalesce(sum(case when t.type='credit' then t.amount_kobo else -t.amount_kobo end),0)
        from public.wallet_transactions t where t.wallet_id = w.id
      ), updated_at = now()
      where w.profile_id = (select c.agent_id from public.clusters c where c.id = new.cluster_id);

      new.approved_at = now();
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists trg_contribution_approved on public.contributions;
create trigger trg_contribution_approved
  after update on public.contributions
  for each row
  when (old.status is distinct from new.status)
  execute procedure public.handle_contribution_approval();

commit;
