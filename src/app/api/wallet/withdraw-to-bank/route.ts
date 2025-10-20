import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { paystackService } from "@/lib/paystack";

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = authData.user;

    const { bankCode, accountNumber, amount, narration } = await request.json();
    if (!bankCode || !accountNumber || !amount || amount <= 0) {
      return NextResponse.json({ error: "bankCode, accountNumber and positive amount are required" }, { status: 400 });
    }

    if (!paystackService.isConfigured()) {
      return NextResponse.json({ error: "Paystack is not configured" }, { status: 500 });
    }

    const admin = getSupabaseAdminClient();

    // Fetch wallet and ensure sufficient balance
    const { data: wallet, error: walletErr } = await admin
      .from("wallets")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    if (walletErr) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const amountKobo = Math.round(amount * 100);
    if ((wallet.balance_kobo || 0) < amountKobo) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Fail-fast: ensure Paystack balance covers this withdrawal
    const providerBalanceKobo = await paystackService.getBalanceKobo();
    if (providerBalanceKobo < amountKobo) {
      return NextResponse.json({ error: `Payout provider balance too low. Available ₦${(providerBalanceKobo/100).toFixed(2)}.` }, { status: 400 });
    }

    // Resolve account to get name (optional but good UX)
    const resolved = await paystackService.verifyBankAccount(accountNumber, bankCode);
    if (!resolved?.status) {
      return NextResponse.json({ error: resolved?.message || "Failed to resolve account" }, { status: 400 });
    }

    // Create or reuse transfer recipient
    const recipientResp = await paystackService.createTransferRecipient({
      account_number: accountNumber,
      bank_code: bankCode,
      account_name: resolved?.data?.account_name,
    });

    if (!recipientResp?.status) {
      return NextResponse.json({ error: recipientResp?.message || "Failed to create recipient" }, { status: 400 });
    }

    const recipientCode = recipientResp.data?.recipient_code;
    const reference = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Create a pending transaction row first
    const { data: tx, error: txErr } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: 'withdrawal',
        amount_kobo: -amountKobo,
        reference,
        description: narration || `Withdrawal to bank` ,
        status: 'pending',
        metadata: {
          bank_code: bankCode,
          account_number: accountNumber,
          recipient_code: recipientCode,
          transfer_reference: reference,
          account_name: resolved?.data?.account_name
        }
      })
      .select()
      .single();

    if (txErr) {
      return NextResponse.json({ error: "Failed to create transaction", details: txErr.message }, { status: 500 });
    }

    // Initiate Paystack transfer
    const init = await paystackService.createTransfer({
      amount,
      recipient_code: recipientCode,
      reason: narration,
      reference
    });

    if (!init?.status) {
      return NextResponse.json({ error: init?.message || "Failed to initiate transfer" }, { status: 400 });
    }

    // Optimistically hold funds: reduce wallet balance immediately; finalize on webhook
    const { error: updErr } = await admin
      .from("wallets")
      .update({
        balance_kobo: (wallet.balance_kobo || 0) - amountKobo,
        total_withdrawn_kobo: (wallet.total_withdrawn_kobo || 0) + amountKobo,
        last_activity_at: new Date().toISOString()
      })
      .eq("profile_id", user.id);

    if (updErr) {
      // Rollback transaction row if wallet update fails
      await admin.from("transactions").delete().eq("id", tx.id);
      return NextResponse.json({ error: "Failed to update wallet", details: updErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reference,
      message: "Withdrawal initiated. Awaiting bank confirmation.",
      transaction: tx
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}


