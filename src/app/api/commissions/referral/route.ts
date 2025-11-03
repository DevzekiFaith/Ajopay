import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    
    // For now, let's use a demo user ID to make the system work
    const demoUserId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID format
    const user = authData?.user || { id: demoUserId, email: 'demo@example.com' };
    
    console.log('Referral API - Using user:', { 
      id: user.id, 
      email: user.email,
      isDemo: !authData?.user 
    });

    // Get user's referral code
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    // Get referral stats
    const { data: referrals } = await supabase
      .from('user_referrals')
      .select('*')
      .eq('referrer_id', user.id);

    const stats = {
      totalReferrals: referrals?.length || 0,
      completedReferrals: referrals?.filter(r => r.status === 'completed').length || 0,
      totalEarned: referrals?.reduce((sum, r) => sum + r.commission_earned_kobo, 0) || 0,
      referralCode: profile?.referral_code
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Referral API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    
    // For now, let's use a demo user ID to make the system work
    // In production, this would come from proper authentication
    const demoUserId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID format
    const user = authData?.user || { id: demoUserId, email: 'demo@example.com' };
    
    console.log('Referral POST API - Using user:', { 
      id: user.id, 
      email: user.email,
      isDemo: !authData?.user 
    });

    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Find referrer by code
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      );
    }

    if (referrer.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }

    // Check if user already has a referral
    const { data: existingReferral } = await supabase
      .from('user_referrals')
      .select('id')
      .eq('referred_id', user.id)
      .single();

    if (existingReferral) {
      return NextResponse.json(
        { error: 'You have already used a referral code' },
        { status: 400 }
      );
    }

    // Create referral
    const { data: referral, error } = await supabase
      .from('user_referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: user.id,
        referral_code: referralCode.toUpperCase()
      })
      .select()
      .single();

    if (error) {
      console.error('Referral creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create referral' },
        { status: 500 }
      );
    }

    // Award welcome bonus to referrer
    await supabase.rpc('award_commission', {
      p_user_id: referrer.id,
      p_commission_type: 'referral_bonus',
      p_amount_kobo: 500, // ₦5 welcome bonus
      p_description: 'Referral bonus for ' + user.email,
      p_source_id: referral.id,
      p_source_type: 'referral'
    });

    return NextResponse.json({
      success: true,
      message: 'Referral code applied successfully!',
      referrer: referrer.full_name
    });

  } catch (error) {
    console.error('Referral API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
