-- First drop dependent objects
ALTER TABLE IF EXISTS public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Update transaction types to include group-related types
ALTER TABLE public.transactions 
  ALTER COLUMN type TYPE TEXT,
  ADD CONSTRAINT transactions_type_check 
  CHECK (type IN (
    'deposit', 
    'withdrawal', 
    'transfer',
    'commission', 
    'penalty',
    'group_contribution',
    'group_withdrawal',
    'group_payout',
    'group_penalty',
    'group_commission'
  ));

-- Update the enum type for wallet_transactions as well if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
    ALTER TABLE public.wallet_transactions 
      DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
      
    ALTER TABLE public.wallet_transactions
      ALTER COLUMN type TYPE TEXT,
      ADD CONSTRAINT wallet_transactions_type_check 
      CHECK (type IN (
        'credit',
        'debit',
        'group_contribution',
        'group_withdrawal',
        'group_payout',
        'group_penalty',
        'group_commission'
      ));
  END IF;
END $$;
