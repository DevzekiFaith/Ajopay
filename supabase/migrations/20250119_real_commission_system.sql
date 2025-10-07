-- Real Commission System for 250k+ Users
-- Optimized for high-scale performance

-- Commission types table
CREATE TABLE IF NOT EXISTS commission_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_amount_kobo INTEGER NOT NULL DEFAULT 0,
  multiplier DECIMAL(5,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert commission types
INSERT INTO commission_types (type_code, name, description, base_amount_kobo, multiplier) VALUES
('daily_checkin', 'Daily Check-in', 'Reward for daily app check-in', 5000, 1.0),
('streak_7', '7-Day Streak', 'Bonus for 7-day check-in streak', 100000, 1.0),
('streak_30', '30-Day Streak', 'Bonus for 30-day check-in streak', 500000, 1.0),
('goal_complete', 'Goal Completion', 'Reward for completing savings goal', 25000, 1.0),
('badge_earned', 'Badge Achievement', 'Reward for earning achievement badge', 15000, 1.0),
('referral_signup', 'Referral Signup', 'Reward for successful referral signup', 100000, 1.0),
('referral_verified', 'Referral Verification', 'Reward when referral completes verification', 50000, 1.0),
('first_deposit', 'First Deposit', 'Reward for first wallet deposit', 20000, 1.0),
('monthly_active', 'Monthly Active User', 'Reward for monthly activity', 30000, 1.0)
ON CONFLICT (type_code) DO NOTHING;

-- User commissions table (optimized for scale)
CREATE TABLE IF NOT EXISTS user_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commission_type_id UUID NOT NULL REFERENCES commission_types(id),
  amount_kobo INTEGER NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'failed')),
  source_type VARCHAR(50), -- 'checkin', 'goal', 'referral', etc.
  source_id UUID, -- Reference to the source (goal_id, referral_id, etc.)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Commission payouts table
CREATE TABLE IF NOT EXISTS commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_kobo INTEGER NOT NULL,
  payout_method VARCHAR(50) NOT NULL, -- 'bank_transfer', 'wallet', 'mobile_money'
  payout_details JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  reference VARCHAR(100) UNIQUE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User check-in tracking (optimized for daily operations)
CREATE TABLE IF NOT EXISTS user_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  streak_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- User referral tracking
CREATE TABLE IF NOT EXISTS user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'completed')),
  commission_earned_kobo INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- User commission summary (materialized view for performance)
CREATE TABLE IF NOT EXISTS user_commission_summary (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_earned_kobo INTEGER DEFAULT 0,
  total_paid_kobo INTEGER DEFAULT 0,
  total_pending_kobo INTEGER DEFAULT 0,
  last_checkin_date DATE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  completed_referrals INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes for 250k+ users
CREATE INDEX IF NOT EXISTS idx_user_commissions_user_id ON user_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_commissions_status ON user_commissions(status);
CREATE INDEX IF NOT EXISTS idx_user_commissions_created_at ON user_commissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_commissions_type ON user_commissions(commission_type_id);
CREATE INDEX IF NOT EXISTS idx_user_commissions_user_status ON user_commissions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_commission_payouts_user_id ON commission_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_status ON commission_payouts(status);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_created_at ON commission_payouts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_checkins_user_date ON user_checkins(user_id, checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_checkins_date ON user_checkins(checkin_date);

CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON user_referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);

-- RLS Policies
ALTER TABLE commission_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_commission_summary ENABLE ROW LEVEL SECURITY;

-- Commission types - readable by all authenticated users
CREATE POLICY "Commission types are viewable by authenticated users" ON commission_types
  FOR SELECT USING (auth.role() = 'authenticated');

-- User commissions - users can only see their own
CREATE POLICY "Users can view their own commissions" ON user_commissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own commissions" ON user_commissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Commission payouts - users can only see their own
CREATE POLICY "Users can view their own payouts" ON commission_payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payouts" ON commission_payouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User checkins - users can only see their own
CREATE POLICY "Users can view their own checkins" ON user_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkins" ON user_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkins" ON user_checkins
  FOR UPDATE USING (auth.uid() = user_id);

-- User referrals - users can see referrals they made and referrals made to them
CREATE POLICY "Users can view their referrals" ON user_referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can insert referrals" ON user_referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Commission summary - users can only see their own
CREATE POLICY "Users can view their own commission summary" ON user_commission_summary
  FOR SELECT USING (auth.uid() = user_id);

-- Functions for commission management
CREATE OR REPLACE FUNCTION award_commission(
  p_user_id UUID,
  p_commission_type_code VARCHAR(50),
  p_description TEXT,
  p_source_type VARCHAR(50) DEFAULT NULL,
  p_source_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_commission_type_id UUID;
  v_base_amount INTEGER;
  v_multiplier DECIMAL(5,2);
  v_final_amount INTEGER;
  v_commission_id UUID;
BEGIN
  -- Get commission type details
  SELECT id, base_amount_kobo, multiplier INTO v_commission_type_id, v_base_amount, v_multiplier
  FROM commission_types 
  WHERE type_code = p_commission_type_code AND is_active = true;
  
  IF v_commission_type_id IS NULL THEN
    RAISE EXCEPTION 'Commission type % not found or inactive', p_commission_type_code;
  END IF;
  
  -- Calculate final amount
  v_final_amount := ROUND(v_base_amount * v_multiplier);
  
  -- Insert commission
  INSERT INTO user_commissions (
    user_id, commission_type_id, amount_kobo, description, 
    source_type, source_id, metadata
  ) VALUES (
    p_user_id, v_commission_type_id, v_final_amount, p_description,
    p_source_type, p_source_id, p_metadata
  ) RETURNING id INTO v_commission_id;
  
  -- Update summary
  UPDATE user_commission_summary 
  SET 
    total_earned_kobo = total_earned_kobo + v_final_amount,
    total_pending_kobo = total_pending_kobo + v_final_amount,
    last_updated = NOW()
  WHERE user_id = p_user_id;
  
  -- Insert summary if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO user_commission_summary (user_id, total_earned_kobo, total_pending_kobo)
    VALUES (p_user_id, v_final_amount, v_final_amount);
  END IF;
  
  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process daily check-in
CREATE OR REPLACE FUNCTION process_daily_checkin(p_user_id UUID) RETURNS JSONB AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_last_checkin DATE;
  v_current_streak INTEGER := 1;
  v_commission_id UUID;
  v_result JSONB;
BEGIN
  -- Check if already checked in today
  IF EXISTS (SELECT 1 FROM user_checkins WHERE user_id = p_user_id AND checkin_date = v_today) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Already checked in today',
      'streak', 0
    );
  END IF;
  
  -- Get last check-in date
  SELECT checkin_date INTO v_last_checkin
  FROM user_checkins 
  WHERE user_id = p_user_id 
  ORDER BY checkin_date DESC 
  LIMIT 1;
  
  -- Calculate streak
  IF v_last_checkin = v_yesterday THEN
    -- Continue streak
    SELECT streak_count + 1 INTO v_current_streak
    FROM user_checkins 
    WHERE user_id = p_user_id AND checkin_date = v_yesterday;
  ELSIF v_last_checkin IS NOT NULL AND v_last_checkin < v_yesterday THEN
    -- Streak broken, start over
    v_current_streak := 1;
  END IF;
  
  -- Insert check-in record
  INSERT INTO user_checkins (user_id, checkin_date, streak_count)
  VALUES (p_user_id, v_today, v_current_streak);
  
  -- Award daily check-in commission
  v_commission_id := award_commission(
    p_user_id,
    'daily_checkin',
    'Daily check-in bonus - Day ' || v_current_streak,
    'checkin',
    NULL,
    jsonb_build_object('streak', v_current_streak, 'date', v_today)
  );
  
  -- Check for streak milestones
  IF v_current_streak = 7 THEN
    award_commission(
      p_user_id,
      'streak_7',
      '7-day streak milestone bonus!',
      'streak_milestone',
      NULL,
      jsonb_build_object('streak', 7, 'date', v_today)
    );
  ELSIF v_current_streak = 30 THEN
    award_commission(
      p_user_id,
      'streak_30',
      '30-day streak milestone bonus!',
      'streak_milestone',
      NULL,
      jsonb_build_object('streak', 30, 'date', v_today)
    );
  END IF;
  
  -- Update commission summary
  UPDATE user_commission_summary 
  SET 
    last_checkin_date = v_today,
    current_streak = v_current_streak,
    longest_streak = GREATEST(longest_streak, v_current_streak),
    last_updated = NOW()
  WHERE user_id = p_user_id;
  
  -- Insert summary if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO user_commission_summary (user_id, last_checkin_date, current_streak, longest_streak)
    VALUES (p_user_id, v_today, v_current_streak, v_current_streak);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Check-in successful',
    'streak', v_current_streak,
    'commission_id', v_commission_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user commission summary
CREATE OR REPLACE FUNCTION get_user_commission_summary(p_user_id UUID) RETURNS JSONB AS $$
DECLARE
  v_summary user_commission_summary%ROWTYPE;
  v_recent_commissions JSONB;
  v_recent_payouts JSONB;
BEGIN
  -- Get summary
  SELECT * INTO v_summary FROM user_commission_summary WHERE user_id = p_user_id;
  
  -- Get recent commissions
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'type', ct.name,
      'amount_kobo', amount_kobo,
      'description', description,
      'status', status,
      'created_at', created_at
    ) ORDER BY created_at DESC
  ) INTO v_recent_commissions
  FROM user_commissions uc
  JOIN commission_types ct ON uc.commission_type_id = ct.id
  WHERE uc.user_id = p_user_id
  LIMIT 10;
  
  -- Get recent payouts
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'amount_kobo', amount_kobo,
      'payout_method', payout_method,
      'status', status,
      'created_at', created_at
    ) ORDER BY created_at DESC
  ) INTO v_recent_payouts
  FROM commission_payouts
  WHERE user_id = p_user_id
  LIMIT 5;
  
  RETURN jsonb_build_object(
    'summary', row_to_json(v_summary),
    'recent_commissions', COALESCE(v_recent_commissions, '[]'::jsonb),
    'recent_payouts', COALESCE(v_recent_payouts, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commission_types_updated_at BEFORE UPDATE ON commission_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_commissions_updated_at BEFORE UPDATE ON user_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_payouts_updated_at BEFORE UPDATE ON commission_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_referrals_updated_at BEFORE UPDATE ON user_referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
