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
      const provider_txn_id = data.reference || data.id || null;
      const user_id = data.metadata?.user_id as string | undefined;
      if (!user_id || amount_kobo <= 0) return NextResponse.json({ ok: true });

      // Insert topup
      await supabase.from("wallet_topups").insert({
        user_id,
        amount_kobo,
        status: "confirmed",
        provider: "paystack",
        provider_txn_id: String(provider_txn_id || "")
      });

      // Optional: if profile has auto_mark, mark today's contribution once
      const { data: me } = await supabase
        .from("profiles")
        .select("settings")
        .eq("id", user_id)
        .maybeSingle();
      const auto = (me as any)?.settings?.customer_auto_mark === true;
      if (auto) {
        const today = new Date().toISOString().slice(0, 10);
        // Try insert; ignore if unique constraint blocks duplicate
        await supabase.from("contributions").insert({
          user_id,
          amount_kobo,
          method: "wallet",
          status: "confirmed",
          contributed_at: today,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "webhook error" }, { status: 500 });
  }
}
