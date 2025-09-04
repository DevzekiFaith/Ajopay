-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount_kobo INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'commission', 'penalty')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
CREATE POLICY "Enable read access for users on their own transactions"
ON public.transactions 
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users"
ON public.transactions 
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
