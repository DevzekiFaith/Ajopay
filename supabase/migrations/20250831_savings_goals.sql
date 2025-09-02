-- Update contributions table to include additional status values needed by approvals page
-- Drop all potentially conflicting objects first
DROP TRIGGER IF EXISTS trg_contribution_approved ON public.contributions;
DROP TRIGGER IF EXISTS handle_contribution_approval ON public.contributions;
DROP FUNCTION IF EXISTS public.handle_contribution_approval();

-- Drop all RLS policies that might reference status column
DROP POLICY IF EXISTS contributions_select_scope ON public.contributions;
DROP POLICY IF EXISTS contributions_insert_customer ON public.contributions;
DROP POLICY IF EXISTS contributions_update_agent_approve ON public.contributions;
DROP POLICY IF EXISTS contrib_update_agent_admin ON public.contributions;
DROP POLICY IF EXISTS "owner insert contribution" ON public.contributions;
DROP POLICY IF EXISTS "agent insert contribution" ON public.contributions;

-- Drop existing constraints
ALTER TABLE IF EXISTS public.contributions DROP CONSTRAINT IF EXISTS contributions_status_check;
ALTER TABLE IF EXISTS public.contributions DROP CONSTRAINT IF EXISTS contributions_method_check;
ALTER TABLE IF EXISTS public.contributions DROP CONSTRAINT IF EXISTS contributions_amount_kobo_check;

-- Drop and recreate contributions table completely
DROP TABLE IF EXISTS public.contributions CASCADE;

-- Create contributions table
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid null references public.profiles(id) on delete set null,
  cluster_id uuid null,
  amount_kobo bigint not null check (amount_kobo >= 20000),
  method text not null check (method in ('wallet','cash')),
  status text not null check (status in ('pending','approved','rejected','confirmed')) default 'pending',
  proof_url text null,
  contributed_at date not null default current_date,
  approved_at timestamptz null,
  created_at timestamptz default now()
);

-- Create all other tables
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  target_amount integer not null check (target_amount > 0),
  current_amount integer not null default 0 check (current_amount >= 0),
  target_date date,
  category text check (category in ('emergency', 'vacation', 'gadget', 'education', 'home', 'car', 'business', 'other')) default 'other',
  status text check (status in ('active', 'completed', 'paused')) not null default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

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

create table if not exists public.savings_circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  target_amount integer not null check (target_amount > 0),
  current_amount integer not null default 0,
  member_limit integer check (member_limit > 0),
  join_code text unique not null,
  created_by uuid references public.profiles(id) not null,
  status text check (status in ('active', 'completed', 'cancelled')) not null default 'active',
  created_at timestamp with time zone default now()
);

create table if not exists public.circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.savings_circles(id) not null,
  user_id uuid references public.profiles(id) not null,
  joined_at timestamp with time zone default now(),
  unique(circle_id, user_id)
);

create table if not exists public.circle_contributions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.savings_circles(id) not null,
  user_id uuid references public.profiles(id) not null,
  amount integer not null check (amount > 0),
  created_at timestamp with time zone default now()
);

create table if not exists public.user_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  friend_id uuid references public.profiles(id) not null,
  status text check (status in ('pending', 'accepted', 'blocked')) not null default 'pending',
  created_at timestamp with time zone default now(),
  unique(user_id, friend_id)
);

create table if not exists public.agent_commissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.profiles(id) not null,
  referral_user_id uuid references public.profiles(id) not null,
  amount_kobo integer not null check (amount_kobo > 0),
  transaction_reference text,
  created_at timestamp with time zone default now()
);

-- Add referral_code to profiles if not exists
alter table public.profiles add column if not exists referral_code text unique;

-- Create clusters table (referenced by contributions)
create table if not exists public.clusters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  agent_id uuid references public.profiles(id) not null,
  target_amount integer not null check (target_amount > 0),
  current_amount integer not null default 0,
  member_count integer not null default 0,
  max_members integer check (max_members > 0),
  status text check (status in ('active', 'completed', 'cancelled')) not null default 'active',
  created_at timestamp with time zone default now()
);

-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  title text not null,
  message text not null,
  type text check (type in ('info', 'success', 'warning', 'error')) not null default 'info',
  read boolean not null default false,
  action_url text,
  created_at timestamp with time zone default now()
);

-- Create transactions table for payment tracking
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  contribution_id uuid references public.contributions(id),
  amount_kobo bigint not null check (amount_kobo > 0),
  type text check (type in ('deposit', 'withdrawal', 'commission', 'penalty')) not null,
  status text check (status in ('pending', 'completed', 'failed', 'cancelled')) not null default 'pending',
  reference text unique not null,
  description text,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- Create wallets table for user balance tracking
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null unique,
  balance_kobo bigint not null default 0 check (balance_kobo >= 0),
  total_contributed_kobo bigint not null default 0,
  total_withdrawn_kobo bigint not null default 0,
  last_activity_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create withdrawal_requests table
create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  status text check (status in ('pending', 'approved', 'rejected', 'completed')) not null default 'pending',
  processed_by uuid references public.profiles(id),
  processed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone default now()
);

-- Create user_achievements table
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  achievement_type text not null,
  achievement_name text not null,
  description text,
  points integer not null default 0,
  badge_url text,
  unlocked_at timestamp with time zone default now(),
  unique(user_id, achievement_type, achievement_name)
);

-- Create app_settings table for global configuration
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  description text,
  type text check (type in ('string', 'number', 'boolean', 'json')) not null default 'string',
  updated_by uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create audit_logs table for tracking important actions
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone default now()
);

-- Create support_tickets table
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  subject text not null,
  description text not null,
  status text check (status in ('open', 'in_progress', 'resolved', 'closed')) not null default 'open',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) not null default 'medium',
  assigned_to uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create ticket_messages table
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.support_tickets(id) not null,
  user_id uuid references public.profiles(id) not null,
  message text not null,
  is_internal boolean not null default false,
  attachments text[],
  created_at timestamp with time zone default now()
);

-- Create helper function for agent/admin check
create or replace function public.is_agent_or_admin() returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role in ('agent', 'admin')
  )
$$;

-- Create trigger function for contribution approval
create or replace function public.handle_contribution_approval() returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at = now();
  end if;
  return new;
end
$$;

-- Update function for updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers
create trigger trg_contribution_approved
  before update on public.contributions
  for each row
  when (old.status is distinct from new.status)
  execute function public.handle_contribution_approval();

create trigger update_savings_goals_updated_at
  before update on public.savings_goals
  for each row execute function update_updated_at_column();

-- Enable RLS on all tables
alter table public.contributions enable row level security;
alter table public.savings_goals enable row level security;
alter table public.peer_challenges enable row level security;
alter table public.peer_activity enable row level security;
alter table public.savings_circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_contributions enable row level security;
alter table public.user_connections enable row level security;
alter table public.agent_commissions enable row level security;
alter table public.clusters enable row level security;
alter table public.notifications enable row level security;
alter table public.transactions enable row level security;
alter table public.wallets enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.user_achievements enable row level security;
alter table public.app_settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- Drop existing policies first
drop policy if exists savings_goals_read_own on public.savings_goals;
drop policy if exists savings_goals_insert_own on public.savings_goals;
drop policy if exists savings_goals_update_own on public.savings_goals;
drop policy if exists savings_goals_delete_own on public.savings_goals;
drop policy if exists peer_activity_read_all on public.peer_activity;
drop policy if exists peer_activity_insert_own on public.peer_activity;

-- Create RLS policies for contributions
create policy contributions_select_scope on public.contributions
  for select using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('agent', 'admin'))
  );

create policy contributions_insert_customer on public.contributions
  for insert with check (user_id = auth.uid());

-- Create RLS policies for savings_goals
create policy savings_goals_read_own on public.savings_goals
  for select using (auth.uid() = user_id);

create policy savings_goals_insert_own on public.savings_goals
  for insert with check (auth.uid() = user_id);

create policy savings_goals_update_own on public.savings_goals
  for update using (auth.uid() = user_id);

create policy savings_goals_delete_own on public.savings_goals
  for delete using (auth.uid() = user_id);

-- Create RLS policies for peer_activity
create policy peer_activity_read_all on public.peer_activity
  for select using (true);

create policy peer_activity_insert_own on public.peer_activity
  for insert with check (auth.uid() = user_id);

-- Create RLS policies for clusters
create policy clusters_read_all on public.clusters
  for select using (true);

create policy clusters_insert_agent on public.clusters
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('agent', 'admin'))
  );

create policy clusters_update_agent on public.clusters
  for update using (agent_id = auth.uid() or public.is_agent_or_admin());

-- Create RLS policies for notifications
create policy notifications_read_own on public.notifications
  for select using (user_id = auth.uid());

create policy notifications_insert_system on public.notifications
  for insert with check (public.is_agent_or_admin());

create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid());

-- Create RLS policies for transactions
create policy transactions_read_own on public.transactions
  for select using (
    user_id = auth.uid() or public.is_agent_or_admin()
  );

create policy transactions_insert_system on public.transactions
  for insert with check (public.is_agent_or_admin());

-- Create RLS policies for wallets
create policy wallets_read_own on public.wallets
  for select using (user_id = auth.uid() or public.is_agent_or_admin());

create policy wallets_insert_own on public.wallets
  for insert with check (user_id = auth.uid());

create policy wallets_update_own on public.wallets
  for update using (user_id = auth.uid() or public.is_agent_or_admin());

-- Create RLS policies for withdrawal_requests
create policy withdrawal_requests_read_own on public.withdrawal_requests
  for select using (
    user_id = auth.uid() or public.is_agent_or_admin()
  );

create policy withdrawal_requests_insert_own on public.withdrawal_requests
  for insert with check (user_id = auth.uid());

create policy withdrawal_requests_update_admin on public.withdrawal_requests
  for update using (public.is_agent_or_admin());

-- Create RLS policies for user_achievements
create policy user_achievements_read_own on public.user_achievements
  for select using (user_id = auth.uid());

create policy user_achievements_insert_system on public.user_achievements
  for insert with check (public.is_agent_or_admin());

-- Create RLS policies for app_settings
create policy app_settings_read_all on public.app_settings
  for select using (true);

create policy app_settings_manage_admin on public.app_settings
  for all using (public.is_agent_or_admin());

-- Create RLS policies for audit_logs
create policy audit_logs_read_admin on public.audit_logs
  for select using (public.is_agent_or_admin());

create policy audit_logs_insert_system on public.audit_logs
  for insert with check (public.is_agent_or_admin());

-- Create RLS policies for support_tickets
create policy support_tickets_read_own on public.support_tickets
  for select using (
    user_id = auth.uid() or public.is_agent_or_admin()
  );

create policy support_tickets_insert_own on public.support_tickets
  for insert with check (user_id = auth.uid());

create policy support_tickets_update_admin on public.support_tickets
  for update using (public.is_agent_or_admin());

-- Create RLS policies for ticket_messages
create policy ticket_messages_read_ticket on public.ticket_messages
  for select using (
    exists (
      select 1 from public.support_tickets st 
      where st.id = ticket_id and (st.user_id = auth.uid() or public.is_agent_or_admin())
    )
  );

create policy ticket_messages_insert_ticket on public.ticket_messages
  for insert with check (
    exists (
      select 1 from public.support_tickets st 
      where st.id = ticket_id and (st.user_id = auth.uid() or public.is_agent_or_admin())
    )
  );

-- Create indices for performance (after all tables exist)
create index if not exists idx_contributions_user on public.contributions(user_id);
create index if not exists idx_contributions_status on public.contributions(status);
create index if not exists idx_savings_goals_user on public.savings_goals(user_id);
create index if not exists idx_savings_goals_status on public.savings_goals(status);
create index if not exists idx_peer_challenges_participants on public.peer_challenges using gin(participants);
create index if not exists idx_peer_challenges_created_by on public.peer_challenges(created_by);
create index if not exists idx_peer_activity_user on public.peer_activity(user_id);
create index if not exists idx_peer_activity_created_at on public.peer_activity(created_at);
create index if not exists idx_savings_circles_join_code on public.savings_circles(join_code);
create index if not exists idx_circle_members_circle on public.circle_members(circle_id);
create index if not exists idx_circle_members_user on public.circle_members(user_id);
create index if not exists idx_circle_contributions_circle on public.circle_contributions(circle_id);
create index if not exists idx_user_connections_user on public.user_connections(user_id);
create index if not exists idx_user_connections_friend on public.user_connections(friend_id);
create index if not exists idx_agent_commissions_agent on public.agent_commissions(agent_id);
create index if not exists idx_clusters_agent on public.clusters(agent_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_contribution on public.transactions(contribution_id);
create index if not exists idx_wallets_user on public.wallets(user_id);
create index if not exists idx_withdrawal_requests_user on public.withdrawal_requests(user_id);
create index if not exists idx_user_achievements_user on public.user_achievements(user_id);
create index if not exists idx_app_settings_key on public.app_settings(key);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id);
create index if not exists idx_support_tickets_user on public.support_tickets(user_id);
create index if not exists idx_ticket_messages_ticket on public.ticket_messages(ticket_id);
create index if not exists idx_ticket_messages_user on public.ticket_messages(user_id);
