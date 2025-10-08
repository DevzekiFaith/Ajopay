import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
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

    // Get pending transactions for this user
    const { data: pendingTransactions, error: fetchError } = await admin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error('Error fetching pending transactions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch pending transactions' },
        { status: 500 }
      );
    }

    if (!pendingTransactions || pendingTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending transactions found',
        processed: 0
      });
    }

    let processedCount = 0;
    const processedTransactions = [];

    // Process each pending transaction
    for (const transaction of pendingTransactions) {
      try {
        // For demo purposes, we'll process all pending transactions as completed
        // In production, this would integrate with actual payment processors
        
        const { data: updatedTransaction, error: updateError } = await admin
          .from("transactions")
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            metadata: {
              ...transaction.metadata,
              processed_at: new Date().toISOString(),
              processing_method: 'demo_auto_process'
            }
          })
          .eq("id", transaction.id)
          .select()
          .single();

        if (updateError) {
          console.error(`Error updating transaction ${transaction.id}:`, updateError);
          continue;
        }

        // If it's a withdrawal, update wallet balance
        if (transaction.type === 'withdrawal') {
          const { data: walletData, error: walletError } = await admin
            .from("wallets")
            .select("*")
            .eq("profile_id", user.id)
            .single();

          if (walletError) {
            console.error('Error fetching wallet for withdrawal:', walletError);
            continue;
          }

          // Update wallet balance (subtract withdrawal amount)
          const newBalance = walletData.balance_kobo - transaction.amount_kobo;
          const { error: balanceUpdateError } = await admin
            .from("wallets")
            .update({
              balance_kobo: newBalance
            })
            .eq("profile_id", user.id);

          if (balanceUpdateError) {
            console.error('Error updating wallet balance:', balanceUpdateError);
            continue;
          }
        }

        processedTransactions.push(updatedTransaction);
        processedCount++;

      } catch (error) {
        console.error(`Error processing transaction ${transaction.id}:`, error);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} pending transactions`,
      processed: processedCount,
      transactions: processedTransactions
    });

  } catch (error) {
    console.error('Process pending transactions API error:', error);
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

    // Get pending transactions for this user
    const { data: pendingTransactions, error: fetchError } = await admin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error('Error fetching pending transactions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch pending transactions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pendingTransactions: pendingTransactions || [],
      count: pendingTransactions?.length || 0
    });

  } catch (error) {
    console.error('Get pending transactions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


