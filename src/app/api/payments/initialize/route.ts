import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
    
    // If user_id is 'current_user', get the actual authenticated user
    let actualUserId = user_id;
    let actualEmail = email;
    
    if (user_id === 'current_user') {
      // Get authenticated user from Supabase
      const supabase = getSupabaseServerClient();
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      
      if (authErr || !authData?.user) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        );
      }
      
      actualUserId = authData.user.id;
      actualEmail = authData.user.email || email;
    }
    
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
    console.log("- PAYSTACK_SECRET_KEY length:", secret ? secret.length : 0);
    console.log("- PAYSTACK_SECRET_KEY starts with:", secret ? secret.substring(0, 10) + "..." : "N/A");
    console.log("- Public URL:", publicUrl);
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log("- VERCEL_ENV:", process.env.VERCEL_ENV);
    
    if (!secret) {
      console.error("PAYSTACK_SECRET_KEY is missing from environment variables");
      console.error("Available environment variables:", Object.keys(process.env).filter(key => key.includes('PAYSTACK')));
      return NextResponse.json({ 
        error: "Payment service configuration error", 
        details: "PAYSTACK_SECRET_KEY is missing from environment variables",
        environment: process.env.NODE_ENV,
        vercel: process.env.VERCEL_ENV
      }, { status: 500 });
    }

    // Determine callback URL based on payment type
    const metadata = body.metadata || {};
    const isWalletDeposit = metadata.type === 'wallet_deposit';
    const isSubscriptionPayment = amount_kobo === 425000; // ₦4,250 subscription payment
    
    let callbackUrl = undefined;
    if (publicUrl) {
      if (isWalletDeposit) {
        callbackUrl = `${publicUrl}/wallet?payment=success&amount=${amount_kobo/100}`;
      } else if (isSubscriptionPayment) {
        // Subscription payment - redirect to account creation
        callbackUrl = `${publicUrl}/sign-up?payment=success&redirectTo=/customer`;
      } else {
        // Other payments go directly to customer page
        callbackUrl = `${publicUrl}/customer?payment=success`;
      }
    }

    // Prepare Paystack request
    const paystackPayload = {
      email: actualEmail || `${actualUserId}@noemail.local`,
      amount: amount_kobo, // paystack expects kobo
      currency: "NGN",
      metadata: { user_id: actualUserId, ...metadata },
      callback_url: callbackUrl,
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
