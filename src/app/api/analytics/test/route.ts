import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !authData?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = authData.user;
    const { eventType = 'test_event' } = await req.json();

    // Test analytics data
    const testEvent = {
      userId: user.id,
      eventType: eventType,
      eventData: {
        test: true,
        source: 'test_api',
        timestamp: new Date().toISOString()
      },
      sessionId: `test_session_${Date.now()}`,
      userAgent: 'test-agent',
      page: '/test',
      timestamp: new Date().toISOString()
    };

    // Send to analytics track endpoint
    const response = await fetch(`${req.nextUrl.origin}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Analytics test failed:", result);
      return NextResponse.json({
        success: false,
        error: "Analytics test failed",
        details: result
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Analytics test completed successfully",
      testEvent,
      result
    });

  } catch (error: any) {
    console.error("Analytics test API error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
