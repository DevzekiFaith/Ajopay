import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Check user role to provide appropriate data
    const admin = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return NextResponse.json({ error: "Failed to verify user access" }, { status: 500 });
    }
    
    const userRole = profile?.role || 'customer';
    console.log("Admin stats accessed by user:", authData.user.id, "with role:", userRole);

    // Get contributions based on user role
    let allRows;
    if (userRole === 'admin') {
      // Admin sees all contributions
      const { data, error: allErr } = await admin
        .from("contributions")
        .select("amount_kobo, contributed_at, user_id, method, status");
      if (allErr) {
        console.error("Error fetching all contributions:", allErr);
        return NextResponse.json({ error: allErr.message }, { status: 500 });
      }
      allRows = data;
    } else {
      // Customers see only their own contributions
      const { data, error: userErr } = await admin
        .from("contributions")
        .select("amount_kobo, contributed_at, user_id, method, status")
        .eq("user_id", authData.user.id);
      if (userErr) {
        console.error("Error fetching user contributions:", userErr);
        return NextResponse.json({ error: userErr.message }, { status: 500 });
      }
      allRows = data;
    }

    const totalKobo = (allRows ?? []).reduce((acc: number, r: any) => acc + (r.amount_kobo ?? 0), 0);

    // Build per-user totals (₦)
    const sumByUser: Record<string, number> = {};
    for (const r of allRows ?? []) {
      const naira = Math.round((r.amount_kobo ?? 0) / 100);
      sumByUser[r.user_id] = (sumByUser[r.user_id] ?? 0) + naira;
    }

    // Fetch minimal profile info for users we need to label
    const userIds = Object.keys(sumByUser);
    let userProfiles;
    if (userRole === 'admin') {
      // Admin can see all user profiles
      const { data, error: profilesErr } = await admin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds ?? []);
      if (profilesErr) {
        console.error("Error fetching user profiles:", profilesErr);
        return NextResponse.json({ error: profilesErr.message }, { status: 500 });
      }
      userProfiles = data;
    } else {
      // Customers can only see their own profile
      const { data, error: profileErr } = await admin
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", authData.user.id);
      if (profileErr) {
        console.error("Error fetching user profile:", profileErr);
        return NextResponse.json({ error: profileErr.message }, { status: 500 });
      }
      userProfiles = data;
    }

    const userLabel: Record<string, { name: string; email: string | null }> = {};
    for (const p of userProfiles ?? []) {
      userLabel[p.id] = { name: p.full_name ?? p.email ?? p.id, email: p.email };
    }

    // Today's contributions
    const today = new Date().toISOString().slice(0, 10);
    const { data: todayRows, error: todayErr } = await admin
      .from("contributions")
      .select("amount_kobo, user_id")
      .eq("contributed_at", today);
    
    if (todayErr) {
      console.error("Error fetching today's contributions:", todayErr);
      return NextResponse.json({ error: todayErr.message }, { status: 500 });
    }

    const todayKobo = (todayRows ?? []).reduce((acc: number, r: any) => acc + (r.amount_kobo ?? 0), 0);

    // Recent contributions
    const { data: recent, error: recentErr } = await admin
      .from("contributions")
      .select("id, user_id, amount_kobo, method, status, contributed_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (recentErr) {
      console.error("Error fetching recent contributions:", recentErr);
      return NextResponse.json({ error: recentErr.message }, { status: 500 });
    }

    // Last 7 days vs previous 7 days
    const end = new Date(today);
    const start14 = new Date(end);
    start14.setDate(end.getDate() - 13);
    const { data: last14Rows, error: last14Err } = await admin
      .from("contributions")
      .select("amount_kobo, contributed_at")
      .gte("contributed_at", start14.toISOString().slice(0, 10))
      .lte("contributed_at", today);

    if (last14Err) {
      console.error("Error fetching last 14 days contributions:", last14Err);
      return NextResponse.json({ error: last14Err.message }, { status: 500 });
    }

    const rows14 = (last14Rows as any[]) ?? [];
    const last7Start = new Date(end);
    last7Start.setDate(end.getDate() - 6);
    const prev7Start = new Date(end);
    prev7Start.setDate(end.getDate() - 13);
    const prev7End = new Date(end);
    prev7End.setDate(end.getDate() - 7);

    let last7 = 0, prev7 = 0;
    for (const r of rows14) {
      const d = (r.contributed_at || "").slice(0, 10);
      if (!d) continue;
      if (d >= last7Start.toISOString().slice(0, 10) && d <= today) {
        last7 += (r.amount_kobo ?? 0);
      } else if (d >= prev7Start.toISOString().slice(0, 10) && d <= prev7End.toISOString().slice(0, 10)) {
        prev7 += (r.amount_kobo ?? 0);
      }
    }

    const last7Naira = Math.round(last7 / 100);
    const prev7Naira = Math.round(prev7 / 100);
    const wowPct = prev7Naira > 0 ? Math.round(((last7Naira - prev7Naira) / prev7Naira) * 100) : 0;
    const isUp = last7Naira >= prev7Naira;

    // Build sparkline points (last 14 days)
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (13 - i));
      return d.toISOString().slice(0, 10);
    });
    const daySums: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
    for (const r of rows14) {
      const d = (r.contributed_at || "").slice(0, 10);
      if (d && d in daySums) daySums[d] += Math.round(((r.amount_kobo ?? 0) as number) / 100);
    }
    const series = days.map((d) => daySums[d] ?? 0);
    const maxVal = Math.max(1, ...series);
    const sparkPoints = series
      .map((v, i) => {
        const x = (i / (series.length - 1)) * 100;
        const y = 26 - (v / maxVal) * 26;
        return `${x},${y}`;
      })
      .join(" ");

    return NextResponse.json({
      totalKobo,
      todayKobo,
      last7Naira,
      prev7Naira,
      wowPct,
      isUp,
      sparkPoints,
      sumByUser,
      userLabel,
      recent: recent ?? [],
      today
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
