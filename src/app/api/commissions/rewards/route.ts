import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
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

    // Get available rewards
    const { data: rewards, error } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_claimed', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Rewards fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rewards' },
        { status: 500 }
      );
    }

    // Filter out expired rewards
    const now = new Date();
    const availableRewards = rewards?.filter(reward => 
      !reward.expires_at || new Date(reward.expires_at) > now
    ) || [];

    return NextResponse.json({
      rewards: availableRewards,
      totalAvailable: availableRewards.reduce((sum, r) => sum + r.amount_kobo, 0)
    });

  } catch (error) {
    console.error('Rewards API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { rewardId } = await request.json();

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
        { status: 400 }
      );
    }

    // Claim reward
    const { data: success, error } = await supabase.rpc('claim_reward', {
      p_reward_id: rewardId
    });

    if (error) {
      console.error('Claim reward error:', error);
      return NextResponse.json(
        { error: 'Failed to claim reward' },
        { status: 500 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Reward not available or already claimed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reward claimed successfully!'
    });

  } catch (error) {
    console.error('Claim reward API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
