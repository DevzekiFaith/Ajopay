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
    
    // Check if user is admin using admin client to bypass RLS
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    
    if (profileError) {
      console.error("Error fetching user profile for admin check:", profileError);
      return NextResponse.json({ error: "Failed to verify admin access" }, { status: 500 });
    }
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get user's cluster_id
    const { data: me, error: meErr } = await admin
      .from("profiles")
      .select("cluster_id")
      .eq("id", userId)
      .maybeSingle();

    if (meErr) {
      console.error("Error fetching user profile:", meErr);
      return NextResponse.json({ error: meErr.message }, { status: 500 });
    }

    const cid = (me as { cluster_id?: string })?.cluster_id ?? null;

    // Gather cluster member ids
    const ids = cid
      ? ((await admin.from("profiles").select("id").eq("cluster_id", cid)).data?.map((p: { id: string }) => p.id) ?? [])
      : [];

    // All rows in scope
    const { data: allRows, error: allErr } = await admin
      .from("contributions")
      .select("amount_kobo, contributed_at, user_id")
      .in("user_id", ids ?? []);

    if (allErr) {
      console.error("Error fetching cluster contributions:", allErr);
      return NextResponse.json({ error: allErr.message }, { status: 500 });
    }

    const totalKobo = (allRows ?? []).reduce((acc: number, r: { amount_kobo?: number }) => acc + (r.amount_kobo ?? 0), 0);

    // Today's contributions
    const today = new Date().toISOString().slice(0, 10);
    const { data: todayRows, error: todayErr } = await admin
      .from("contributions")
      .select("amount_kobo, user_id")
      .eq("contributed_at", today)
      .in("user_id", ids ?? []);

    if (todayErr) {
      console.error("Error fetching today's cluster contributions:", todayErr);
      return NextResponse.json({ error: todayErr.message }, { status: 500 });
    }

    const todayKobo = (todayRows ?? []).reduce((acc: number, r: { amount_kobo?: number }) => acc + (r.amount_kobo ?? 0), 0);

    // Build sparkline (last 14 days)
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().slice(0, 10);
    });
    const sums: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
    for (const r of allRows ?? []) {
      const d = (r as { contributed_at?: string }).contributed_at?.slice(0, 10);
      if (d && d in sums) sums[d] += Math.round((r.amount_kobo ?? 0) / 100);
    }
    const series = days.map((d) => sums[d] ?? 0);
    const maxVal = Math.max(1, ...series);
    const spark = series
      .map((v, i) => {
        const x = (i / (series.length - 1)) * 100;
        const y = 26 - (v / maxVal) * 26;
        return `${x},${y}`;
      })
      .join(" ");

    return NextResponse.json({
      total: Math.round(totalKobo / 100),
      todayTotal: Math.round(todayKobo / 100),
      todayStr: today,
      spark
    });
  } catch (error: unknown) {
    console.error("Server error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
