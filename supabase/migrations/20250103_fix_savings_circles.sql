-- Fix savings circles table structure and add missing RLS policies
-- This migration updates the savings_circles table to match the application requirements

-- Drop existing tables if they exist (to avoid conflicts)
drop table if exists public.circle_contributions cascade;
drop table if exists public.circle_members cascade;
drop table if exists public.savings_circles cascade;

-- Create savings_circles table with correct structure
create table public.savings_circles (
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

-- Create circle_members table
create table public.circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.savings_circles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  is_admin boolean not null default false,
  joined_at timestamp with time zone default now(),
  unique(circle_id, user_id)
);

-- Create circle_contributions table
create table public.circle_contributions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.savings_circles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  amount numeric not null check (amount > 0),
  cycle_number integer not null default 1,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.savings_circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_contributions enable row level security;

-- Create RLS policies for savings_circles
create policy savings_circles_read_own on public.savings_circles
  for select using (
    auth.uid() = created_by or 
    exists (
      select 1 from public.circle_members 
      where circle_id = public.savings_circles.id and user_id = auth.uid()
    )
  );

create policy savings_circles_insert_own on public.savings_circles
  for insert with check (auth.uid() = created_by);

create policy savings_circles_update_own on public.savings_circles
  for update using (auth.uid() = created_by);

create policy savings_circles_delete_own on public.savings_circles
  for delete using (auth.uid() = created_by);

-- Create RLS policies for circle_members
create policy circle_members_read_own on public.circle_members
  for select using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.savings_circles 
      where id = public.circle_members.circle_id and created_by = auth.uid()
    )
  );

create policy circle_members_insert_own on public.circle_members
  for insert with check (auth.uid() = user_id);

create policy circle_members_update_own on public.circle_members
  for update using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.savings_circles 
      where id = public.circle_members.circle_id and created_by = auth.uid()
    )
  );

create policy circle_members_delete_own on public.circle_members
  for delete using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.savings_circles 
      where id = public.circle_members.circle_id and created_by = auth.uid()
    )
  );

-- Create RLS policies for circle_contributions
create policy circle_contributions_read_own on public.circle_contributions
  for select using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.savings_circles 
      where id = public.circle_contributions.circle_id and created_by = auth.uid()
    )
  );

create policy circle_contributions_insert_own on public.circle_contributions
  for insert with check (auth.uid() = user_id);

create policy circle_contributions_update_own on public.circle_contributions
  for update using (auth.uid() = user_id);

create policy circle_contributions_delete_own on public.circle_contributions
  for delete using (auth.uid() = user_id);

-- Create indices for performance
create index idx_savings_circles_join_code on public.savings_circles(join_code);
create index idx_savings_circles_created_by on public.savings_circles(created_by);
create index idx_circle_members_circle on public.circle_members(circle_id);
create index idx_circle_members_user on public.circle_members(user_id);
create index idx_circle_contributions_circle on public.circle_contributions(circle_id);
create index idx_circle_contributions_user on public.circle_contributions(user_id);
