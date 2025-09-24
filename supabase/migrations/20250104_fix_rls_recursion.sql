-- Fix infinite recursion in RLS policies for savings_circles
-- This migration drops and recreates the policies without circular dependencies

-- Drop existing policies that cause recursion
drop policy if exists savings_circles_read_own on public.savings_circles;
drop policy if exists savings_circles_insert_own on public.savings_circles;
drop policy if exists savings_circles_update_own on public.savings_circles;
drop policy if exists savings_circles_delete_own on public.savings_circles;

drop policy if exists circle_members_read_own on public.circle_members;
drop policy if exists circle_members_insert_own on public.circle_members;
drop policy if exists circle_members_update_own on public.circle_members;
drop policy if exists circle_members_delete_own on public.circle_members;

drop policy if exists circle_contributions_read_own on public.circle_contributions;
drop policy if exists circle_contributions_insert_own on public.circle_contributions;
drop policy if exists circle_contributions_update_own on public.circle_contributions;
drop policy if exists circle_contributions_delete_own on public.circle_contributions;

-- Create simplified RLS policies without circular dependencies

-- Savings circles policies (simplified - no circular references)
create policy savings_circles_read_own on public.savings_circles
  for select using (auth.uid() = created_by);

create policy savings_circles_insert_own on public.savings_circles
  for insert with check (auth.uid() = created_by);

create policy savings_circles_update_own on public.savings_circles
  for update using (auth.uid() = created_by);

create policy savings_circles_delete_own on public.savings_circles
  for delete using (auth.uid() = created_by);

-- Circle members policies (simplified - no circular references)
create policy circle_members_read_own on public.circle_members
  for select using (auth.uid() = user_id);

create policy circle_members_insert_own on public.circle_members
  for insert with check (auth.uid() = user_id);

create policy circle_members_update_own on public.circle_members
  for update using (auth.uid() = user_id);

create policy circle_members_delete_own on public.circle_members
  for delete using (auth.uid() = user_id);

-- Circle contributions policies (simplified - no circular references)
create policy circle_contributions_read_own on public.circle_contributions
  for select using (auth.uid() = user_id);

create policy circle_contributions_insert_own on public.circle_contributions
  for insert with check (auth.uid() = user_id);

create policy circle_contributions_update_own on public.circle_contributions
  for update using (auth.uid() = user_id);

create policy circle_contributions_delete_own on public.circle_contributions
  for delete using (auth.uid() = user_id);



