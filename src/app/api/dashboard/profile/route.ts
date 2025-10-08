import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = authData.user.id;

    const admin = getSupabaseAdminClient();

    // Get profile data
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileErr) {
      console.error("Error fetching profile:", profileErr);
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // Get wallet data (contributions)
    const { data: sumRows, error: sumErr } = await admin
      .from("contributions")
      .select("amount_kobo, contributed_at")
      .eq("user_id", userId);

    if (sumErr) {
      console.error("Error fetching contributions:", sumErr);
      return NextResponse.json({ error: sumErr.message }, { status: 500 });
    }

    const totalKobo = (sumRows ?? []).reduce((acc: number, r: any) => acc + (r.amount_kobo ?? 0), 0);
    const walletTotalNaira = Math.round(totalKobo / 100);
    
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayKobo = (sumRows ?? [])
      .filter((r: any) => r.contributed_at === todayStr)
      .reduce((acc: number, r: any) => acc + (r.amount_kobo ?? 0), 0);
    const todayNaira = Math.round(todayKobo / 100);

    return NextResponse.json({
      profile: profile || null,
      walletTotalNaira,
      todayNaira,
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}




