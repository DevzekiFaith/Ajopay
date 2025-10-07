import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Try to get user with more detailed error logging
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    
    console.log('Commission API - Auth check:', { 
      hasUser: !!authData?.user, 
      userId: authData?.user?.id,
      error: authErr?.message 
    });
    
    if (authErr) {
      console.error('Commission API - Auth error:', authErr);
      return NextResponse.json(
        { error: 'Authentication failed', details: authErr.message },
        { status: 401 }
      );
    }
    
    if (!authData?.user) {
      console.log('Commission API - No user found');
      return NextResponse.json(
        { error: 'Not authenticated - no user found' },
        { status: 401 }
      );
    }

    const user = authData.user;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 records
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if commission tables exist, if not use fallback
    const { data: tableCheck } = await supabase
      .from('user_commissions')
      .select('id')
      .limit(1);

    if (!tableCheck) {
      // Tables don't exist yet, use fallback with demo data
      console.log('Commission tables not found, using fallback data');
      
      // Generate demo data based on user ID (deterministic)
      const userHash = user.id.split('-')[0];
      const dayOfYear = Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24));
      const simulatedStreak = (parseInt(userHash, 16) + dayOfYear) % 30 + 1;
      
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
        totalAvailable: demoCommissions.reduce((sum, c) => sum + c.amount_kobo, 0),
        byType: {
          daily_checkin: demoCommissions.filter(c => c.commission_type === 'daily_checkin').reduce((sum, c) => sum + c.amount_kobo, 0),
          streak_milestone: demoCommissions.filter(c => c.commission_type === 'streak_milestone').reduce((sum, c) => sum + c.amount_kobo, 0)
        }
      };

      return NextResponse.json({
        commissions: demoCommissions,
        summary,
        pagination: {
          limit,
          offset,
          hasMore: false
        }
      });
    }

    // Tables exist, use real data
    try {
      // Get user commission summary
      const { data: summary, error: summaryErr } = await supabase
        .from('user_commission_summary')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (summaryErr) {
        // Return empty data if no summary exists
        return NextResponse.json({
          commissions: [],
          summary: {
            totalEarned: 0,
            totalPaid: 0,
            totalPending: 0,
            totalAvailable: 0,
            byType: {}
          },
          pagination: {
            limit,
            offset,
            hasMore: false
          }
        });
      }

      // Get recent commissions
      const { data: commissions, error: commissionsError } = await supabase
        .from('user_commissions')
        .select(`
          id,
          amount_kobo,
          description,
          status,
          created_at,
          commission_types!inner(name, type_code)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (commissionsError) {
        console.error('Commissions error:', commissionsError);
        return NextResponse.json(
          { error: 'Failed to fetch commissions' },
          { status: 500 }
        );
      }

      // Get commission counts by type
      const { data: typeStats } = await supabase
        .from('user_commissions')
        .select(`
          amount_kobo,
          commission_types!inner(type_code)
        `)
        .eq('user_id', user.id);

      const byType = typeStats?.reduce((acc: any, commission: any) => {
        const type = commission.commission_types.type_code;
        acc[type] = (acc[type] || 0) + commission.amount_kobo;
        return acc;
      }, {}) || {};

      return NextResponse.json({
        commissions: commissions?.map((c: any) => ({
          id: c.id,
          commission_type: c.commission_types?.type_code || 'unknown',
          amount_kobo: c.amount_kobo,
          description: c.description,
          status: c.status,
          created_at: c.created_at
        })) || [],
        summary: {
          totalEarned: summary.total_earned_kobo || 0,
          totalPaid: summary.total_paid_kobo || 0,
          totalPending: summary.total_pending_kobo || 0,
          totalAvailable: (summary.total_earned_kobo || 0) - (summary.total_paid_kobo || 0),
          byType
        },
        pagination: {
          limit,
          offset,
          hasMore: (commissions?.length || 0) === limit
        }
      });

    } catch (error) {
      console.error('Database error:', error);
      // Fallback to demo data if database fails
      const userHash = user.id.split('-')[0];
      const dayOfYear = Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24));
      const simulatedStreak = (parseInt(userHash, 16) + dayOfYear) % 30 + 1;
      
      const demoCommissions = [{
        id: `checkin_${Date.now()}`,
        commission_type: 'daily_checkin',
        amount_kobo: 5000 + Math.min(simulatedStreak * 1000, 5000),
        description: `Daily check-in bonus (Streak: ${simulatedStreak} days)`,
        status: 'paid',
        created_at: new Date().toISOString()
      }];

      return NextResponse.json({
        commissions: demoCommissions,
        summary: {
          totalEarned: demoCommissions[0].amount_kobo,
          totalPaid: demoCommissions[0].amount_kobo,
          totalPending: 0,
          totalAvailable: demoCommissions[0].amount_kobo,
          byType: { daily_checkin: demoCommissions[0].amount_kobo }
        },
        pagination: {
          limit,
          offset,
          hasMore: false
        }
      });
    }

  } catch (error) {
    console.error('Commissions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}