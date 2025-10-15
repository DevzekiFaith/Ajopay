import { NextRequest, NextResponse } from "next/server";
import { smartNotifications, generateUserNotifications, getPendingNotifications } from "@/lib/smart-notifications";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    switch (action) {
      case 'generate':
        // Generate new smart notifications for the user
        const newNotifications = generateUserNotifications(userId);
        
        // Store notifications in database
        if (newNotifications.length > 0) {
          const { error } = await supabase
            .from("smart_notifications")
            .insert(newNotifications.map(notif => ({
              user_id: notif.userId,
              type: notif.type,
              title: notif.title,
              message: notif.message,
              priority: notif.priority,
              data: notif.data,
              scheduled_for: notif.scheduledFor,
              sent: notif.sent,
              created_at: notif.createdAt,
            })));

          if (error) {
            console.error("Failed to store notifications:", error);
          }
        }

        return NextResponse.json({ 
          success: true, 
          notifications: newNotifications,
          count: newNotifications.length 
        });

      case 'get_pending':
        // Get pending notifications for the user
        const pendingNotifications = getPendingNotifications(userId);
        return NextResponse.json({ 
          success: true, 
          notifications: pendingNotifications,
          count: pendingNotifications.length 
        });

      case 'mark_sent':
        const { notificationId } = await req.json();
        if (!notificationId) {
          return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
        }

        // Mark notification as sent in database
        const { error } = await supabase
          .from("smart_notifications")
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq("id", notificationId);

        if (error) {
          console.error("Failed to mark notification as sent:", error);
          return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
        }

        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Smart notifications API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    let query = supabase
      .from("smart_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch notifications:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      notifications: data,
      count: data?.length || 0 
    });

  } catch (error: any) {
    console.error("Smart notifications GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


