-- Remove cluster functionality from Ajopay
-- This migration removes all cluster-related tables and references

begin;

-- Remove cluster_id foreign key constraint from profiles table
alter table public.profiles drop constraint if exists profiles_cluster_id_fkey;

-- Remove cluster_id column from profiles table
alter table public.profiles drop column if exists cluster_id;

-- Drop cluster-related tables
drop table if exists public.cluster_members;
drop table if exists public.clusters;

-- Update any remaining references in comments/documentation
comment on table public.profiles is 'User profiles without cluster grouping';

commit;
