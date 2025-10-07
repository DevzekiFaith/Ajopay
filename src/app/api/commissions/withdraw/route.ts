import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !authData?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = authData.user;
    const { amount, method, accountDetails } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }

    if (!method || !['bank_transfer', 'mobile_money', 'wallet'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid withdrawal method' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll simulate a withdrawal
    // In production, this would:
    // 1. Check user's available balance
    // 2. Create a withdrawal request
    // 3. Process the payment
    // 4. Update user's balance
    
    const withdrawalId = `withdrawal_${Date.now()}`;
    const processingTime = method === 'wallet' ? 'Instant' : '1-3 business days';
    
    // Simulate withdrawal processing
    const withdrawal = {
      id: withdrawalId,
      user_id: user.id,
      amount_kobo: amount * 100, // Convert to kobo
      method: method,
      status: method === 'wallet' ? 'completed' : 'processing',
      account_details: accountDetails,
      created_at: new Date().toISOString(),
      processed_at: method === 'wallet' ? new Date().toISOString() : null
    };

    return NextResponse.json({
      success: true,
      message: `Withdrawal request submitted successfully! ${processingTime} processing time.`,
      withdrawal: withdrawal,
      processingTime: processingTime
    });

  } catch (error) {
    console.error('Withdrawal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !authData?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = authData.user;

    // Return demo withdrawal history
    const demoWithdrawals = [
      {
        id: `withdrawal_${Date.now() - 86400000}`,
        amount_kobo: 100000, // ₦1,000
        method: 'bank_transfer',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        processed_at: new Date(Date.now() - 86400000 + 3600000).toISOString()
      },
      {
        id: `withdrawal_${Date.now() - 172800000}`,
        amount_kobo: 50000, // ₦500
        method: 'mobile_money',
        status: 'completed',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        processed_at: new Date(Date.now() - 172800000 + 1800000).toISOString()
      }
    ];

    return NextResponse.json({
      withdrawals: demoWithdrawals,
      totalWithdrawn: demoWithdrawals.reduce((sum, w) => sum + w.amount_kobo, 0)
    });

  } catch (error) {
    console.error('Withdrawal history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
