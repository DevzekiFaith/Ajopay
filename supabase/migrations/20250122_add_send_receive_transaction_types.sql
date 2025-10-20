-- Add 'send' and 'receive' transaction types to support wallet transfers
-- This fixes the "failed to create transaction 500" error in wallet send functionality

-- Drop the existing constraint
ALTER TABLE IF EXISTS public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add the new constraint with 'send' and 'receive' types
ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_type_check 
  CHECK (type IN (
    'deposit', 
    'withdrawal', 
    'transfer',
    'send',        -- Added for wallet send functionality
    'receive',     -- Added for wallet receive functionality
    'commission', 
    'penalty',
    'group_contribution',
    'group_withdrawal',
    'group_payout',
    'group_penalty',
    'group_commission'
  ));

-- Update the wallet_transactions constraint as well if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
    ALTER TABLE public.wallet_transactions 
      DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
      
    ALTER TABLE public.wallet_transactions
      ADD CONSTRAINT wallet_transactions_type_check 
      CHECK (type IN (
        'credit',
        'debit',
        'send',        -- Added for wallet send functionality
        'receive',     -- Added for wallet receive functionality
        'group_contribution',
        'group_withdrawal',
        'group_payout',
        'group_penalty',
        'group_commission'
      ));
  END IF;
END $$;
