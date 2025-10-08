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
    const { amount, method, accountDetails, walletType } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }

    if (!method || !['bank_transfer', 'mobile_money', 'wallet'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid withdrawal method' },
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

    // Get current wallet balance
    const { data: walletData, error: walletError } = await admin
      .from("wallets")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    if (walletError) {
      // If wallet doesn't exist, create one
      if (walletError.code === 'PGRST116') {
        console.log('Creating new wallet for user:', user.id);
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

        return NextResponse.json(
          { error: 'Insufficient balance - wallet created with zero balance' },
          { status: 400 }
        );
      } else {
        console.error('Error fetching wallet:', walletError);
        return NextResponse.json(
          { error: 'Failed to fetch wallet data' },
          { status: 500 }
        );
      }
    }

    if (!walletData) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Check if user has sufficient balance
    if (walletData.balance_kobo < amountKobo) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create withdrawal transaction
    const processingTime = method === 'wallet' ? 'Instant' : '1-3 business days';
    const referenceId = Date.now().toString().slice(-8);
    
    // Create transaction record
    const { data: transaction, error: transactionError } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: 'withdrawal',
        amount_kobo: amountKobo,
        reference: `WTH-${referenceId}`,
        description: `Withdrawal via ${method}`,
        status: method === 'wallet' ? 'completed' : 'pending',
        completed_at: method === 'wallet' ? new Date().toISOString() : null,
        metadata: {
          method: method,
          wallet_type: walletType,
          account_details: accountDetails,
          processing_time: processingTime
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      console.error('Transaction data:', {
        user_id: user.id,
        type: 'withdrawal',
        amount_kobo: amountKobo,
        reference: `WTH-${referenceId}`,
        description: `Withdrawal via ${method}`,
        status: method === 'wallet' ? 'completed' : 'pending'
      });
      return NextResponse.json(
        { error: `Failed to create withdrawal transaction: ${transactionError.message}` },
        { status: 500 }
      );
    }

    // Update wallet balance (subtract withdrawal amount)
    const newBalance = walletData.balance_kobo - amountKobo;
    
    console.log('Withdrawal balance update:', {
      userId: user.id,
      currentBalance: walletData.balance_kobo,
      withdrawalAmount: amountKobo,
      newBalance: newBalance
    });
    
    const { error: updateError } = await admin
      .from("wallets")
      .update({
        balance_kobo: newBalance
      })
      .eq("profile_id", user.id);

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      console.error('Update data:', {
        profile_id: user.id,
        newBalance: newBalance
      });
      console.error('Wallet data:', walletData);
      return NextResponse.json(
        { error: `Failed to update wallet balance: ${updateError.message}` },
        { status: 500 }
      );
    }
    
    console.log('Wallet balance updated successfully:', {
      userId: user.id,
      newBalance: newBalance
    });

    // Create withdrawal notification
    const { error: notificationError } = await admin
      .from("notifications")
      .insert({
        user_id: user.id,
        type: "withdrawal",
        title: "Withdrawal Processed! 📤",
        message: `Your withdrawal of ₦${amount.toLocaleString()} has been ${method === 'wallet' ? 'completed' : 'initiated'}. ${processingTime} processing time.`,
        data: {
          amount_kobo: amountKobo,
          amount_naira: amount,
          transaction_id: transaction.id,
          method: method,
          status: method === 'wallet' ? 'completed' : 'pending',
          processing_time: processingTime,
          reference: `WTH-${referenceId}`,
          timestamp: new Date().toISOString()
        },
        read: false,
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error("⚠️ Failed to create withdrawal notification:", notificationError);
    } else {
      console.log(`🔔 Withdrawal notification created for user ${user.id}`);
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal of ₦${amount} initiated successfully! ${processingTime} processing time.`,
      transaction: transaction,
      newBalance: newBalance / 100, // Convert back to naira
      processingTime: processingTime
    });

  } catch (error) {
    console.error('Wallet withdrawal API error:', error);
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

    // Get withdrawal history
    const { data: withdrawals, error: withdrawalError } = await admin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "withdrawal")
      .order("created_at", { ascending: false })
      .limit(20);

    if (withdrawalError) {
      console.error('Error fetching withdrawals:', withdrawalError);
      return NextResponse.json(
        { error: 'Failed to fetch withdrawal history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      withdrawals: withdrawals || [],
      totalWithdrawn: withdrawals?.reduce((sum, w) => sum + w.amount_kobo, 0) || 0
    });

  } catch (error) {
    console.error('Withdrawal history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
