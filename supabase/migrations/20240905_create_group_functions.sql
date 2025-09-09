-- Function to handle group contributions
CREATE OR REPLACE FUNCTION public.contribute_to_group(
  p_group_id UUID,
  p_user_id UUID,
  p_amount_kobo BIGINT,
  p_payment_method TEXT DEFAULT 'wallet'
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_group_balance BIGINT;
  v_target_amount BIGINT;
  v_total_contributors BIGINT;
  v_contribution_per_member BIGINT;
  v_payout_amount BIGINT;
  v_recipient_id UUID;
  v_commission_amount BIGINT;
  v_user_balance BIGINT;
  v_commission_rate NUMERIC := 0.02; -- 2% commission
  v_payment_metadata JSONB;
BEGIN
  -- Verify membership and get group details
  IF NOT EXISTS (
    SELECT 1 
    FROM public.savings_group_members 
    WHERE group_id = p_group_id 
    AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this group';
  END IF;

  -- Get group target amount and lock the row
  SELECT target_amount_kobo INTO v_target_amount
  FROM public.savings_groups
  WHERE id = p_group_id
  FOR UPDATE;
  
  -- Handle payment based on payment method
  IF p_payment_method = 'wallet' THEN
    -- Check user balance for wallet payments
    SELECT COALESCE(balance_kobo, 0) INTO v_user_balance
    FROM user_wallets
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock the wallet row
    
    IF v_user_balance < p_amount_kobo THEN
      RAISE EXCEPTION 'Insufficient balance in wallet';
    END IF;
    
    -- Deduct from wallet
    UPDATE user_wallets
    SET balance_kobo = balance_kobo - p_amount_kobo,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record wallet transaction
    INSERT INTO wallet_transactions (
      user_id,
      amount_kobo,
      type,
      status,
      reference,
      description
    ) VALUES (
      p_user_id,
      p_amount_kobo,
      'debit',
      'completed',
      gen_random_uuid()::TEXT,
      'Group contribution'
    );
    
    v_payment_metadata := jsonb_build_object(
      'payment_method', 'wallet',
      'wallet_balance_before', v_user_balance,
      'wallet_balance_after', v_user_balance - p_amount_kobo
    );
  ELSE
    -- For non-wallet payments, we'll just record the payment method
    -- In a real app, you would integrate with a payment processor here
    v_payment_metadata := jsonb_build_object(
      'payment_method', p_payment_method,
      'status', 'pending_verification'
    );
  END IF;

  -- Create contribution transaction
  INSERT INTO public.transactions (
    user_id,
    amount_kobo,
    type,
    status,
    reference,
    description,
    group_id,
    is_group_transaction,
    metadata
  ) VALUES (
    p_user_id,
    p_amount_kobo,
    'group_contribution',
    CASE WHEN p_payment_method = 'wallet' THEN 'completed' ELSE 'pending' END,
    'GRP-' || gen_random_uuid(),
    'Contribution to group',
    p_group_id,
    TRUE,
    jsonb_build_object(
      'payment_method', p_payment_method,
      'group_id', p_group_id,
      'contribution_details', v_payment_metadata
    )
  )
  RETURNING id INTO v_transaction_id;

  -- Update member's last contribution
  UPDATE public.savings_group_members
  SET 
    last_contribution_date = NOW(),
    contribution_count = contribution_count + 1
  WHERE group_id = p_group_id
  AND user_id = p_user_id;

  -- Update group's current balance if payment is completed
  IF p_payment_method = 'wallet' THEN
    UPDATE public.savings_groups
    SET current_balance_kobo = COALESCE(current_balance_kobo, 0) + p_amount_kobo,
        updated_at = NOW()
    WHERE id = p_group_id
    RETURNING current_balance_kobo INTO v_group_balance;
  ELSE
    -- For non-wallet payments, get current balance without updating
    SELECT COALESCE(current_balance_kobo, 0) INTO v_group_balance
    FROM public.savings_groups
    WHERE id = p_group_id;
  END IF;

  -- Update group's next contribution date based on frequency
  UPDATE public.savings_groups
  SET 
    next_contribution_date = 
      CASE 
        WHEN frequency = 'daily' THEN NOW() + INTERVAL '1 day'
        WHEN frequency = 'weekly' THEN NOW() + INTERVAL '1 week'
        WHEN frequency = 'monthly' THEN NOW() + INTERVAL '1 month'
        ELSE next_contribution_date
      end,
    updated_at = NOW()
  WHERE id = p_group_id;

  -- Check if target is reached
  IF v_target_amount IS NOT NULL AND v_group_balance >= v_target_amount THEN
    -- Get total contributors
    SELECT COUNT(*) INTO v_total_contributors
    FROM public.savings_group_members
    WHERE group_id = p_group_id;

    -- Calculate payout amount per member (excluding commission)
    v_payout_amount := (v_target_amount * (1 - v_commission_rate)) / v_total_contributors;
    v_commission_amount := v_target_amount * v_commission_rate;

    -- Get next recipient in rotation
    SELECT user_id INTO v_recipient_id
    FROM public.savings_group_members
    WHERE group_id = p_group_id
    AND last_payout_date = (
      SELECT MIN(last_payout_date) 
      FROM public.savings_group_members 
      WHERE group_id = p_group_id
    )
    LIMIT 1;

    -- Record payouts to members
    INSERT INTO public.transactions (
      user_id,
      amount_kobo,
      type,
      status,
      reference,
      description,
      group_id,
      is_group_transaction,
      metadata
    )
    SELECT 
      user_id,
      v_payout_amount,
      'group_payout',
      'completed',
      'PAY_' || gen_random_uuid(),
      'Group payout',
      p_group_id,
      true,
      jsonb_build_object('recipient_id', v_recipient_id, 'is_recipient', (user_id = v_recipient_id))
    FROM public.savings_group_members
    WHERE group_id = p_group_id;

    -- Record commission
    IF v_commission_amount > 0 THEN
      INSERT INTO public.transactions (
        user_id,
        amount_kobo,
        type,
        status,
        reference,
        description,
        group_id,
        is_group_transaction,
        metadata
      ) VALUES (
        (SELECT created_by FROM public.savings_groups WHERE id = p_group_id),
        v_commission_amount,
        'group_commission',
        'completed',
        'COMM_' || gen_random_uuid(),
        'Group commission',
        p_group_id,
        true,
        jsonb_build_object('group_id', p_group_id, 'total_contributions', v_target_amount)
      );
    END IF;

    -- Update last payout dates
    UPDATE public.savings_group_members
    SET last_payout_date = NOW()
    WHERE group_id = p_group_id
    AND user_id = v_recipient_id;

    -- Reset group target
    UPDATE public.savings_groups
    SET 
      target_amount_kobo = NULL,
      updated_at = NOW()
    WHERE id = p_group_id;
  END IF;

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'group_balance', v_group_balance,
    'target_amount', v_target_amount,
    'contribution_amount', p_amount_kobo,
    'payout_triggered', (v_target_amount IS NOT NULL AND v_group_balance >= v_target_amount)
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE NOTICE 'Error in contribute_to_group: %', SQLERRM;
    -- Re-raise the exception
    RAISE;
END;
$$;
