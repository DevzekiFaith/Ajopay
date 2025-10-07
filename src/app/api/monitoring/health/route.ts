import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
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
    console.log("Monitoring health accessed by user:", authData.user.id, "with role:", userRole);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    startDate.setDate(endDate.getDate() - days);

    // Load metrics based on user role
    let usersResult, contributionsResult, savingsCirclesResult, recentActivityResult;
    
    if (userRole === 'admin') {
      // Admin sees all data
      [usersResult, contributionsResult, savingsCirclesResult, recentActivityResult] = await Promise.all([
        admin.from("profiles").select("id, created_at, role"),
        admin.from("contributions").select("amount_kobo, contributed_at, user_id"),
        admin.from("savings_circles").select("id, is_active, created_at"),
        admin.from("contributions")
          .select("amount_kobo, contributed_at, user_id")
          .gte("contributed_at", startDate.toISOString().slice(0, 10))
          .lte("contributed_at", endDate.toISOString().slice(0, 10))
      ]);
    } else {
      // Customers see only their own data
      [usersResult, contributionsResult, savingsCirclesResult, recentActivityResult] = await Promise.all([
        admin.from("profiles").select("id, created_at, role").eq("id", authData.user.id),
        admin.from("contributions").select("amount_kobo, contributed_at, user_id").eq("user_id", authData.user.id),
        admin.from("savings_circles").select("id, is_active, created_at").eq("created_by", authData.user.id),
        admin.from("contributions")
          .select("amount_kobo, contributed_at, user_id")
          .eq("user_id", authData.user.id)
          .gte("contributed_at", startDate.toISOString().slice(0, 10))
          .lte("contributed_at", endDate.toISOString().slice(0, 10))
      ]);
    }

    const users = usersResult.data || [];
    const contributions = contributionsResult.data || [];
    const savingsCircles = savingsCirclesResult.data || [];
    const recentActivity = recentActivityResult.data || [];

    // Calculate metrics
    const totalUsers = users.length;
    const activeUsers = new Set(recentActivity.map(c => c.user_id)).size;
    const totalContributions = contributions.length;
    const totalSavings = contributions.reduce((sum, c) => sum + (c.amount_kobo || 0), 0) / 100;
    
    // Calculate daily average
    const dailyAverage = totalSavings / Math.max(1, days);
    
    // Calculate growth metrics
    const firstHalf = Math.floor(days / 2);
    const secondHalf = days - firstHalf;
    
    const firstHalfContributions = recentActivity.slice(0, firstHalf);
    const secondHalfContributions = recentActivity.slice(firstHalf);
    
    const firstHalfTotal = firstHalfContributions.reduce((sum, c) => sum + (c.amount_kobo || 0), 0) / 100;
    const secondHalfTotal = secondHalfContributions.reduce((sum, c) => sum + (c.amount_kobo || 0), 0) / 100;
    
    const weeklyGrowth = firstHalfTotal > 0 ? ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100 : 0;
    
    // Calculate health metrics
    const contributionHealth = Math.min(100, (activeUsers / Math.max(1, totalUsers)) * 100);
    const userEngagement = Math.min(100, (totalContributions / Math.max(1, totalUsers)) * 10);
    
    // Calculate system health (composite score)
    const systemHealth = (contributionHealth + userEngagement + Math.min(100, (totalSavings / 1000000) * 100)) / 3;

    const healthMetrics = {
      totalUsers,
      activeUsers,
      totalContributions,
      dailyAverage,
      weeklyGrowth,
      monthlyGrowth: weeklyGrowth * 4, // Approximate monthly from weekly
      streakAverage: 0, // Would need more complex calculation
      savingsCircles: savingsCircles.length,
      activeCircles: savingsCircles.filter(c => c.is_active).length,
      totalSavings,
      contributionHealth,
      userEngagement,
      systemHealth
    };

    // Generate trend data
    const trendData = [];
    const activityData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      const dayContributions = recentActivity.filter(c => c.contributed_at === dateStr);
      const dayAmount = dayContributions.reduce((sum, c) => sum + (c.amount_kobo || 0), 0) / 100;
      const dayUsers = new Set(dayContributions.map(c => c.user_id)).size;
      
      trendData.push({
        date: dateStr,
        amount: dayAmount,
        users: dayUsers
      });

      const newUsersToday = users.filter(u => u.created_at?.startsWith(dateStr)).length;
      activityData.push({
        date: dateStr,
        activeUsers: dayUsers,
        newUsers: newUsersToday,
        contributions: dayContributions.length
      });
    }

    return NextResponse.json({
      metrics: healthMetrics,
      trends: trendData,
      activity: activityData
    });
  } catch (error: any) {
    console.error("Server error in monitoring health API:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

