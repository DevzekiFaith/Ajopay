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

    const { goalId, goalTitle, targetAmount } = await request.json();

    if (!goalId || !goalTitle || !targetAmount) {
      return NextResponse.json(
        { error: 'Goal ID, title, and target amount are required' },
        { status: 400 }
      );
    }

    // Award commission for goal completion
    const { data: success, error } = await supabase.rpc('process_goal_completion', {
      p_user_id: user.id,
      p_goal_id: goalId,
      p_goal_title: goalTitle,
      p_target_amount: targetAmount
    });

    if (error) {
      console.error('Goal completion commission error:', error);
      return NextResponse.json(
        { error: 'Failed to award goal completion commission' },
        { status: 500 }
      );
    }

    // Get the commission amount for response
    const { data: commission } = await supabase
      .from('user_commissions')
      .select('amount_kobo')
      .eq('user_id', user.id)
      .eq('commission_type', 'goal_complete')
      .eq('source_id', goalId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const amount = commission ? `₦${(commission.amount_kobo / 100).toLocaleString()}` : '₦0';

    return NextResponse.json({
      success: true,
      message: `Goal completion commission awarded!`,
      amount,
      goalTitle
    });

  } catch (error) {
    console.error('Goal completion commission API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
