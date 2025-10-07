import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Paystack debug endpoint called");
    
    // Check environment variables
    const envCheck = {
      hasPaystackSecretKey: !!process.env.PAYSTACK_SECRET_KEY,
      paystackSecretKeyLength: process.env.PAYSTACK_SECRET_KEY ? process.env.PAYSTACK_SECRET_KEY.length : 0,
      paystackSecretKeyPrefix: process.env.PAYSTACK_SECRET_KEY ? process.env.PAYSTACK_SECRET_KEY.substring(0, 10) + "..." : "N/A",
      hasPublicUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      publicUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "Not set",
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };

    console.log("Paystack environment check:", envCheck);

    // Test Paystack API connection
    let paystackTest: { success: boolean; error: string | null; data: string | null } = { success: false, error: null, data: null };
    if (process.env.PAYSTACK_SECRET_KEY) {
      try {
        const response = await fetch("https://api.paystack.co/transaction/totals", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
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
      paystackTest = { success: false, error: "PAYSTACK_SECRET_KEY not configured", data: null };
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
