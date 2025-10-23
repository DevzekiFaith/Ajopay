import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();
    
    // For demo purposes, allow any authenticated user to promote themselves to admin
    // In production, you would have proper admin promotion logic here
    const { error: updateError } = await admin
      .from("profiles")
      .update({ role: 'admin' })
      .eq("id", authData.user.id);

    if (updateError) {
      console.error("Error promoting user to admin:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "User promoted to admin successfully",
      userId: authData.user.id 
    });

  } catch (error: unknown) {
    console.error("Error in promote user API:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
