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

    // Load transactions
    const { data: txns, error: txError } = await admin
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (txError) {
      console.error("Error loading transactions:", txError);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    return NextResponse.json({
      transactions: txns || [],
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
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
    const { type, amount, method, walletType, description, status } = await request.json();

    if (!type || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid transaction data' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const amountKobo = Math.round(amount * 100); // Convert to kobo

    // Create transaction record
    const referenceId = Date.now().toString().slice(-8);
    const { data: transaction, error: transactionError } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: type,
        amount_kobo: amountKobo,
        reference: `${type.toUpperCase()}-${referenceId}`,
        description: description || `${type} via ${method}`,
        status: status || 'completed',
        completed_at: (status || 'completed') === 'completed' ? new Date().toISOString() : null,
        metadata: {
          method: method,
          wallet_type: walletType,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      console.error('Transaction data:', {
        user_id: user.id,
        type: type,
        amount_kobo: amountKobo,
        reference: `${type.toUpperCase()}-${referenceId}`,
        description: description || `${type} via ${method}`,
        status: status || 'completed'
      });
      return NextResponse.json(
        { error: `Failed to create transaction: ${transactionError.message}` },
        { status: 500 }
      );
    }

    // If it's a deposit, update wallet balance
    if (type === 'deposit') {
      // Get current wallet balance
      const { data: walletData, error: walletError } = await admin
        .from("wallets")
        .select("*")
        .eq("profile_id", user.id)
        .single();

      if (walletError) {
        console.error('Error fetching wallet:', walletError);
        return NextResponse.json(
          { error: 'Failed to fetch wallet data' },
          { status: 500 }
        );
      }

      // Update wallet balance (add deposit amount)
      const newBalance = (walletData?.balance_kobo || 0) + amountKobo;
      const { error: updateError } = await admin
        .from("wallets")
        .update({
          balance_kobo: newBalance
        })
        .eq("profile_id", user.id);

      if (updateError) {
        console.error('Error updating wallet balance:', updateError);
        return NextResponse.json(
          { error: 'Failed to update wallet balance' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Deposit of ₦${amount} completed successfully!`,
        transaction: transaction,
        newBalance: newBalance / 100 // Convert back to naira
      });
    }

    return NextResponse.json({
      success: true,
      message: `Transaction completed successfully!`,
      transaction: transaction
    });

  } catch (error) {
    console.error('Transaction API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


