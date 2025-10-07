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

    const { badgeName, badgeRarity } = await request.json();

    if (!badgeName || !badgeRarity) {
      return NextResponse.json(
        { error: 'Badge name and rarity are required' },
        { status: 400 }
      );
    }

    // Award commission for badge
    const { data: commissionId, error } = await supabase.rpc('process_badge_earning', {
      p_user_id: user.id,
      p_badge_name: badgeName,
      p_badge_rarity: badgeRarity
    });

    if (error) {
      console.error('Badge commission error:', error);
      return NextResponse.json(
        { error: 'Failed to award badge commission' },
        { status: 500 }
      );
    }

    // Get the commission amount for response
    const { data: commission } = await supabase
      .from('user_commissions')
      .select('amount_kobo')
      .eq('id', commissionId)
      .single();

    const amount = commission ? `₦${(commission.amount_kobo / 100).toLocaleString()}` : '₦0';

    return NextResponse.json({
      success: true,
      message: `Badge commission awarded!`,
      amount,
      commissionId
    });

  } catch (error) {
    console.error('Badge commission API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
