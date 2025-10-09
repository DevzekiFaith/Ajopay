"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  Zap,
  Heart,
  Activity,
  Award,
  Star
} from "lucide-react";
import { AjoPaySpinner } from "@/components/ui/AjoPaySpinner";

interface PersonalHealthMetrics {
  totalSavings: number;
  dailyAverage: number;
  weeklyGrowth: number;
  streakDays: number;
  contributionConsistency: number;
  savingsHealth: number;
  goalProgress: number;
  monthlyTarget: number;
  lastContribution: string | null;
  contributionFrequency: number;
}

export function PersonalHealthDashboard() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [metrics, setMetrics] = useState<PersonalHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPersonalMetrics = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Prefer server API (service role) to avoid RLS issues
      const res = await fetch("/api/metrics/personal", { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        if (j?.metrics) {
          setMetrics(j.metrics);
        }
      }

    } catch (error) {
      console.error("Error loading personal metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonalMetrics();
  }, []);

  // Add real-time updates for personal metrics
  useEffect(() => {
    const channel = supabase
      .channel("personal-health-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        () => {
          // Debounce the refresh to avoid too many updates
          setTimeout(() => {
            loadPersonalMetrics();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <AjoPaySpinner size="md" showText text="Loading health metrics..." />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load personal metrics</p>
      </div>
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
    <div className="space-y-6">
      {/* Personal Health Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Savings Health</CardTitle>
                <Heart className={`h-6 w-6 ${getHealthColor(metrics.savingsHealth)}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                {Math.round(metrics.savingsHealth)}%
              </div>
              <Badge className={getHealthBadge(metrics.savingsHealth)}>
                {metrics.savingsHealth >= 80 ? "Excellent" : metrics.savingsHealth >= 60 ? "Good" : "Needs Improvement"}
              </Badge>
              <div className="mt-3">
                <Progress value={metrics.savingsHealth} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Streak</CardTitle>
                <Zap className="h-6 w-6 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                {metrics.streakDays} days
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                {metrics.streakDays >= 30 ? "Fire!" : metrics.streakDays >= 7 ? "Great!" : "Keep going!"}
              </Badge>
              <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Daily contribution streak
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Growth</CardTitle>
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
                <Target className="h-5 w-5 text-blue-500" />
                Total Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                ₦{metrics.totalSavings.toLocaleString()}
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
                <Calendar className="h-5 w-5 text-emerald-500" />
                Daily Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                ₦{Math.round(metrics.dailyAverage).toLocaleString()}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Last 30 days
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                Consistency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                {Math.round(metrics.contributionConsistency)}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {metrics.contributionFrequency} contributions
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                {Math.round(metrics.goalProgress)}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                ₦{metrics.monthlyTarget.toLocaleString()} target
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Health Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="relative border-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155] rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Star className="h-6 w-6 text-purple-500" />
              Personal Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Savings Health</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Score</span>
                    <span className={getHealthColor(metrics.savingsHealth)}>
                      {Math.round(metrics.savingsHealth)}%
                    </span>
                  </div>
                  <Progress value={metrics.savingsHealth} className="h-2" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {metrics.savingsHealth >= 80 
                    ? "Excellent savings habits! You're on track for financial success." 
                    : metrics.savingsHealth >= 60 
                    ? "Good progress! Keep up the consistent contributions." 
                    : "Consider increasing your daily contributions to improve your savings health."}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Contribution Consistency</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Daily Rate</span>
                    <span className={getHealthColor(metrics.contributionConsistency)}>
                      {Math.round(metrics.contributionConsistency)}%
                    </span>
                  </div>
                  <Progress value={metrics.contributionConsistency} className="h-2" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {metrics.contributionConsistency >= 80 
                    ? "Outstanding consistency! You contribute almost daily." 
                    : metrics.contributionConsistency >= 60 
                    ? "Good consistency. Try to contribute more regularly." 
                    : "Consider setting daily reminders to improve your contribution consistency."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
