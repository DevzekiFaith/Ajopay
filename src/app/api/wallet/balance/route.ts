import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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
    const admin = getSupabaseAdminClient();

    // Get wallet data
    const { data: walletData, error: walletError } = await admin
      .from("wallets")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      // Create wallet if it doesn't exist
      const { data: newWallet, error: createError } = await admin
        .from("wallets")
        .insert({
          profile_id: user.id,
          balance_kobo: 0,
          total_contributed_kobo: 0,
          total_withdrawn_kobo: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating wallet:', createError);
        return NextResponse.json(
          { error: 'Failed to create wallet' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        wallet: newWallet,
        balance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        message: 'Wallet created successfully'
      });
    } else if (walletError) {
      console.error('Error fetching wallet:', walletError);
      return NextResponse.json(
        { error: 'Failed to fetch wallet data' },
        { status: 500 }
      );
    }

    // Get recent transaction summary
    const { data: recentTransactions } = await admin
      .from("transactions")
      .select("type, amount_kobo, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Calculate daily/weekly/monthly stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayTransactions = recentTransactions?.filter(t => 
      new Date(t.created_at) >= today
    ) || [];
    
    const weekTransactions = recentTransactions?.filter(t => 
      new Date(t.created_at) >= weekAgo
    ) || [];
    
    const monthTransactions = recentTransactions?.filter(t => 
      new Date(t.created_at) >= monthAgo
    ) || [];

    const stats = {
      today: {
        deposits: todayTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount_kobo, 0),
        withdrawals: todayTransactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount_kobo), 0),
        sent: todayTransactions.filter(t => t.type === 'send').reduce((sum, t) => sum + Math.abs(t.amount_kobo), 0),
        received: todayTransactions.filter(t => t.type === 'receive').reduce((sum, t) => sum + t.amount_kobo, 0)
      },
      week: {
        deposits: weekTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount_kobo, 0),
        withdrawals: weekTransactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount_kobo), 0),
        sent: weekTransactions.filter(t => t.type === 'send').reduce((sum, t) => sum + Math.abs(t.amount_kobo), 0),
        received: weekTransactions.filter(t => t.type === 'receive').reduce((sum, t) => sum + t.amount_kobo, 0)
      },
      month: {
        deposits: monthTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount_kobo, 0),
        withdrawals: monthTransactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount_kobo), 0),
        sent: monthTransactions.filter(t => t.type === 'send').reduce((sum, t) => sum + Math.abs(t.amount_kobo), 0),
        received: monthTransactions.filter(t => t.type === 'receive').reduce((sum, t) => sum + t.amount_kobo, 0)
      }
    };

    return NextResponse.json({
      success: true,
      wallet: walletData,
      balance: walletData.balance_kobo / 100,
      totalDeposited: (walletData.total_contributed_kobo || 0) / 100,
      totalWithdrawn: (walletData.total_withdrawn_kobo || 0) / 100,
      stats,
      lastActivity: walletData.last_activity_at,
      recentTransactions: recentTransactions?.slice(0, 5) || []
    });

  } catch (error) {
    console.error('Wallet balance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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
    const { balance_kobo, total_contributed_kobo, total_withdrawn_kobo } = await request.json();

    const admin = getSupabaseAdminClient();

    const { data: updatedWallet, error: updateError } = await admin
      .from("wallets")
      .update({
        balance_kobo: balance_kobo || 0,
        total_contributed_kobo: total_contributed_kobo || 0,
        total_withdrawn_kobo: total_withdrawn_kobo || 0,
        last_activity_at: new Date().toISOString()
      })
      .eq("profile_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating wallet:', updateError);
      return NextResponse.json(
        { error: 'Failed to update wallet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wallet: updatedWallet,
      message: 'Wallet updated successfully'
    });

  } catch (error) {
    console.error('Update wallet API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
