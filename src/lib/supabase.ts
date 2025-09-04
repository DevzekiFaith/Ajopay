import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabaseBrowserClient() {
  return supabase;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'commission' | 'penalty';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  timestamp: Date;
  user_id: string;
  reference: string;
  metadata?: Record<string, any>;
}
