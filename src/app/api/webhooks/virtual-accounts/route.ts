import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Expected headers (example):
// - x-signature: HMAC-SHA256 hex of raw body using VIRTUAL_ACCOUNTS_WEBHOOK_SECRET
// Body: { user_id: string, amount_naira: number, reference?: string, occurred_at?: string }
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.VIRTUAL_ACCOUNTS_WEBHOOK_SECRET;
    const raw = await req.text();

    if (secret) {
      const provided = req.headers.get("x-signature") || "";
      const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
      if (!provided || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(raw || "{}");
    const { user_id, amount_naira, reference, occurred_at } = payload || {};
    if (!user_id || typeof amount_naira !== "number") {
      return NextResponse.json({ error: "user_id and amount_naira required" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Server missing Supabase env vars" }, { status: 500 });
    }
    const admin = createClient(url, serviceKey);

    const contributed_at = (occurred_at && typeof occurred_at === "string" ? new Date(occurred_at) : new Date())
      .toISOString()
      .slice(0, 10);

    const { error } = await admin.from("contributions").insert({
      user_id,
      agent_id: null,
      amount_kobo: Math.round(amount_naira * 100),
      method: "va",
      status: "confirmed",
      contributed_at,
      reference: reference || null,
    } as any);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "bad request" }, { status: 400 });
  }
}
