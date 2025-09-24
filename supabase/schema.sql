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

-- Peer challenges and social features tables
create table if not exists public.peer_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text check (type in ('savings', 'streak', 'goal')) not null,
  target integer not null check (target > 0),
  duration integer not null check (duration > 0),
  participants uuid[] default '{}',
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default now(),
  end_date timestamp with time zone not null,
  prize text,
  progress jsonb default '{}',
  status text check (status in ('active', 'completed', 'cancelled')) not null default 'active'
);

create table if not exists public.peer_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  user_name text not null,
  user_avatar text,
  content text not null,
  type text check (type in ('achievement', 'milestone', 'challenge', 'general')) not null default 'general',
  created_at timestamp with time zone default now(),
  likes integer default 0,
  comments integer default 0,
  achievement jsonb
);

create table if not exists public.user_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  friend_id uuid references public.profiles(id) not null,
  status text check (status in ('pending', 'accepted', 'blocked')) not null default 'pending',
  created_at timestamp with time zone default now(),
  unique(user_id, friend_id)
);

-- Savings circles tables
create table if not exists public.savings_circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text check (type in ('ajo', 'esusu', 'thrift', 'investment')) not null default 'ajo',
  contribution_amount numeric not null check (contribution_amount > 0),
  frequency text check (frequency in ('daily', 'weekly', 'monthly')) not null default 'monthly',
  duration integer not null check (duration > 0),
  max_members integer not null check (max_members > 0),
  created_by uuid references public.profiles(id) not null,
  start_date timestamp with time zone not null,
  current_cycle integer not null default 1,
  total_pool numeric not null default 0,
  is_active boolean not null default false,
  join_code text unique not null,
  rules text,
  created_at timestamp with time zone default now()
);

create table if not exists public.circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.savings_circles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  is_admin boolean not null default false,
  joined_at timestamp with time zone default now(),
  unique(circle_id, user_id)
);

create table if not exists public.circle_contributions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.savings_circles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  amount numeric not null check (amount > 0),
  cycle_number integer not null default 1,
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.contributions enable row level security;
alter table public.notifications enable row level security;
alter table public.clusters enable row level security;
alter table public.peer_challenges enable row level security;
alter table public.peer_activity enable row level security;
alter table public.user_connections enable row level security;
alter table public.savings_circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_contributions enable row level security;

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
create index if not exists idx_peer_challenges_participants on public.peer_challenges using gin(participants);
create index if not exists idx_peer_challenges_created_by on public.peer_challenges(created_by);
create index if not exists idx_peer_activity_user on public.peer_activity(user_id);
create index if not exists idx_peer_activity_created_at on public.peer_activity(created_at);
create index if not exists idx_user_connections_user on public.user_connections(user_id);
create index if not exists idx_user_connections_friend on public.user_connections(friend_id);
create index if not exists idx_savings_circles_join_code on public.savings_circles(join_code);
create index if not exists idx_savings_circles_created_by on public.savings_circles(created_by);
create index if not exists idx_circle_members_circle on public.circle_members(circle_id);
create index if not exists idx_circle_members_user on public.circle_members(user_id);
create index if not exists idx_circle_contributions_circle on public.circle_contributions(circle_id);
create index if not exists idx_circle_contributions_user on public.circle_contributions(user_id);

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

-- Peer challenges policies
drop policy if exists peer_challenges_read_own on public.peer_challenges;
create policy peer_challenges_read_own on public.peer_challenges
  for select using (
    auth.uid() = created_by or 
    auth.uid() = any(participants)
  );

drop policy if exists peer_challenges_insert_own on public.peer_challenges;
create policy peer_challenges_insert_own on public.peer_challenges
  for insert with check (auth.uid() = created_by);

drop policy if exists peer_challenges_update_own on public.peer_challenges;
create policy peer_challenges_update_own on public.peer_challenges
  for update using (auth.uid() = created_by);

drop policy if exists peer_challenges_delete_own on public.peer_challenges;
create policy peer_challenges_delete_own on public.peer_challenges
  for delete using (auth.uid() = created_by);

-- Peer activity policies
drop policy if exists peer_activity_read_all on public.peer_activity;
create policy peer_activity_read_all on public.peer_activity
  for select using (true);

drop policy if exists peer_activity_insert_own on public.peer_activity;
create policy peer_activity_insert_own on public.peer_activity
  for insert with check (auth.uid() = user_id);

-- User connections policies
drop policy if exists user_connections_read_own on public.user_connections;
create policy user_connections_read_own on public.user_connections
  for select using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists user_connections_insert_own on public.user_connections;
create policy user_connections_insert_own on public.user_connections
  for insert with check (auth.uid() = user_id);

drop policy if exists user_connections_update_own on public.user_connections;
create policy user_connections_update_own on public.user_connections
  for update using (auth.uid() = user_id or auth.uid() = friend_id);

-- Savings circles policies
drop policy if exists savings_circles_read_own on public.savings_circles;
create policy savings_circles_read_own on public.savings_circles
  for select using (
    auth.uid() = created_by or 
    exists (
      select 1 from public.circle_members 
      where circle_id = public.savings_circles.id and user_id = auth.uid()
    )
  );

drop policy if exists savings_circles_insert_own on public.savings_circles;
create policy savings_circles_insert_own on public.savings_circles
  for insert with check (auth.uid() = created_by);

drop policy if exists savings_circles_update_own on public.savings_circles;
create policy savings_circles_update_own on public.savings_circles
  for update using (auth.uid() = created_by);

drop policy if exists savings_circles_delete_own on public.savings_circles;
create policy savings_circles_delete_own on public.savings_circles
  for delete using (auth.uid() = created_by);

-- Circle members policies
drop policy if exists circle_members_read_own on public.circle_members;
create policy circle_members_read_own on public.circle_members
  for select using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.savings_circles 
      where id = public.circle_members.circle_id and created_by = auth.uid()
    )
  );

drop policy if exists circle_members_insert_own on public.circle_members;
create policy circle_members_insert_own on public.circle_members
  for insert with check (auth.uid() = user_id);

drop policy if exists circle_members_update_own on public.circle_members;
create policy circle_members_update_own on public.circle_members
  for update using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.savings_circles 
      where id = public.circle_members.circle_id and created_by = auth.uid()
    )
  );

drop policy if exists circle_members_delete_own on public.circle_members;
create policy circle_members_delete_own on public.circle_members
  for delete using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.savings_circles 
      where id = public.circle_members.circle_id and created_by = auth.uid()
    )
  );

-- Circle contributions policies
drop policy if exists circle_contributions_read_own on public.circle_contributions;
create policy circle_contributions_read_own on public.circle_contributions
  for select using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.savings_circles 
      where id = public.circle_contributions.circle_id and created_by = auth.uid()
    )
  );

drop policy if exists circle_contributions_insert_own on public.circle_contributions;
create policy circle_contributions_insert_own on public.circle_contributions
  for insert with check (auth.uid() = user_id);

drop policy if exists circle_contributions_update_own on public.circle_contributions;
create policy circle_contributions_update_own on public.circle_contributions
  for update using (auth.uid() = user_id);

drop policy if exists circle_contributions_delete_own on public.circle_contributions;
create policy circle_contributions_delete_own on public.circle_contributions
  for delete using (auth.uid() = user_id);
