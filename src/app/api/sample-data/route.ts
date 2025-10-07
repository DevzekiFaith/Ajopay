import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const admin = getSupabaseAdminClient();

    // Create a sample user profile if it doesn't exist
    const sampleUserId = "00000000-0000-0000-0000-000000000001";
    
    // Check if profile exists
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", sampleUserId)
      .maybeSingle();

    if (!existingProfile) {
      // Create sample profile
      await admin.from("profiles").insert({
        id: sampleUserId,
        full_name: "Sample User",
        email: "sample@ajopay.com",
        role: "customer"
      });
    }

    // Create sample contributions for the last 30 days
    const contributions = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Skip some days to make it realistic (not every day)
      if (Math.random() > 0.3) continue;
      
      const amount = Math.floor(Math.random() * 800) + 200; // Random amount between 200-1000
      
      contributions.push({
        user_id: sampleUserId,
        amount_kobo: amount * 100,
        method: "wallet",
        status: "confirmed",
        contributed_at: date.toISOString().slice(0, 10),
        created_at: new Date().toISOString()
      });
    }

    // Insert sample contributions
    const { error } = await admin
      .from("contributions")
      .insert(contributions);

    if (error) {
      console.error("Error inserting sample contributions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Created ${contributions.length} sample contributions`,
      userId: sampleUserId
    });

  } catch (error: any) {
    console.error("Sample data creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create sample data" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const admin = getSupabaseAdminClient();
    
    // Get sample user data
    const sampleUserId = "00000000-0000-0000-0000-000000000001";
    
    const { data: contributions } = await admin
      .from("contributions")
      .select("*")
      .eq("user_id", sampleUserId)
      .order("contributed_at", { ascending: false });

    const totalKobo = contributions?.reduce((sum, c) => sum + (c.amount_kobo || 0), 0) || 0;
    const totalNaira = Math.round(totalKobo / 100);

    return NextResponse.json({
      contributions: contributions || [],
      totalContributions: contributions?.length || 0,
      totalNaira,
      userId: sampleUserId
    });

  } catch (error: any) {
    console.error("Sample data fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch sample data" }, { status: 500 });
  }
}
