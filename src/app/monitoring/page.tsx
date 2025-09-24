"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  Target,
  Activity,
  Zap,
  Heart,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import DashboardShell from "@/components/dashboard/Shell";

interface HealthMetrics {
  totalUsers: number;
  activeUsers: number;
  totalContributions: number;
  dailyAverage: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  streakAverage: number;
  savingsCircles: number;
  activeCircles: number;
  totalSavings: number;
  contributionHealth: number;
  userEngagement: number;
  systemHealth: number;
}

interface ContributionTrend {
  date: string;
  amount: number;
  users: number;
}

interface UserActivity {
  date: string;
  activeUsers: number;
  newUsers: number;
  contributions: number;
}

export default function MonitoringDashboard() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [contributionTrends, setContributionTrends] = useState<ContributionTrend[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Load all metrics in parallel
      const [
        usersResult,
        contributionsResult,
        savingsCirclesResult,
        recentActivityResult
      ] = await Promise.all([
        supabase.from("profiles").select("id, created_at, role"),
        supabase.from("contributions").select("amount_kobo, contributed_at, user_id"),
        supabase.from("savings_circles").select("id, is_active, created_at"),
        supabase.from("contributions")
          .select("amount_kobo, contributed_at, user_id")
          .gte("contributed_at", startDate.toISOString().slice(0, 10))
          .lte("contributed_at", endDate.toISOString().slice(0, 10))
      ]);

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
      
      // Calculate growth rates
      const midPoint = Math.floor(days / 2);
      const firstHalf = recentActivity.filter(c => {
        const date = new Date(c.contributed_at);
        return date >= startDate && date < new Date(startDate.getTime() + midPoint * 24 * 60 * 60 * 1000);
      });
      const secondHalf = recentActivity.filter(c => {
        const date = new Date(c.contributed_at);
        return date >= new Date(startDate.getTime() + midPoint * 24 * 60 * 60 * 1000);
      });
      
      const firstHalfTotal = firstHalf.reduce((sum, c) => sum + (c.amount_kobo || 0), 0) / 100;
      const secondHalfTotal = secondHalf.reduce((sum, c) => sum + (c.amount_kobo || 0), 0) / 100;
      const weeklyGrowth = firstHalfTotal > 0 ? ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100 : 0;
      
      // Calculate contribution health (based on consistency)
      const userContributionCounts = recentActivity.reduce((acc, c) => {
        acc[c.user_id] = (acc[c.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const avgContributionsPerUser = Object.values(userContributionCounts).reduce((sum, count) => sum + count, 0) / Math.max(1, activeUsers);
      const contributionHealth = Math.min(100, (avgContributionsPerUser / days) * 100);
      
      // Calculate user engagement (active users / total users)
      const userEngagement = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
      
      // Calculate system health (composite score)
      const systemHealth = (contributionHealth + userEngagement + Math.min(100, (totalSavings / 1000000) * 100)) / 3;

      const healthMetrics: HealthMetrics = {
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

      setMetrics(healthMetrics);

      // Generate trend data
      const trendData: ContributionTrend[] = [];
      const activityData: UserActivity[] = [];
      
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

      setContributionTrends(trendData);
      setUserActivity(activityData);

    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  if (loading) {
    return (
      <DashboardShell role="admin" title="Monitoring Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardShell>
    );
  }

  if (!metrics) {
    return (
      <DashboardShell role="admin" title="Monitoring Dashboard">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to load metrics</p>
        </div>
      </DashboardShell>
    );
  }

  const getHealthColor = (value: number) => {
    if (value >= 80) return "text-emerald-500";
    if (value >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthBadge = (value: number) => {
    if (value >= 80) return "bg-emerald-500/20 text-emerald-600 border-emerald-500/30";
    if (value >= 60) return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
    return "bg-red-500/20 text-red-600 border-red-500/30";
  };

  return (
    <DashboardShell role="admin" title="Monitoring Dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Time Range Selector */}
        <div className="flex justify-end">
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <TabsList className="bg-white/10 backdrop-blur-xl border border-white/20">
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* System Health Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">System Health</CardTitle>
                  <Heart className={`h-6 w-6 ${getHealthColor(metrics.systemHealth)}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {Math.round(metrics.systemHealth)}%
                </div>
                <Badge className={getHealthBadge(metrics.systemHealth)}>
                  {metrics.systemHealth >= 80 ? "Excellent" : metrics.systemHealth >= 60 ? "Good" : "Needs Attention"}
                </Badge>
                <div className="mt-3">
                  <Progress value={metrics.systemHealth} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Contribution Health</CardTitle>
                  <Activity className={`h-6 w-6 ${getHealthColor(metrics.contributionHealth)}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {Math.round(metrics.contributionHealth)}%
                </div>
                <Badge className={getHealthBadge(metrics.contributionHealth)}>
                  {metrics.contributionHealth >= 80 ? "Very Active" : metrics.contributionHealth >= 60 ? "Active" : "Low Activity"}
                </Badge>
                <div className="mt-3">
                  <Progress value={metrics.contributionHealth} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">User Engagement</CardTitle>
                  <Users className={`h-6 w-6 ${getHealthColor(metrics.userEngagement)}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {Math.round(metrics.userEngagement)}%
                </div>
                <Badge className={getHealthBadge(metrics.userEngagement)}>
                  {metrics.userEngagement >= 80 ? "Highly Engaged" : metrics.userEngagement >= 60 ? "Engaged" : "Low Engagement"}
                </Badge>
                <div className="mt-3">
                  <Progress value={metrics.userEngagement} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Growth Rate</CardTitle>
                  {metrics.weeklyGrowth >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold mb-2 ${metrics.weeklyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {metrics.weeklyGrowth >= 0 ? '+' : ''}{Math.round(metrics.weeklyGrowth)}%
                </div>
                <Badge className={metrics.weeklyGrowth >= 0 ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : "bg-red-500/20 text-red-600 border-red-500/30"}>
                  {metrics.weeklyGrowth >= 0 ? "Growing" : "Declining"}
                </Badge>
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  Weekly change
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                  {metrics.totalUsers.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {metrics.activeUsers} active ({Math.round(metrics.userEngagement)}%)
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  Total Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                  ₦{metrics.totalSavings.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  ₦{Math.round(metrics.dailyAverage).toLocaleString()} daily avg
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Contributions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                  {metrics.totalContributions.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  All time
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Savings Circles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                  {metrics.savingsCircles}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {metrics.activeCircles} active
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Charts and Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Contribution Trends */}
          <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <LineChart className="h-6 w-6 text-blue-500" />
                  Contribution Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {contributionTrends.map((trend, index) => {
                    const maxAmount = Math.max(...contributionTrends.map(t => t.amount));
                    const height = maxAmount > 0 ? (trend.amount / maxAmount) * 100 : 0;
                    return (
                      <motion.div
                        key={trend.date}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: index * 0.02, duration: 0.5 }}
                        className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg flex-1 min-h-[4px] relative group"
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          ₦{Math.round(trend.amount).toLocaleString()}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                  Daily contribution amounts over {timeRange}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* User Activity */}
          <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-emerald-500" />
                  User Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {userActivity.map((activity, index) => {
                    const maxUsers = Math.max(...userActivity.map(a => a.activeUsers));
                    const height = maxUsers > 0 ? (activity.activeUsers / maxUsers) * 100 : 0;
                    return (
                      <motion.div
                        key={activity.date}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: index * 0.02, duration: 0.5 }}
                        className="bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg flex-1 min-h-[4px] relative group"
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {activity.activeUsers} users
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                  Daily active users over {timeRange}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Health Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <PieChart className="h-6 w-6 text-purple-500" />
                Health Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">Contribution Health</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Daily Consistency</span>
                      <span className={getHealthColor(metrics.contributionHealth)}>
                        {Math.round(metrics.contributionHealth)}%
                      </span>
                    </div>
                    <Progress value={metrics.contributionHealth} className="h-2" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {metrics.contributionHealth >= 80 
                      ? "Excellent daily contribution consistency" 
                      : metrics.contributionHealth >= 60 
                      ? "Good contribution patterns" 
                      : "Consider encouraging more regular contributions"}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">User Engagement</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active Users</span>
                      <span className={getHealthColor(metrics.userEngagement)}>
                        {Math.round(metrics.userEngagement)}%
                      </span>
                    </div>
                    <Progress value={metrics.userEngagement} className="h-2" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {metrics.userEngagement >= 80 
                      ? "High user engagement and retention" 
                      : metrics.userEngagement >= 60 
                      ? "Moderate user engagement" 
                      : "Consider strategies to increase user activity"}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">Growth Trend</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Weekly Growth</span>
                      <span className={metrics.weeklyGrowth >= 0 ? "text-emerald-500" : "text-red-500"}>
                        {metrics.weeklyGrowth >= 0 ? '+' : ''}{Math.round(metrics.weeklyGrowth)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                      <div 
                        className={`h-full rounded-full ${metrics.weeklyGrowth >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, Math.abs(metrics.weeklyGrowth))}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {metrics.weeklyGrowth >= 0 
                      ? "Positive growth trajectory" 
                      : "Declining activity - review strategies"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
