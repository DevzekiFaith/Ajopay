import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("Test webhook endpoint called");
    
    const body = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    
    console.log("Headers:", headers);
    console.log("Body:", body);
    
    return NextResponse.json({ 
      success: true, 
      message: "Webhook endpoint is working",
      received_at: new Date().toISOString(),
      headers,
      body: body ? JSON.parse(body) : null
    });
  } catch (error: any) {
    console.error("Test webhook error:", error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Test webhook endpoint is accessible",
    endpoint: "/api/test-webhook",
    method: "POST",
    timestamp: new Date().toISOString()
  });
}


