import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = authData.user.id;

    const admin = getSupabaseAdminClient();
    const { data: contributions, error } = await admin
      .from("contributions")
      .select("amount_kobo, contributed_at")
      .eq("user_id", userId)
      .order("contributed_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = contributions ?? [];
    const totalSavings = rows.reduce((sum: number, c: any) => sum + (c.amount_kobo || 0), 0) / 100;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentContributions = rows.filter((c: any) => new Date(c.contributed_at) >= thirtyDaysAgo);
    const dailyAverage = recentContributions.length > 0
      ? recentContributions.reduce((sum: number, c: any) => sum + (c.amount_kobo || 0), 0) / 100 / 30
      : 0;

    const dates = new Set(rows.map((c: any) => c.contributed_at));
    const today = new Date().toISOString().slice(0, 10);
    let streakDays = 0;
    let cursor = new Date(today);
    if (!dates.has(today)) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (true) {
      const iso = cursor.toISOString().slice(0, 10);
      if (dates.has(iso)) {
        streakDays += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }

    const contributionConsistency = recentContributions.length;

    // Weekly growth (last 14 days)
    const end = new Date();
    const start14 = new Date();
    start14.setDate(end.getDate() - 13);
    const last7Start = new Date(end);
    last7Start.setDate(end.getDate() - 6);
    const prev7Start = new Date(end);
    prev7Start.setDate(end.getDate() - 13);
    const prev7End = new Date(end);
    prev7End.setDate(end.getDate() - 7);
    let last7 = 0, prev7 = 0;
    for (const r of rows) {
      const d = (r.contributed_at || "").slice(0, 10);
      if (!d) continue;
      if (d >= last7Start.toISOString().slice(0, 10) && d <= end.toISOString().slice(0, 10)) last7 += (r.amount_kobo || 0);
      else if (d >= prev7Start.toISOString().slice(0, 10) && d <= prev7End.toISOString().slice(0, 10)) prev7 += (r.amount_kobo || 0);
    }
    const weeklyGrowth = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);

    const savingsHealth = Math.min(100, Math.round((streakDays * 2) + (contributionConsistency) + (weeklyGrowth > 0 ? 10 : 0)));
    const monthlyTarget = 6000; // default target for summary
    const goalProgress = Math.min(100, (totalSavings / monthlyTarget) * 100);

    const metrics = {
      totalSavings,
      dailyAverage,
      weeklyGrowth,
      streakDays,
      contributionConsistency,
      savingsHealth,
      goalProgress,
      monthlyTarget,
      lastContribution: rows[0]?.contributed_at || null,
      contributionFrequency: recentContributions.length
    };

    return NextResponse.json({ metrics });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}






