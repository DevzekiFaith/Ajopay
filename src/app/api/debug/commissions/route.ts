import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !authData?.user) {
      return NextResponse.json({
        error: 'Not authenticated',
        authError: authErr?.message,
        user: authData?.user
      }, { status: 401 });
    }

    const user = authData.user;

    // Generate demo data (same logic as commissions/list)
    const userHash = user.id.split('-')[0];
    const dayOfYear = Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24));
    const simulatedStreak = (parseInt(userHash, 16) + dayOfYear) % 30 + 1;
    
    const demoCommissions = [];
    
    const baseAmount = 5000; // ₦50
    const streakBonus = Math.min(simulatedStreak * 1000, 5000);
    const totalAmount = baseAmount + streakBonus;
    
    demoCommissions.push({
      id: `checkin_${Date.now()}`,
      commission_type: 'daily_checkin',
      amount_kobo: totalAmount,
      description: `Daily check-in bonus (Streak: ${simulatedStreak} days)`,
      status: 'paid',
      created_at: new Date().toISOString()
    });

    if (simulatedStreak >= 7) {
      demoCommissions.push({
        id: `streak_${Date.now()}`,
        commission_type: 'streak_milestone',
        amount_kobo: 100000, // ₦1,000
        description: '7-day streak milestone bonus',
        status: 'paid',
        created_at: new Date(Date.now() - 86400000).toISOString()
      });
    }

    const summary = {
      totalEarned: demoCommissions.reduce((sum, c) => sum + c.amount_kobo, 0),
      totalPaid: demoCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount_kobo, 0),
      totalPending: demoCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount_kobo, 0),
      totalAvailable: demoCommissions.reduce((sum, c) => sum + c.amount_kobo, 0),
      byType: {
        daily_checkin: demoCommissions.filter(c => c.commission_type === 'daily_checkin').reduce((sum, c) => sum + c.amount_kobo, 0),
        streak_milestone: demoCommissions.filter(c => c.commission_type === 'streak_milestone').reduce((sum, c) => sum + c.amount_kobo, 0)
      }
    };

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      debug: {
        userHash,
        dayOfYear,
        simulatedStreak
      },
      commissions: demoCommissions,
      summary,
      message: 'Commission data generated successfully'
    });

  } catch (error) {
    console.error('Commission debug error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error
    }, { status: 500 });
  }
}


