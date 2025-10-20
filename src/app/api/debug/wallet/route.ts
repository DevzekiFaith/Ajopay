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

    // Get all wallet data for this user
    const { data: walletData, error: walletError } = await admin
      .from("wallets")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    // Get all transactions for this user
    const { data: transactions, error: transactionError } = await admin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get user profile
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile || null,
      wallet: walletData || null,
      transactions: transactions || [],
      walletError: walletError?.message || null,
      transactionError: transactionError?.message || null,
      profileError: profileError?.message || null,
      debug: {
        hasWallet: !!walletData,
        hasTransactions: (transactions?.length || 0) > 0,
        hasProfile: !!profile,
        walletBalance: walletData?.balance_kobo || 0,
        walletBalanceNaira: (walletData?.balance_kobo || 0) / 100
      }
    });

  } catch (error) {
    console.error('Debug wallet API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
