import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

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

    // Return demo data that works without database changes
    // Generate demo commissions based on user ID (deterministic)
    
    const userHash = user.id.split('-')[0];
    const dayOfYear = Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24));
    const simulatedStreak = (parseInt(userHash, 16) + dayOfYear) % 30 + 1;
    
    // Create demo commissions
    const demoCommissions = [];
    
    // Add a daily check-in commission
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

    // Add some sample commissions for demo
    if (simulatedStreak >= 7) {
      demoCommissions.push({
        id: `streak_${Date.now()}`,
        commission_type: 'streak_milestone',
        amount_kobo: 100000, // ₦1,000
        description: '7-day streak milestone bonus',
        status: 'paid',
        created_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
      });
    }

    const summary = {
      totalEarned: demoCommissions.reduce((sum, c) => sum + c.amount_kobo, 0),
      totalPaid: demoCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount_kobo, 0),
      totalPending: demoCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount_kobo, 0),
      totalAvailable: demoCommissions.reduce((sum, c) => sum + c.amount_kobo, 0), // All earned amounts are available for withdrawal
      byType: {
        daily_checkin: demoCommissions.filter(c => c.commission_type === 'daily_checkin').reduce((sum, c) => sum + c.amount_kobo, 0),
        streak_milestone: demoCommissions.filter(c => c.commission_type === 'streak_milestone').reduce((sum, c) => sum + c.amount_kobo, 0)
      }
    };

    return NextResponse.json({
      commissions: demoCommissions,
      summary,
      pagination: {
        limit: 50,
        offset: 0,
        hasMore: false
      }
    });

  } catch (error) {
    console.error('Commissions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
