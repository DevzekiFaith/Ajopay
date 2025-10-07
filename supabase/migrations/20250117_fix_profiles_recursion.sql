-- Fix infinite recursion in RLS policies for profiles table
-- This migration drops and recreates the policies without circular dependencies

begin;

-- Drop existing policies that cause recursion
drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_update_admin_self on public.profiles;
drop policy if exists profiles_read_agent_admin on public.profiles;

-- Create simplified RLS policies without circular dependencies

-- Profiles policies (simplified - no circular references)
create policy profiles_self_read on public.profiles
  for select using (auth.uid() = id);

create policy profiles_update_admin_self on public.profiles
  for update using (
    auth.uid() = id and role = 'admin'
  ) with check (
    auth.uid() = id and role = 'admin'
  );

create policy profiles_read_agent_admin on public.profiles
  for select using (
    auth.uid() = id or
    role in ('agent', 'admin')
  );

commit;