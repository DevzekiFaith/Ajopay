import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();

    // Search for user by email using admin client (bypasses RLS)
    const { data: user, error } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", email.trim())
      .maybeSingle();

    if (error) {
      console.error("Error searching for user:", error);
      return NextResponse.json({ error: "Failed to search for user" }, { status: 500 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("User search error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
