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
    const { type = 'savings_reminder' } = await req.json();

    // Create a test smart notification with proper content
    const { data: notification, error } = await supabase
      .from("smart_notifications")
      .insert({
        user_id: user.id,
        type: type,
        title: "Smart Notification Test! 🤖",
        message: "This is a test smart notification to verify that the smart notification system is working properly. Smart notifications provide personalized insights and reminders based on your usage patterns.",
        priority: "medium",
        data: {
          test: true,
          timestamp: new Date().toISOString(),
          source: "smart_test_api",
          insights: {
            user_activity: "active",
            savings_pattern: "consistent"
          }
        },
        scheduled_for: new Date().toISOString(),
        sent: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create test smart notification:", error);
      return NextResponse.json(
        { error: "Failed to create test smart notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test smart notification created successfully!",
      notification: notification
    });

  } catch (error: any) {
    console.error("Test smart notification API error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
