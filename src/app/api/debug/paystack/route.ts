import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Paystack debug endpoint called");
    
    // Check environment variables
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    const isPlaceholderSecret = secretKey === 'sk_live_your_live_secret_key_here';
    const isPlaceholderPublic = publicKey === 'pk_live_your_live_public_key_here';
    
    const envCheck = {
      hasPaystackSecretKey: !!secretKey && !isPlaceholderSecret,
      hasPaystackPublicKey: !!publicKey && !isPlaceholderPublic,
      paystackSecretKeyLength: secretKey ? secretKey.length : 0,
      paystackSecretKeyPrefix: secretKey ? secretKey.substring(0, 10) + "..." : "N/A",
      isPlaceholderSecret,
      isPlaceholderPublic,
      hasPublicUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      publicUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "Not set",
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };

    console.log("Paystack environment check:", envCheck);

    // Test Paystack API connection
    let paystackTest: { success: boolean; error: string | null; data: string | null } = { success: false, error: null, data: null };
    if (secretKey && !isPlaceholderSecret) {
      try {
        const response = await fetch("https://api.paystack.co/transaction/totals", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          paystackTest = { success: true, error: null, data: "Connection successful" };
        } else {
          const errorData = await response.json();
          paystackTest = { success: false, error: errorData.message || `HTTP ${response.status}`, data: null };
        }
      } catch (error: any) {
        paystackTest = { success: false, error: error.message, data: null };
      }
    } else {
      paystackTest = { success: false, error: isPlaceholderSecret ? "PAYSTACK_SECRET_KEY is placeholder" : "PAYSTACK_SECRET_KEY not configured", data: null };
    }

    return NextResponse.json({
      environment: envCheck,
      paystackConnection: paystackTest,
      timestamp: new Date().toISOString(),
      recommendations: {
        missingSecretKey: !process.env.PAYSTACK_SECRET_KEY ? "Add PAYSTACK_SECRET_KEY to Vercel environment variables" : null,
        missingPublicUrl: !process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_SITE_URL ? "Add NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL to environment variables" : null,
        invalidSecretKey: process.env.PAYSTACK_SECRET_KEY && !process.env.PAYSTACK_SECRET_KEY.startsWith('sk_') ? "PAYSTACK_SECRET_KEY should start with 'sk_'" : null
      }
    });

  } catch (error: any) {
    console.error("Paystack debug endpoint error:", error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
