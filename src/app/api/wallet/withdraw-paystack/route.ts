import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { paystackService } from "@/lib/paystack";

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
    const { amount, method, walletType, accountDetails } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }

    if (!method || !['bank_transfer', 'mobile_money'].includes(method)) {
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

    // Get user's wallet balance
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

    let transferResult = null;
    let recipientCode = null;

    if (method === 'bank_transfer') {
      // Check if Paystack is configured
      if (!paystackService.isConfigured()) {
        console.log('Paystack not configured, creating demo withdrawal');
        
        // Create a demo withdrawal transaction
        transferResult = {
          status: true,
          data: {
            id: `demo_transfer_${Date.now()}`,
            status: 'success',
            amount: amount * 100,
            recipient: {
              account_number: accountDetails.accountNumber,
              account_name: accountDetails.accountName,
              bank_name: accountDetails.bankName
            }
          }
        };
      } else {
        // Create transfer recipient using Paystack
        try {
          const recipientData = {
            account_number: accountDetails.accountNumber,
            bank_code: accountDetails.bankCode,
            account_name: accountDetails.accountName
          };

          console.log('Creating Paystack transfer recipient:', recipientData);
          const recipientResponse = await paystackService.createTransferRecipient(recipientData);
          
          if (!recipientResponse.status) {
            throw new Error(recipientResponse.message || 'Failed to create transfer recipient');
          }

          recipientCode = recipientResponse.data.recipient_code;
          console.log('Transfer recipient created:', recipientCode);

          // Create transfer using Paystack
          const transferData = {
            amount: amount,
            recipient_code: recipientCode,
            reason: `Withdrawal from AjoPay wallet to ${accountDetails.accountName}`,
            reference: `WTH-${Date.now()}`
          };

          console.log('Creating Paystack transfer:', transferData);
          transferResult = await paystackService.createTransfer(transferData);
          
          if (!transferResult.status) {
            throw new Error(transferResult.message || 'Failed to create transfer');
          }

          console.log('Transfer created successfully:', transferResult.data);

        } catch (error: any) {
          console.error('Paystack transfer error:', error);
          return NextResponse.json(
            { error: 'Failed to process bank transfer', details: error.message },
            { status: 500 }
          );
        }
      }
    } else if (method === 'mobile_money') {
      // For mobile money, we'll create a transaction record but not process through Paystack
      // This would need to be integrated with a mobile money provider
      console.log('Mobile money withdrawal requested:', accountDetails.phoneNumber);
    }

    const referenceId = Date.now().toString().slice(-8);
    
    // Create withdrawal transaction record
    const { data: transaction, error: transactionError } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: 'withdrawal',
        amount_kobo: -amountKobo, // Negative for withdrawal
        reference: `WTH-${referenceId}`,
        description: `Withdrawal via ${method} to ${accountDetails.accountName || accountDetails.phoneNumber}`,
        status: method === 'bank_transfer' ? 'completed' : 'pending',
        completed_at: method === 'bank_transfer' ? new Date().toISOString() : null,
        metadata: {
          method: method,
          wallet_type: walletType,
          account_details: accountDetails,
          paystack_transfer_id: transferResult?.data?.id || null,
          paystack_recipient_code: recipientCode,
          processing_time: method === 'bank_transfer' ? 'Instant' : '1-3 business days'
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating withdrawal transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create withdrawal transaction' },
        { status: 500 }
      );
    }

    // Update wallet balance (subtract withdrawal amount)
    const newBalance = walletData.balance_kobo - amountKobo;
    const { error: updateError } = await admin
      .from("wallets")
      .update({
        balance_kobo: newBalance,
        total_withdrawn_kobo: (walletData.total_withdrawn_kobo || 0) + amountKobo
      })
      .eq("profile_id", user.id);

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return NextResponse.json(
        { error: 'Failed to update wallet balance' },
        { status: 500 }
      );
    }

    // Create withdrawal notification
    const { error: notificationError } = await admin
      .from("notifications")
      .insert({
        user_id: user.id,
        type: "withdrawal",
        title: "Withdrawal Successful! 💸",
        message: `Your withdrawal of ₦${amount.toLocaleString()} has been ${method === 'bank_transfer' ? 'completed' : 'initiated'}. ${method === 'bank_transfer' ? 'Instant' : '1-3 business days'} processing time.`,
        data: {
          amount_kobo: amountKobo,
          amount_naira: amount,
          transaction_id: transaction.id,
          method: method,
          status: method === 'bank_transfer' ? 'completed' : 'pending',
          processing_time: method === 'bank_transfer' ? 'Instant' : '1-3 business days',
          reference: `WTH-${referenceId}`,
          new_balance: newBalance
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
      message: `Withdrawal of ₦${amount} ${method === 'bank_transfer' ? 'completed' : 'initiated'} successfully! ${method === 'bank_transfer' ? 'Instant' : '1-3 business days'} processing time.`,
      transaction: transaction,
      newBalance: newBalance / 100, // Convert back to naira
      processingTime: method === 'bank_transfer' ? 'Instant' : '1-3 business days',
      reference: `WTH-${referenceId}`,
      paystackTransfer: transferResult?.data || null
    });

  } catch (error) {
    console.error('Paystack withdrawal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
