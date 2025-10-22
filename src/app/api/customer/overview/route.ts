import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    console.log("Customer overview API called");
    
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    
    // Use sample data if no user is authenticated
    let userId = authData?.user?.id;
    if (authErr || !authData?.user) {
      console.log("No authenticated user, using sample user");
      userId = "00000000-0000-0000-0000-000000000001"; // Fallback to sample user with valid UUID
    } else {
      console.log("Authenticated user:", userId);
    }

    console.log("Getting admin client...");
    const admin = getSupabaseAdminClient();
    console.log("Admin client created successfully");

    // Total wallet
    console.log("Querying contributions for user:", userId);
    const { data: sumRows, error: sumErr } = await admin
      .from("contributions")
      .select("amount_kobo")
      .eq("user_id", userId);
    
    if (sumErr) {
      console.error("Contributions query error:", sumErr);
      return NextResponse.json({ 
        error: "Failed to load contributions data",
        details: sumErr.message 
      }, { status: 500 });
    }
    
    console.log("Contributions query successful, rows:", sumRows?.length || 0);
    const totalKobo = (sumRows ?? []).reduce((acc: number, r: any) => acc + (r.amount_kobo ?? 0), 0);
    const walletNaira = Math.round(totalKobo / 100);

    // If no data exists, create some mock data for demo purposes
    if (sumRows?.length === 0) {
      console.log("No contributions found, creating mock data for demo");
      
      // Create mock contributions for the last 14 days
      const mockContributions = [];
      const today = new Date();
      
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Skip some days to make it realistic (60% chance of contribution)
        if (Math.random() > 0.4) continue;
        
        const amount = Math.floor(Math.random() * 600) + 200; // Random amount between 200-800
        
        mockContributions.push({
          amount_kobo: amount * 100,
          contributed_at: date.toISOString().slice(0, 10)
        });
      }
      
      // Ensure we have at least some recent contributions for the last 7 days
      if (mockContributions.filter(c => {
        const contribDate = new Date(c.contributed_at);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return contribDate >= sevenDaysAgo;
      }).length === 0) {
        // Add at least one contribution in the last 7 days
        const recentDate = new Date(today);
        recentDate.setDate(today.getDate() - Math.floor(Math.random() * 3)); // Within last 3 days
        
        mockContributions.push({
          amount_kobo: (Math.floor(Math.random() * 400) + 300) * 100, // 300-700
          contributed_at: recentDate.toISOString().slice(0, 10)
        });
      }
      
      // Use mock data for calculations
      const mockTotalKobo = mockContributions.reduce((acc, r) => acc + r.amount_kobo, 0);
      const mockWalletNaira = Math.round(mockTotalKobo / 100);
      
      // Calculate last 7 days and previous 7 days from mock data
      const end = new Date();
      const last7Start = new Date(end);
      last7Start.setDate(end.getDate() - 6);
      const prev7Start = new Date(end);
      prev7Start.setDate(end.getDate() - 13);
      const prev7End = new Date(end);
      prev7End.setDate(end.getDate() - 7);
      
      let last7 = 0, prev7 = 0;
      for (const r of mockContributions) {
        const d = r.contributed_at;
        if (d >= last7Start.toISOString().slice(0, 10) && d <= end.toISOString().slice(0, 10)) {
          last7 += r.amount_kobo;
        } else if (d >= prev7Start.toISOString().slice(0, 10) && d <= prev7End.toISOString().slice(0, 10)) {
          prev7 += r.amount_kobo;
        }
      }
      
      const last7Naira = Math.round(last7 / 100);
      const prev7Naira = Math.round(prev7 / 100);
      
      // Create mock history with deterministic UUIDs based on contribution data
      const mockHistory = mockContributions.map((c, i) => {
        // Create a deterministic UUID based on the contribution data
        const seed = `${c.contributed_at}-${c.amount_kobo}-${i}`;
        const hash = seed.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        // Generate a deterministic UUID-like string
        const uuid = `00000000-0000-4000-8000-${Math.abs(hash).toString(16).padStart(12, '0')}`;
        
        return {
          id: uuid,
          amount_kobo: c.amount_kobo,
          contributed_at: c.contributed_at
        };
      });
      
      // Create mock spark points
      const days = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date(end);
        d.setDate(end.getDate() - (13 - i));
        return d.toISOString().slice(0, 10);
      });
      const daySums: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
      for (const r of mockContributions) {
        const d = r.contributed_at;
        if (d && d in daySums) daySums[d] += Math.round(r.amount_kobo / 100);
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
      
      // Calculate mock streak
      const dates = new Set(mockContributions.map(c => c.contributed_at));
      const todayStr = new Date().toISOString().slice(0, 10);
      let s = 0;
      let cursor = new Date(todayStr);
      if (!dates.has(todayStr)) {
        cursor.setDate(cursor.getDate() - 1);
      }
      while (true) {
        const iso = cursor.toISOString().slice(0, 10);
        if (dates.has(iso)) {
          s += 1;
          cursor.setDate(cursor.getDate() - 1);
        } else break;
      }
      
      return NextResponse.json({
        walletNaira: mockWalletNaira,
        history: mockHistory,
        last7Naira,
        prev7Naira,
        sparkPoints,
        streak: s,
        isMockData: true // Flag to indicate this is mock data
      });
    }

    // Recent history
    const { data: hist, error: histErr } = await admin
      .from("contributions")
      .select("id, amount_kobo, contributed_at")
      .eq("user_id", userId)
      .order("contributed_at", { ascending: false })
      .limit(60);
    if (histErr) return NextResponse.json({ error: histErr.message }, { status: 500 });

    // KPIs
    const today = new Date();
    const toIso = (d: Date) => d.toISOString().slice(0, 10);
    const end = new Date(toIso(today));
    const start14 = new Date(end);
    start14.setDate(end.getDate() - 13);
    const { data: krows } = await admin
      .from("contributions")
      .select("amount_kobo, contributed_at")
      .eq("user_id", userId)
      .gte("contributed_at", toIso(start14))
      .lte("contributed_at", toIso(end));
    const rows14 = (krows as any[]) ?? [];
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
      if (d >= toIso(last7Start) && d <= toIso(end)) last7 += (r.amount_kobo ?? 0);
      else if (d >= toIso(prev7Start) && d <= toIso(prev7End)) prev7 += (r.amount_kobo ?? 0);
    }
    const last7Naira = Math.round(last7 / 100);
    const prev7Naira = Math.round(prev7 / 100);

    // Spark points (based on rows14)
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (13 - i));
      return toIso(d);
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

    // Streak based on history
    const dates = new Set((hist ?? []).map((h: any) => h.contributed_at));
    const todayStr = new Date().toISOString().slice(0, 10);
    let s = 0;
    let cursor = new Date(todayStr);
    if (!dates.has(todayStr)) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (true) {
      const iso = cursor.toISOString().slice(0, 10);
      if (dates.has(iso)) {
        s += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    const streak = s;

    const response = NextResponse.json({
      walletNaira,
      history: hist ?? [],
      last7Naira,
      prev7Naira,
      sparkPoints,
      streak,
    });
    
    // Add cache control headers to prevent caching of customer data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}



