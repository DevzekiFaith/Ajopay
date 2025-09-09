import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { group_id, amount_kobo, payment_method = 'wallet' } = body;

    if (!group_id || !amount_kobo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate payment method
    const validPaymentMethods = ['wallet', 'card', 'bank'];
    if (!validPaymentMethods.includes(payment_method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Verify user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from('savings_group_members')
      .select('is_admin')
      .eq('group_id', group_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 403 }
      );
    }

    // Start a transaction
    const { data: transaction, error: txError } = await supabase.rpc('contribute_to_group', {
      p_group_id: group_id,
      p_user_id: user.id,
      p_amount_kobo: amount_kobo,
      p_payment_method: payment_method
    });

    if (txError) {
      console.error('Transaction error:', txError);
      throw txError;
    }

    return NextResponse.json({
      success: true,
      transaction_id: transaction,
      message: payment_method === 'wallet' 
        ? 'Contribution successful!'
        : 'Contribution initiated. Please complete the payment.'
    });
  } catch (error) {
    console.error('Error processing contribution:', error);
    return NextResponse.json(
      { error: 'Failed to process contribution' },
      { status: 500 }
    );
  }
}
