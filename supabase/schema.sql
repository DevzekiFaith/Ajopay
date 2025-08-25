-- Run this in Supabase SQL Editor
-- Enable pgcrypto for gen_random_uuid if not enabled
create extension if not exists pgcrypto;

-- Tables
create table if not exists public.clusters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text check (role in ('customer','agent','admin')) not null default 'customer',
  cluster_id uuid references public.clusters(id),
  created_at timestamp with time zone default now()
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  agent_id uuid references public.profiles(id),
  amount_kobo integer not null check (amount_kobo >= 20000),
  method text check (method in ('wallet','cash','va')) not null,
  status text check (status in ('pending','confirmed')) not null default 'confirmed',
  contributed_at date not null default current_date,
  created_at timestamp with time zone default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  event text not null,
  payload jsonb,
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.contributions enable row level security;
alter table public.notifications enable row level security;
alter table public.clusters enable row level security;

-- Signup trigger: create a profile row for each new auth user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    new.email,
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Indices for performance
create index if not exists idx_contributions_user on public.contributions(user_id);
create index if not exists idx_contributions_agent on public.contributions(agent_id);
create index if not exists idx_contributions_date on public.contributions(contributed_at);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

-- Optional reference for idempotent webhook inserts
alter table public.contributions add column if not exists reference text;
-- Unique only when reference is provided
do $$ begin
  create unique index if not exists ux_contributions_reference on public.contributions(reference) where reference is not null;
exception when others then null; end $$;

-- Policies using profiles.role

-- profiles: self can read own profile
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (auth.uid() = id);

-- profiles: admin can update own profile (e.g., switch cluster)
drop policy if exists profiles_update_admin_self on public.profiles;
create policy profiles_update_admin_self on public.profiles
  for update using (
    auth.uid() = id and exists (
      select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin'
    )
  ) with check (
    auth.uid() = id and exists (
      select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin'
    )
  );

-- clusters: allow admins (and agents) to read clusters list
drop policy if exists clusters_read_agent_admin on public.clusters;
create policy clusters_read_agent_admin on public.clusters
  for select using (
    exists (
      select 1 from public.profiles me where me.id = auth.uid() and me.role in ('agent','admin')
    )
  );

-- profiles: agent/admin can read profiles in their own cluster only
drop policy if exists profiles_read_agent_admin on public.profiles;
create policy profiles_read_agent_admin on public.profiles
  for select using (
    exists (
      select 1
      from public.profiles me
      where me.id = auth.uid()
        and me.role in ('agent','admin')
        and me.cluster_id is not distinct from public.profiles.cluster_id
    )
  );

-- contributions: customer can read/insert own
drop policy if exists contrib_read_self on public.contributions;
create policy contrib_read_self on public.contributions
  for select using (auth.uid() = user_id);

drop policy if exists contrib_insert_self on public.contributions;
create policy contrib_insert_self on public.contributions
  for insert with check (auth.uid() = user_id);

-- contributions: agent/admin can read only within their cluster
drop policy if exists contrib_read_agent_admin on public.contributions;
create policy contrib_read_agent_admin on public.contributions
  for select using (
    exists (
      select 1
      from public.profiles me
      join public.profiles u on u.id = public.contributions.user_id
      where me.id = auth.uid()
        and me.role in ('agent','admin')
        and me.cluster_id is not distinct from u.cluster_id
    )
  );

-- contributions: agent/admin can insert for others in same cluster (cash)
drop policy if exists contrib_insert_agent_admin on public.contributions;
create policy contrib_insert_agent_admin on public.contributions
  for insert with check (
    exists (
      select 1
      from public.profiles me
      join public.profiles u on u.id = public.contributions.user_id
      where me.id = auth.uid()
        and me.role in ('agent','admin')
        and me.cluster_id is not distinct from u.cluster_id
    )
  );
