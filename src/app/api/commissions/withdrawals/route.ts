import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

interface Withdrawal {
  id: string;
  amount_kobo: number;
  method: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get withdrawals from commission_payouts table
    let withdrawals: Withdrawal[] = [];
    try {
      const { data: payoutData, error: payoutError } = await supabase
        .from('commission_payouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!payoutError && payoutData) {
        withdrawals = payoutData.map(payout => ({
          id: payout.id,
          amount_kobo: payout.total_amount_kobo,
          method: payout.payout_method,
          status: payout.status,
          created_at: payout.created_at,
          processed_at: payout.processed_at
        }));
      }
    } catch (error) {
      console.log('commission_payouts table not available, using fallback');
    }

    // Fallback: Check transactions table for withdrawal records
    if (withdrawals.length === 0) {
      try {
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'withdrawal')
          .order('created_at', { ascending: false });

        if (!transactionError && transactionData) {
          withdrawals = transactionData.map(transaction => ({
            id: transaction.id,
            amount_kobo: transaction.amount_kobo,
            method: transaction.metadata?.method || 'bank_transfer',
            status: transaction.status === 'completed' ? 'completed' : 
                   transaction.status === 'pending' ? 'pending' : 'failed',
            created_at: transaction.created_at,
            processed_at: transaction.status === 'completed' ? transaction.updated_at : null
          }));
        }
      } catch (error) {
        console.log('transactions table not available for withdrawals');
      }
    }

    // If still no data, return empty array
    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error('Withdrawals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
