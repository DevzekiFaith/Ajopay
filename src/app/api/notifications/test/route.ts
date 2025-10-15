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
    const { type = 'test' } = await req.json();

    // Create a test notification with proper content
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        type: type,
        title: "Test Notification! 🧪",
        message: "This is a test notification to verify that the notification system is working properly. You should see both the title and this message content when you view your notifications.",
        data: {
          test: true,
          timestamp: new Date().toISOString(),
          source: "test_api"
        },
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create test notification:", error);
      return NextResponse.json(
        { error: "Failed to create test notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test notification created successfully!",
      notification: notification
    });

  } catch (error: any) {
    console.error("Test notification API error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
