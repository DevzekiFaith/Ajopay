import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    // Validate required fields
    if (!event.userId || !event.eventType || !event.timestamp) {
      console.error("Missing required fields:", { userId: event.userId, eventType: event.eventType, timestamp: event.timestamp });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate user_id format (should be UUID or 'anonymous')
    const userIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userIdRegex.test(event.userId) && event.userId !== 'anonymous') {
      console.error("Invalid user ID format:", event.userId);
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // Handle anonymous users - set user_id to NULL for anonymous tracking
    let actualUserId = event.userId;
    if (event.userId === 'anonymous') {
      actualUserId = null; // NULL allows anonymous tracking
    }

    // Prepare the data for insertion
    const analyticsData = {
      user_id: actualUserId,
      event_type: event.eventType,
      event_data: event.eventData || {},
      session_id: event.sessionId || null,
      user_agent: event.userAgent || null,
      page: event.page || null,
      created_at: event.timestamp,
    };

    console.log("Inserting analytics data:", analyticsData);

    // Store event in database
    const { data, error } = await supabase
      .from("user_analytics")
      .insert(analyticsData)
      .select();

    if (error) {
      console.error("Analytics tracking error:", error);
      console.error("Failed data:", analyticsData);
      return NextResponse.json({ 
        error: "Failed to track event", 
        details: error.message,
        data: analyticsData 
      }, { status: 500 });
    }

    console.log("Analytics event tracked successfully:", data);
    return NextResponse.json({ success: true, id: data });

  } catch (error: unknown) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from("user_analytics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Analytics fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }

    return NextResponse.json({ events: data });

  } catch (error: unknown) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}


