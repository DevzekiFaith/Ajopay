import { NextRequest, NextResponse } from "next/server";

// POST /api/payments/initialize
// body: { amount_kobo: number, user_id: string, email?: string }
export async function POST(req: NextRequest) {
  try {
    const { amount_kobo, user_id, email } = await req.json();
    if (!amount_kobo || amount_kobo <= 0) {
      return NextResponse.json({ error: "amount_kobo must be > 0" }, { status: 400 });
    }
    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
    if (!secret) return NextResponse.json({ error: "PAYSTACK_SECRET_KEY missing" }, { status: 500 });

    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email || `${user_id}@noemail.local`,
        amount: amount_kobo, // paystack expects kobo
        currency: "NGN",
        metadata: { user_id },
        callback_url: publicUrl ? `${publicUrl}/customer` : undefined,
      }),
    });
    const data = await initRes.json();
    if (!initRes.ok) {
      return NextResponse.json({ error: data?.message || "Failed to init payment" }, { status: 400 });
    }
    return NextResponse.json({ authorization_url: data.data.authorization_url, reference: data.data.reference });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "init error" }, { status: 500 });
  }
}
