-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create savings_groups table
CREATE TABLE IF NOT EXISTS public.savings_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_amount_kobo BIGINT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  next_contribution_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create savings_group_members table
CREATE TABLE IF NOT EXISTS public.savings_group_members (
  group_id UUID NOT NULL REFERENCES public.savings_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contribution_date TIMESTAMP WITH TIME ZONE,
  contribution_count INTEGER DEFAULT 0,
  PRIMARY KEY (group_id, user_id)
);

-- Add group_id to transactions
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.savings_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_group_transaction BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_savings_groups_created_by ON public.savings_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_savings_group_members_user ON public.savings_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_group_members_group ON public.savings_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_transactions_group ON public.transactions(group_id) WHERE group_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.savings_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for savings_groups
CREATE POLICY "Enable read access for group members"
  ON public.savings_groups
  FOR SELECT
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.savings_group_members 
      WHERE group_id = savings_groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable insert for authenticated users"
  ON public.savings_groups
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update for group admins"
  ON public.savings_groups
  FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for savings_group_members
CREATE POLICY "Enable read access for group members"
  ON public.savings_group_members
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.savings_groups 
      WHERE id = savings_group_members.group_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Enable insert for group admins"
  ON public.savings_group_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.savings_groups 
      WHERE id = savings_group_members.group_id AND created_by = auth.uid()
    )
  );

-- Update transactions policy to handle group transactions
DROP POLICY IF EXISTS "Enable read access for users on their own transactions" ON public.transactions;
CREATE POLICY "Enable read access for users on their own transactions"
  ON public.transactions
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.savings_group_members 
      WHERE group_id = transactions.group_id AND user_id = auth.uid()
    ))
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_savings_groups_modtime
BEFORE UPDATE ON public.savings_groups
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.savings_groups TO authenticated;
GRANT SELECT, INSERT ON public.savings_group_members TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
