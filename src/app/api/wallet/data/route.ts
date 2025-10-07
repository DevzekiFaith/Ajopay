import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = authData.user.id;

    const admin = getSupabaseAdminClient();

    // Fetch wallet data
    const { data: walletData, error: walletError } = await admin
      .from("wallets")
      .select("*")
      .eq("profile_id", userId)
      .single();

    // Fetch contributions to sync wallet balance
    const { data: contributions, error: contribError } = await admin
      .from("contributions")
      .select("amount_kobo")
      .eq("user_id", userId);

    if (contribError) {
      console.error("Error fetching contributions:", contribError);
      return NextResponse.json({ error: contribError.message }, { status: 500 });
    }

    const totalContributions = contributions?.reduce((sum, c) => sum + (c.amount_kobo || 0), 0) || 0;

    // Calculate total deposited and withdrawn from transactions
    const { data: transactions, error: txError } = await admin
      .from("transactions")
      .select("type, amount_kobo")
      .eq("user_id", userId);

    const totalDeposited = transactions?.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount_kobo, 0) || 0;
    const totalWithdrawn = transactions?.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount_kobo, 0) || 0;
    const totalCommissions = transactions?.filter(t => t.type === 'commission').reduce((sum, t) => sum + t.amount_kobo, 0) || 0;
    
    // Calculate actual wallet balance including commissions
    const actualBalance = totalContributions + totalCommissions - totalWithdrawn;

    if (walletError) {
      console.error('Error fetching wallet:', walletError);
      console.error('User ID:', userId);
      // If wallet doesn't exist, create one
      if (walletError.code === 'PGRST116') {
        console.log('Creating new wallet for user:', userId);
        const { data: newWallet, error: createError } = await admin
          .from("wallets")
          .insert({
            profile_id: userId,
            balance_kobo: actualBalance
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating wallet:', createError);
          return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        return NextResponse.json({
          wallet: {
            ...newWallet,
            total_contributed_kobo: totalDeposited,
            total_withdrawn_kobo: totalWithdrawn,
            total_commission_kobo: totalCommissions,
            last_activity_at: new Date().toISOString()
          },
          totalContributions,
          isNewWallet: true
        });
      } else {
        console.error('Error fetching wallet:', walletError);
        return NextResponse.json({ error: walletError.message }, { status: 500 });
      }
    } else if (walletData) {
      // Sync wallet balance with actual balance (contributions + commissions - withdrawals)
      if (walletData.balance_kobo !== actualBalance) {
        console.log('Syncing wallet balance with actual balance:', {
          walletBalance: walletData.balance_kobo,
          actualBalance: actualBalance,
          contributions: totalContributions,
          commissions: totalCommissions,
          withdrawals: totalWithdrawn
        });
        
        // Update wallet balance to match actual balance
        const { error: updateError } = await admin
          .from("wallets")
          .update({
            balance_kobo: actualBalance
          })
          .eq("profile_id", userId);

        if (updateError) {
          console.error('Error updating wallet:', updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Return updated wallet data
        return NextResponse.json({
          wallet: {
            ...walletData,
            balance_kobo: actualBalance,
            total_contributed_kobo: totalDeposited,
            total_withdrawn_kobo: totalWithdrawn,
            total_commission_kobo: totalCommissions,
            last_activity_at: new Date().toISOString()
          },
          totalContributions,
          isNewWallet: false
        });
      }

      return NextResponse.json({
        wallet: {
          ...walletData,
          total_contributed_kobo: totalDeposited,
          total_withdrawn_kobo: totalWithdrawn,
          total_commission_kobo: totalCommissions,
          last_activity_at: new Date().toISOString()
        },
        totalContributions,
        isNewWallet: false
      });
    }

    return NextResponse.json({ error: "No wallet data found" }, { status: 404 });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
