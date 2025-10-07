import { NextRequest, NextResponse } from "next/server";

// GET /api/payments/initialize?plan=pro&amount=500
// POST /api/payments/initialize
// body: { amount_kobo: number, user_id: string, email?: string }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const plan = searchParams.get('plan');
    const amount = searchParams.get('amount');
    
    if (!plan || !amount) {
      return NextResponse.json({ error: "Missing plan or amount parameter" }, { status: 400 });
    }
    
    // Convert amount to kobo (multiply by 100)
    const amountKobo = parseInt(amount) * 100;
    
    // For GET requests, redirect to payment page with plan info
    const redirectUrl = `/payment?plan=${plan}&amount=${amount}&amount_kobo=${amountKobo}`;
    
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  } catch (e: any) {
    console.error("Payment GET error:", e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Payment initialization request received");
    
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const { amount_kobo, user_id, email } = body;
    
    // Validation
    if (!amount_kobo || amount_kobo <= 0) {
      console.error("Invalid amount_kobo:", amount_kobo);
      return NextResponse.json({ error: "amount_kobo must be > 0" }, { status: 400 });
    }
    if (!user_id) {
      console.error("Missing user_id");
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Environment variables check
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
    
    console.log("Environment check:");
    console.log("- PAYSTACK_SECRET_KEY exists:", !!secret);
    console.log("- Public URL:", publicUrl);
    
    if (!secret) {
      console.error("PAYSTACK_SECRET_KEY is missing from environment variables");
      return NextResponse.json({ error: "PAYSTACK_SECRET_KEY missing" }, { status: 500 });
    }

    // Prepare Paystack request
    const paystackPayload = {
      email: email || `${user_id}@noemail.local`,
      amount: amount_kobo, // paystack expects kobo
      currency: "NGN",
      metadata: { user_id },
      callback_url: publicUrl ? `${publicUrl}/sign-in?payment=success&redirectTo=/customer` : undefined,
    };
    
    console.log("Paystack payload:", JSON.stringify(paystackPayload, null, 2));

    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });
    
    console.log("Paystack response status:", initRes.status);
    console.log("Paystack response headers:", Object.fromEntries(initRes.headers.entries()));
    
    const data = await initRes.json();
    console.log("Paystack response data:", JSON.stringify(data, null, 2));
    
    if (!initRes.ok) {
      console.error("Paystack API error:", data);
      return NextResponse.json({ 
        error: data?.message || "Failed to init payment",
        details: data 
      }, { status: 400 });
    }
    
    const response = { 
      authorization_url: data.data.authorization_url, 
      reference: data.data.reference 
    };
    console.log("Successful response:", response);
    
    return NextResponse.json(response);
  } catch (e: any) {
    console.error("Payment initialization error:", e);
    console.error("Error stack:", e.stack);
    return NextResponse.json({ 
      error: e?.message || "init error",
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 });
  }
}
