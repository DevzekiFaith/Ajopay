import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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
    const { amount, method, walletType, description } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid deposit amount' },
        { status: 400 }
      );
    }

    if (!method || !['bank_transfer', 'card', 'mobile_money'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid deposit method' },
        { status: 400 }
      );
    }

    if (!walletType || !['ngn', 'crypto'].includes(walletType)) {
      return NextResponse.json(
        { error: 'Invalid wallet type' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const amountKobo = Math.round(amount * 100); // Convert to kobo

    // Get or create user's wallet
    let { data: walletData, error: walletError } = await admin
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
          balance_kobo: 0
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
      walletData = newWallet;
    } else if (walletError) {
      console.error('Error fetching wallet:', walletError);
      return NextResponse.json(
        { error: 'Failed to fetch wallet data' },
        { status: 500 }
      );
    }

    const referenceId = Date.now().toString().slice(-8);
    const processingTime = method === 'card' ? 'Instant' : '1-3 business days';
    
    // Create deposit transaction
    const { data: transaction, error: transactionError } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount_kobo: amountKobo,
        reference: `DEP-${referenceId}`,
        description: description || `Deposit via ${method}`,
        status: method === 'card' ? 'completed' : 'pending',
        completed_at: method === 'card' ? new Date().toISOString() : null,
        metadata: {
          method: method,
          wallet_type: walletType,
          processing_time: processingTime,
          payment_reference: `PAY-${referenceId}`
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating deposit transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create deposit transaction' },
        { status: 500 }
      );
    }

    // Update wallet balance (add deposit amount)
    const newBalance = (walletData.balance_kobo || 0) + amountKobo;
    const { error: updateError } = await admin
      .from("wallets")
      .update({
        balance_kobo: newBalance,
        total_contributed_kobo: (walletData.total_contributed_kobo || 0) + amountKobo
      })
      .eq("profile_id", user.id);

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return NextResponse.json(
        { error: 'Failed to update wallet balance' },
        { status: 500 }
      );
    }

    // Create deposit notification
    const { error: notificationError } = await admin
      .from("notifications")
      .insert({
        user_id: user.id,
        type: "deposit",
        title: "Deposit Successful! 💰",
        message: `Your deposit of ₦${amount.toLocaleString()} has been ${method === 'card' ? 'completed' : 'initiated'}. ${processingTime} processing time.`,
        data: {
          amount_kobo: amountKobo,
          amount_naira: amount,
          transaction_id: transaction.id,
          method: method,
          status: method === 'card' ? 'completed' : 'pending',
          processing_time: processingTime,
          reference: `DEP-${referenceId}`,
          new_balance: newBalance
        },
        read: false,
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error("⚠️ Failed to create deposit notification:", notificationError);
    } else {
      console.log(`🔔 Deposit notification created for user ${user.id}`);
    }

    return NextResponse.json({
      success: true,
      message: `Deposit of ₦${amount} ${method === 'card' ? 'completed' : 'initiated'} successfully! ${processingTime} processing time.`,
      transaction: transaction,
      newBalance: newBalance / 100, // Convert back to naira
      processingTime: processingTime,
      reference: `DEP-${referenceId}`
    });

  } catch (error) {
    console.error('Deposit API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const admin = getSupabaseAdminClient();

    // Get deposit history
    const { data: deposits, error: depositError } = await admin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "deposit")
      .order("created_at", { ascending: false })
      .limit(20);

    if (depositError) {
      console.error('Error fetching deposit history:', depositError);
      return NextResponse.json(
        { error: 'Failed to fetch deposit history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deposits: deposits || [],
      totalDeposited: deposits?.reduce((sum, d) => sum + d.amount_kobo, 0) || 0
    });

  } catch (error) {
    console.error('Deposit history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
