-- Remove Agent System Migration
-- This migration removes all agent-related functionality to simplify the platform

-- 1. Drop agent-related tables
DROP TABLE IF EXISTS public.agent_commissions CASCADE;
DROP TABLE IF EXISTS public.clusters CASCADE;
DROP TABLE IF EXISTS public.cluster_members CASCADE;

-- 2. Update profiles table to remove agent role and cluster_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cluster_id;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin'));

-- Add settings column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- 3. Update contributions table to remove agent-related fields
ALTER TABLE public.contributions DROP COLUMN IF EXISTS agent_id;
ALTER TABLE public.contributions DROP COLUMN IF EXISTS cluster_id;
ALTER TABLE public.contributions DROP COLUMN IF EXISTS proof_url;
ALTER TABLE public.contributions DROP COLUMN IF EXISTS approved_at;

-- 4. Simplify contributions status - remove approval workflow
ALTER TABLE public.contributions DROP CONSTRAINT IF EXISTS contributions_status_check;
ALTER TABLE public.contributions ADD CONSTRAINT contributions_status_check CHECK (status IN ('confirmed', 'failed'));

-- 5. Simplify contributions method - focus on digital payments
ALTER TABLE public.contributions DROP CONSTRAINT IF EXISTS contributions_method_check;
ALTER TABLE public.contributions ADD CONSTRAINT contributions_method_check CHECK (method IN ('wallet', 'card', 'bank_transfer', 'mobile_money'));

-- 6. Update default status to confirmed (no approval needed)
ALTER TABLE public.contributions ALTER COLUMN status SET DEFAULT 'confirmed';

-- 7. Remove agent-related functions
DROP FUNCTION IF EXISTS public.is_agent_or_admin();
DROP FUNCTION IF EXISTS public.handle_contribution_approval();

-- 8. Remove agent-related triggers
DROP TRIGGER IF EXISTS trg_contribution_approved ON public.contributions;

-- 9. Update RLS policies to remove agent-specific policies
DROP POLICY IF EXISTS contributions_update_agent_approve ON public.contributions;
DROP POLICY IF EXISTS contrib_update_agent_admin ON public.contributions;
DROP POLICY IF EXISTS "agent insert contribution" ON public.contributions;
DROP POLICY IF EXISTS clusters_select_agent ON public.clusters;
DROP POLICY IF EXISTS clusters_update_agent ON public.clusters;
DROP POLICY IF EXISTS cluster_members_select_agent ON public.cluster_members;
DROP POLICY IF EXISTS cluster_members_insert_agent ON public.cluster_members;

-- 10. Update existing contributions to remove agent references
UPDATE public.contributions SET status = 'confirmed' WHERE status IN ('pending', 'approved', 'rejected');

-- 11. Add new digital payment methods to contributions
-- This will be handled by the application layer

-- 12. Create simplified contribution function for digital payments
CREATE OR REPLACE FUNCTION public.create_digital_contribution(
  p_user_id uuid,
  p_amount_kobo bigint,
  p_method text,
  p_contributed_at date DEFAULT current_date
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_contribution_id uuid;
BEGIN
  -- Validate amount (minimum ₦200)
  IF p_amount_kobo < 20000 THEN
    RAISE EXCEPTION 'Minimum contribution amount is ₦200';
  END IF;
  
  -- Validate method
  IF p_method NOT IN ('wallet', 'card', 'bank_transfer', 'mobile_money') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;
  
  -- Insert contribution
  INSERT INTO public.contributions (
    user_id,
    amount_kobo,
    method,
    status,
    contributed_at
  ) VALUES (
    p_user_id,
    p_amount_kobo,
    p_method,
    'confirmed',
    p_contributed_at
  ) RETURNING id INTO v_contribution_id;
  
  RETURN v_contribution_id;
END;
$$;

-- 13. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_digital_contribution TO authenticated;

-- 14. Update wallet balance trigger to work without agents
CREATE OR REPLACE FUNCTION public.update_wallet_balance() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Update wallet balance when contribution is confirmed
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    UPDATE public.wallets 
    SET balance_kobo = balance_kobo + NEW.amount_kobo,
        updated_at = NOW()
    WHERE profile_id = NEW.user_id;
    
    -- Create wallet transaction record
    INSERT INTO public.wallet_transactions (
      wallet_id,
      amount_kobo,
      type,
      status,
      reference,
      description,
      metadata
    ) VALUES (
      (SELECT id FROM public.wallets WHERE profile_id = NEW.user_id),
      NEW.amount_kobo,
      'credit',
      'completed',
      gen_random_uuid()::TEXT,
      'Digital contribution',
      jsonb_build_object(
        'contribution_id', NEW.id,
        'method', NEW.method,
        'contributed_at', NEW.contributed_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 15. Create trigger for wallet balance updates
DROP TRIGGER IF EXISTS trg_update_wallet_balance ON public.contributions;
CREATE TRIGGER trg_update_wallet_balance
  AFTER INSERT OR UPDATE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wallet_balance();

-- 16. Update existing RLS policies for contributions
DROP POLICY IF EXISTS contributions_select_scope ON public.contributions;
DROP POLICY IF EXISTS contributions_insert_customer ON public.contributions;

-- Create simplified RLS policies
CREATE POLICY "contributions_select_own" ON public.contributions
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "contributions_insert_own" ON public.contributions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update profiles RLS policies to include settings
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- 17. Remove agent-related notifications
DELETE FROM public.notifications WHERE event LIKE '%agent%' OR event LIKE '%approval%';

-- 18. Update notification types to remove agent-related ones
-- This will be handled by the application layer

-- 19. Create index for better performance on contributions
CREATE INDEX IF NOT EXISTS idx_contributions_user_id_contributed_at ON public.contributions(user_id, contributed_at DESC);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.contributions(status);

-- Create index for settings column
CREATE INDEX IF NOT EXISTS idx_profiles_settings ON public.profiles USING GIN (settings);

-- 20. Add comment to document the change
COMMENT ON TABLE public.contributions IS 'Digital contributions only - agent system removed for simplification';
COMMENT ON TABLE public.profiles IS 'Simplified to customer and admin roles only';

-- 21. Update any existing agent users to customer role
UPDATE public.profiles SET role = 'customer' WHERE role = 'agent';

-- 22. Clean up any orphaned data
DELETE FROM public.wallet_transactions WHERE metadata->>'commission_for' IS NOT NULL;
