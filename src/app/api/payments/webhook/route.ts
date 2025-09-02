import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// POST /api/payments/webhook (Paystack)
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY as string;
    if (!secret) return NextResponse.json({ error: "PAYSTACK_SECRET_KEY missing" }, { status: 500 });

    const raw = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const hash = crypto.createHmac("sha512", secret).update(raw).digest("hex");
    if (hash !== signature) {
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }

    const evt = JSON.parse(raw);
    const event = evt?.event as string;
    const data = evt?.data || {};

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    if (!serviceKey || !url) return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    if (event === "charge.success") {
      const amount_kobo = Number(data.amount) || 0; // already in kobo
      const amount_naira = Math.round(amount_kobo / 100);
      const provider_txn_id = data.reference || data.id || null;
      const user_id = data.metadata?.user_id as string | undefined;
      const customer_email = data.customer?.email || data.email || null;
      
      if (!user_id || amount_kobo <= 0) return NextResponse.json({ ok: true });

      console.log(`💰 Processing successful payment: ₦${amount_naira} for user ${user_id}`);

      // Get user profile for notifications
      const { data: profile } = await supabase
        .from("profiles")
        .select("settings, email, full_name")
        .eq("id", user_id)
        .maybeSingle();

      // Insert wallet topup with enhanced metadata
      const { data: topupResult, error: topupError } = await supabase
        .from("wallet_topups")
        .insert({
          user_id,
          amount_kobo,
          status: "confirmed",
          provider: "paystack",
          provider_txn_id: String(provider_txn_id || ""),
          metadata: {
            customer_email,
            transaction_date: new Date().toISOString(),
            currency: data.currency || "NGN",
            channel: data.channel || "unknown",
            fees: data.fees || 0,
            gateway_response: data.gateway_response || null
          }
        })
        .select()
        .single();

      if (topupError) {
        console.error("❌ Failed to insert wallet topup:", topupError);
        return NextResponse.json({ error: "Failed to record topup" }, { status: 500 });
      }

      console.log(`✅ Wallet topup recorded: ${topupResult.id}`);

      // Create real-time notification entry
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id,
          type: "wallet_funded",
          title: "Wallet Funded Successfully! 💰",
          message: `Your wallet has been credited with ₦${amount_naira.toLocaleString()}. Transaction ID: ${provider_txn_id}`,
          data: {
            amount_kobo,
            amount_naira,
            provider_txn_id,
            topup_id: topupResult.id,
            timestamp: new Date().toISOString()
          },
          read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error("⚠️ Failed to create notification:", notificationError);
      } else {
        console.log(`🔔 Notification created for user ${user_id}`);
      }

      // Trigger real-time wallet update via contributions table (existing realtime channel)
      const { error: contributionError } = await supabase
        .from("contributions")
        .insert({
          user_id,
          amount_kobo,
          method: "wallet_topup",
          status: "confirmed",
          contributed_at: new Date().toISOString().slice(0, 10),
          metadata: {
            source: "paystack_webhook",
            provider_txn_id,
            topup_id: topupResult.id,
            auto_generated: true
          }
        });

      if (contributionError) {
        console.error("⚠️ Failed to create contribution record:", contributionError);
      } else {
        console.log(`📊 Contribution record created for wallet topup`);
      }

      // Optional: Auto-mark today's contribution if enabled
      const auto = (profile as any)?.settings?.customer_auto_mark === true;
      if (auto) {
        const today = new Date().toISOString().slice(0, 10);
        const { error: autoMarkError } = await supabase
          .from("contributions")
          .insert({
            user_id,
            amount_kobo: Math.min(amount_kobo, 50000), // Cap auto-mark at ₦500
            method: "wallet",
            status: "confirmed",
            contributed_at: today,
            metadata: {
              source: "auto_mark_topup",
              original_topup_amount: amount_kobo,
              provider_txn_id
            }
          });

        if (!autoMarkError) {
          console.log(`🎯 Auto-marked today's contribution for user ${user_id}`);
        }
      }

      // Send real-time broadcast to user's channel
      try {
        await supabase
          .channel(`user:${user_id}`)
          .send({
            type: "broadcast",
            event: "wallet_funded",
            payload: {
              amount_kobo,
              amount_naira,
              provider_txn_id,
              timestamp: new Date().toISOString(),
              message: `Wallet funded with ₦${amount_naira.toLocaleString()}!`
            }
          });
        
        console.log(`📡 Real-time broadcast sent to user ${user_id}`);
      } catch (broadcastError) {
        console.error("⚠️ Failed to send real-time broadcast:", broadcastError);
      }

      // Log successful webhook processing
      console.log(`🎉 Webhook processed successfully for user ${user_id}: ₦${amount_naira}`);

      return NextResponse.json({ 
        ok: true, 
        message: "Payment processed successfully",
        amount_naira,
        user_id,
        topup_id: topupResult.id
      });
    }

    // Handle other webhook events
    console.log(`📥 Received webhook event: ${event}`);
    return NextResponse.json({ ok: true });

  } catch (e: any) {
    console.error("❌ Webhook processing error:", e);
    return NextResponse.json({ error: e?.message || "webhook error" }, { status: 500 });
  }
}
