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
    
    let body;
    try {
      const text = await request.text();
      console.log('Raw request body:', text);
      body = JSON.parse(text);
      console.log('Parsed request body:', body);
    } catch (error) {
      console.error('JSON parsing error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      );
    }
    
    const { amount, recipient, description, walletType } = body;

    // Enhanced validation
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Please enter a valid amount greater than ₦0' },
        { status: 400 }
      );
    }

    if (amount < 1) {
      return NextResponse.json(
        { error: 'Minimum transfer amount is ₦1' },
        { status: 400 }
      );
    }

    if (amount > 1000000) {
      return NextResponse.json(
        { error: 'Maximum transfer amount is ₦1,000,000' },
        { status: 400 }
      );
    }

    if (!recipient || recipient.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please enter recipient email or phone number' },
        { status: 400 }
      );
    }

    if (!walletType || !['ngn', 'crypto'].includes(walletType)) {
      return NextResponse.json(
        { error: 'Invalid wallet type' },
        { status: 400 }
      );
    }

    // Validate recipient format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
    
    if (!emailRegex.test(recipient) && !phoneRegex.test(recipient.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Please enter a valid email address or Nigerian phone number' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const amountKobo = Math.round(amount * 100); // Convert to kobo

    // Get or create sender's wallet
    let { data: senderWallet, error: senderWalletError } = await admin
      .from("wallets")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    if (senderWalletError && senderWalletError.code === 'PGRST116') {
      // Create wallet for sender if it doesn't exist
      const { data: newWallet, error: createError } = await admin
        .from("wallets")
        .insert({
          profile_id: user.id,
          balance_kobo: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating sender wallet:', createError);
        return NextResponse.json(
          { error: 'Failed to create wallet' },
          { status: 500 }
        );
      }
      senderWallet = newWallet;
    } else if (senderWalletError) {
      console.error('Error fetching sender wallet:', senderWalletError);
      return NextResponse.json(
        { error: 'Failed to fetch wallet data' },
        { status: 500 }
      );
    }

    if (!senderWallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Check if sender has sufficient balance
    if (senderWallet.balance_kobo < amountKobo) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Find recipient by email or phone
    let recipientUser = null;
    
    console.log('🔍 Searching for recipient:', recipient);
    
    // Try to find by email first
    if (recipient.includes('@')) {
      const { data: userByEmail, error: emailError } = await admin
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', recipient)
        .single();
      
      if (emailError && emailError.code !== 'PGRST116') {
        console.error('Error searching by email:', emailError);
      }
      recipientUser = userByEmail;
    } else {
      // Try to find by phone number
      const { data: userByPhone, error: phoneError } = await admin
        .from('profiles')
        .select('id, email, full_name, phone')
        .eq('phone', recipient)
        .single();
      
      if (phoneError && phoneError.code !== 'PGRST116') {
        console.error('Error searching by phone:', phoneError);
      }
      recipientUser = userByPhone;
    }

    if (!recipientUser) {
      console.log('❌ Recipient not found:', recipient);
      return NextResponse.json(
        { error: 'Recipient not found. Please check the email or phone number.', details: `No user found with identifier: ${recipient}` },
        { status: 404 }
      );
    }

    console.log('✅ Recipient found:', recipientUser);

    // Check if recipient is trying to send to themselves
    if (recipientUser.id === user.id) {
      return NextResponse.json(
        { error: 'You cannot send money to yourself' },
        { status: 400 }
      );
    }

    // Get or create recipient's wallet
    let { data: recipientWallet, error: recipientWalletError } = await admin
      .from("wallets")
      .select("*")
      .eq("profile_id", recipientUser.id)
      .single();

    if (recipientWalletError && recipientWalletError.code === 'PGRST116') {
      // Create wallet for recipient if it doesn't exist
      const { data: newWallet, error: createError } = await admin
        .from("wallets")
        .insert({
          profile_id: recipientUser.id,
          balance_kobo: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating recipient wallet:', createError);
        console.error('Recipient user ID:', recipientUser.id);
        console.error('Recipient email:', recipientUser.email);
        return NextResponse.json(
          { error: 'Failed to create recipient wallet', details: createError.message },
          { status: 500 }
        );
      }
      recipientWallet = newWallet;
    } else if (recipientWalletError) {
      console.error('Error fetching recipient wallet:', recipientWalletError);
      return NextResponse.json(
        { error: 'Failed to fetch recipient wallet' },
        { status: 500 }
      );
    }

    const referenceId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Start transaction with better error handling
    console.log('💸 Starting money transfer process...');
    console.log('📊 Transfer Details:', {
      from: user.email,
      to: recipientUser.email,
      amount: `₦${amount}`,
      reference: referenceId
    });
    
    // Create sender transaction (debit) with pending status first
    const { data: senderTransaction, error: senderTransactionError } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: 'send',
        amount_kobo: -amountKobo, // Negative for debit
        reference: referenceId,
        description: description || `Transfer to ${recipientUser.full_name || recipient}`,
        status: 'pending', // Start as pending
        created_at: new Date().toISOString(),
        metadata: {
          recipient_id: recipientUser.id,
          recipient_name: recipientUser.full_name,
          recipient_email: recipientUser.email,
          wallet_type: walletType,
          transaction_type: 'peer_to_peer',
          original_amount: amount
        }
      })
      .select()
      .single();

    if (senderTransactionError) {
      console.error('❌ Error creating sender transaction:', senderTransactionError);
      return NextResponse.json(
        { 
          error: 'Failed to create transaction', 
          details: senderTransactionError.message,
          code: 'TRANSACTION_CREATE_FAILED'
        },
        { status: 500 }
      );
    }

    console.log('✅ Sender transaction created:', senderTransaction.id);

    // Create recipient transaction (credit) with pending status
    console.log('💰 Creating recipient transaction for user:', recipientUser.id);
    const { data: recipientTransaction, error: recipientTransactionError } = await admin
      .from("transactions")
      .insert({
        user_id: recipientUser.id,
        type: 'receive',
        amount_kobo: amountKobo, // Positive for credit
        reference: referenceId, // Same reference for both transactions
        description: description || `Transfer from ${user.email}`,
        status: 'pending', // Start as pending
        created_at: new Date().toISOString(),
        metadata: {
          sender_id: user.id,
          sender_name: user.email,
          wallet_type: walletType,
          transaction_type: 'peer_to_peer',
          original_amount: amount
        }
      })
      .select()
      .single();

    if (recipientTransactionError) {
      console.error('❌ Error creating recipient transaction:', recipientTransactionError);
      
      // Rollback: Delete the sender transaction if recipient transaction fails
      await admin
        .from("transactions")
        .delete()
        .eq("id", senderTransaction.id);
      
      return NextResponse.json(
        { 
          error: 'Failed to create recipient transaction', 
          details: recipientTransactionError.message,
          code: 'RECIPIENT_TRANSACTION_FAILED'
        },
        { status: 500 }
      );
    }

    console.log('✅ Recipient transaction created:', recipientTransaction.id);

    // Update sender's wallet balance (subtract amount)
    const newSenderBalance = senderWallet.balance_kobo - amountKobo;
    const { error: senderUpdateError } = await admin
      .from("wallets")
      .update({
        balance_kobo: newSenderBalance,
        total_withdrawn_kobo: (senderWallet.total_withdrawn_kobo || 0) + amountKobo
      })
      .eq("profile_id", user.id);

    if (senderUpdateError) {
      console.error('❌ Error updating sender wallet:', senderUpdateError);
      
      // Rollback: Delete both transactions
      await admin.from("transactions").delete().eq("id", senderTransaction.id);
      await admin.from("transactions").delete().eq("id", recipientTransaction.id);
      
      return NextResponse.json(
        { 
          error: 'Failed to update sender wallet', 
          details: senderUpdateError.message,
          code: 'SENDER_WALLET_UPDATE_FAILED'
        },
        { status: 500 }
      );
    }

    // Update recipient's wallet balance (add amount)
    const newRecipientBalance = (recipientWallet.balance_kobo || 0) + amountKobo;
    const { error: recipientUpdateError } = await admin
      .from("wallets")
      .update({
        balance_kobo: newRecipientBalance,
        total_contributed_kobo: (recipientWallet.total_contributed_kobo || 0) + amountKobo
      })
      .eq("profile_id", recipientUser.id);

    if (recipientUpdateError) {
      console.error('❌ Error updating recipient wallet:', recipientUpdateError);
      
      // Rollback: Restore sender wallet and delete both transactions
      await admin
        .from("wallets")
        .update({
          balance_kobo: senderWallet.balance_kobo,
          total_withdrawn_kobo: senderWallet.total_withdrawn_kobo || 0
        })
        .eq("profile_id", user.id);
      
      await admin.from("transactions").delete().eq("id", senderTransaction.id);
      await admin.from("transactions").delete().eq("id", recipientTransaction.id);
      
      return NextResponse.json(
        { 
          error: 'Failed to update recipient wallet', 
          details: recipientUpdateError.message,
          code: 'RECIPIENT_WALLET_UPDATE_FAILED'
        },
        { status: 500 }
      );
    }

    // Mark both transactions as completed
    const completedAt = new Date().toISOString();
    
    const { error: senderCompleteError } = await admin
      .from("transactions")
      .update({ 
        status: 'completed',
        completed_at: completedAt
      })
      .eq("id", senderTransaction.id);

    const { error: recipientCompleteError } = await admin
      .from("transactions")
      .update({ 
        status: 'completed',
        completed_at: completedAt
      })
      .eq("id", recipientTransaction.id);

    if (senderCompleteError || recipientCompleteError) {
      console.error("⚠️ Failed to mark transactions as completed:", { senderCompleteError, recipientCompleteError });
    }

    // Create notifications for both users
    const notificationData = {
      sender: {
        user_id: user.id,
        type: "send",
        title: "Money Sent Successfully! 💸",
        message: `You sent ₦${amount.toLocaleString()} to ${recipientUser.full_name || recipient}`,
        data: {
          amount_kobo: amountKobo,
          amount_naira: amount,
          recipient_name: recipientUser.full_name,
          transaction_id: senderTransaction.id,
          reference: referenceId
        }
      },
      recipient: {
        user_id: recipientUser.id,
        type: "receive",
        title: "Money Received! 💰",
        message: `You received ₦${amount.toLocaleString()} from ${user.email}`,
        data: {
          amount_kobo: amountKobo,
          amount_naira: amount,
          sender_name: user.email,
          transaction_id: recipientTransaction.id,
          reference: referenceId
        }
      }
    };

    // Insert notifications (non-blocking)
    const { error: notificationError } = await admin
      .from("notifications")
      .insert([
        {
          ...notificationData.sender,
          read: false,
          created_at: completedAt
        },
        {
          ...notificationData.recipient,
          read: false,
          created_at: completedAt
        }
      ]);

    if (notificationError) {
      console.error("⚠️ Failed to create notifications:", notificationError);
    } else {
      console.log(`🔔 Notifications created for both users`);
    }

    console.log('✅ Transfer completed successfully!', {
      reference: referenceId,
      amount: `₦${amount}`,
      from: user.email,
      to: recipientUser.email
    });

    return NextResponse.json({
      success: true,
      message: `Successfully sent ₦${amount.toLocaleString()} to ${recipientUser.full_name || recipient}`,
      transaction: {
        id: senderTransaction.id,
        reference: referenceId,
        amount: amount,
        status: 'completed'
      },
      recipient: {
        id: recipientUser.id,
        name: recipientUser.full_name,
        email: recipientUser.email
      },
      newBalance: newSenderBalance / 100, // Convert back to naira
      reference: referenceId,
      timestamp: completedAt
    });

  } catch (error) {
    console.error('Send money API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get send/receive history
    const { data: transactions, error: transactionError } = await admin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .in("type", ["send", "receive"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (transactionError) {
      console.error('Error fetching transaction history:', transactionError);
      return NextResponse.json(
        { error: 'Failed to fetch transaction history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transactions: transactions || [],
      totalSent: transactions?.filter(t => t.type === 'send').reduce((sum, t) => sum + Math.abs(t.amount_kobo), 0) || 0,
      totalReceived: transactions?.filter(t => t.type === 'receive').reduce((sum, t) => sum + t.amount_kobo, 0) || 0
    });

  } catch (error) {
    console.error('Transaction history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
