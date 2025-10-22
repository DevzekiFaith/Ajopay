"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Wallet, 
  Activity, 
  Zap,
  BarChart3,
  Clock,
  DollarSign,
  Flame,
  Brain
} from "lucide-react";

interface LiveAnalyticsProps {
  userId?: string;
  walletNaira?: number;
  history?: Array<{ id: string; amount_kobo: number; contributed_at: string }>;
  streak?: number;
  last7Naira?: number;
  prev7Naira?: number;
  sparkPoints?: string;
}

export default function LiveAnalyticsDashboard({ 
  userId, 
  walletNaira = 0, 
  history = [], 
  streak = 0, 
  last7Naira = 0, 
  prev7Naira = 0,
  sparkPoints = "0"
}: LiveAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Get user's contribution history
        const { data: contributions, error: contribError } = await supabase
          .from('contributions')
          .select('*')
          .eq('user_id', userId)
          .order('contributed_at', { ascending: false })
          .limit(100);

        if (contribError) {
          console.error('Error fetching contributions:', contribError);
        }

        // Get user's wallet transactions
        const { data: transactions, error: transError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (transError) {
          console.error('Error fetching transactions:', transError);
        }

        // Calculate analytics
        const totalContributions = contributions?.length || 0;
        const totalAmount = contributions?.reduce((sum, c) => sum + (c.amount_kobo || 0), 0) || 0;
        const avgContribution = totalContributions > 0 ? totalAmount / totalContributions : 0;
        
        // Calculate weekly activity
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentContributions = contributions?.filter(c => 
          new Date(c.contributed_at) >= oneWeekAgo
        ) || [];
        
        // Calculate monthly activity
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const monthlyContributions = contributions?.filter(c => 
          new Date(c.contributed_at) >= oneMonthAgo
        ) || [];

        // Calculate engagement score
        const engagementScore = Math.min(100, Math.round(
          (totalContributions * 10) + 
          (streak * 5) + 
          (recentContributions.length * 15) +
          (walletNaira > 0 ? 20 : 0)
        ));

        // Calculate savings consistency
        const consistencyScore = totalContributions > 0 ? 
          Math.round((monthlyContributions.length / 30) * 100) : 0;

        setAnalyticsData({
          totalContributions,
          totalAmount,
          avgContribution,
          recentContributions: recentContributions.length,
          monthlyContributions: monthlyContributions.length,
          engagementScore,
          consistencyScore,
          streak,
          walletNaira,
          last7Naira,
          prev7Naira,
          sparkPoints,
          transactions: transactions?.length || 0
        });

      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [userId, supabase, walletNaira, history, streak, last7Naira, prev7Naira, sparkPoints]);

  // Real-time updates
  useEffect(() => {
    if (!userId) return;

    let channel: any = null;

    const setupRealtime = async () => {
      // Subscribe to contributions changes
      channel = supabase
        .channel('analytics-contributions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contributions',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('📊 Analytics: Contribution change detected', payload);
            setLastUpdate(new Date());
            // Reload analytics data
            loadAnalytics();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('📊 Analytics: Transaction change detected', payload);
            setLastUpdate(new Date());
            // Reload analytics data
            loadAnalytics();
          }
        )
        .subscribe();

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        setLastUpdate(new Date());
        loadAnalytics();
      }, 30000);

      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
        clearInterval(interval);
      };
    };

    const cleanup = setupRealtime();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [userId, supabase]);

  const loadAnalytics = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Get user's contribution history
      const { data: contributions, error: contribError } = await supabase
        .from('contributions')
        .select('*')
        .eq('user_id', userId)
        .order('contributed_at', { ascending: false })
        .limit(100);

      if (contribError) {
        console.error('Error fetching contributions:', contribError);
      }

      // Get user's wallet transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transError) {
        console.error('Error fetching transactions:', transError);
      }

      // Calculate analytics
      const totalContributions = contributions?.length || 0;
      const totalAmount = contributions?.reduce((sum, c) => sum + (c.amount_kobo || 0), 0) || 0;
      const avgContribution = totalContributions > 0 ? totalAmount / totalContributions : 0;
      
      // Calculate weekly activity
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentContributions = contributions?.filter(c => 
        new Date(c.contributed_at) >= oneWeekAgo
      ) || [];
      
      // Calculate monthly activity
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthlyContributions = contributions?.filter(c => 
        new Date(c.contributed_at) >= oneMonthAgo
      ) || [];

      // Calculate engagement score
      const engagementScore = Math.min(100, Math.round(
        (totalContributions * 10) + 
        (streak * 5) + 
        (recentContributions.length * 15) +
        (walletNaira > 0 ? 20 : 0)
      ));

      // Calculate savings consistency
      const consistencyScore = totalContributions > 0 ? 
        Math.round((monthlyContributions.length / 30) * 100) : 0;

      setAnalyticsData({
        totalContributions,
        totalAmount,
        avgContribution,
        recentContributions: recentContributions.length,
        monthlyContributions: monthlyContributions.length,
        engagementScore,
        consistencyScore,
        streak,
        walletNaira,
        last7Naira,
        prev7Naira,
        sparkPoints,
        transactions: transactions?.length || 0
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Loading Analytics...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No analytics data available yet. Start using the app to generate insights!</p>
        </CardContent>
      </Card>
    );
  }

  const formatNaira = (amount: number) => `₦${Math.round(amount / 100).toLocaleString()}`;
  const formatKobo = (amount: number) => `₦${Math.round(amount / 100).toLocaleString()}`;

  return (
    <div className="space-y-4">
      {/* Header with live indicator */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          AI Smart Insights
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>

      {/* Smart Recommendations - Main Focus */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Dynamic recommendations based on user behavior */}
          {analyticsData.consistencyScore < 50 && (
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <div className="text-base sm:text-lg">🎯</div>
                <div>
                  <p className="font-medium text-sm sm:text-base text-yellow-800 dark:text-yellow-200">Improve Consistency</p>
                  <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                    Set a daily reminder at 8 PM to save ₦{Math.max(200, Math.round(analyticsData.avgContribution / 100))}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {analyticsData.streak > 7 && (
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <div className="text-base sm:text-lg">🔥</div>
                <div>
                  <p className="font-medium text-sm sm:text-base text-green-800 dark:text-green-200">Streak Champion!</p>
                  <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                    {analyticsData.streak} days strong! Try increasing your daily amount by 20%
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {analyticsData.engagementScore > 80 && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="text-base sm:text-lg">⭐</div>
                <div>
                  <p className="font-medium text-sm sm:text-base text-blue-800 dark:text-blue-200">Ready for Bigger Goals</p>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                    You're saving consistently! Set a ₦50,000 goal for next month
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {analyticsData.walletNaira > 10000 && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <div className="text-base sm:text-lg">💰</div>
                <div>
                  <p className="font-medium text-sm sm:text-base text-purple-800 dark:text-purple-200">Savings Milestone</p>
                  <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">
                    You've saved {formatNaira(walletNaira * 100)}! Consider investing or setting a bigger target
                  </p>
                </div>
              </div>
            </div>
          )}

          {analyticsData.recentContributions === 0 && analyticsData.totalContributions > 0 && (
            <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <div className="text-lg">⏰</div>
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-200">Get Back on Track</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    You haven't saved this week. Start with a small amount to rebuild the habit
                  </p>
                </div>
              </div>
            </div>
          )}

          {analyticsData.totalContributions === 0 && (
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-start gap-3">
                <div className="text-lg">🚀</div>
                <div>
                  <p className="font-medium text-indigo-800 dark:text-indigo-200">Start Your Journey</p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    Begin with ₦200 today and build a consistent saving habit
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights - Compact */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-3">
            <div className="text-center">
              <Activity className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Engagement</p>
              <p className="text-lg font-bold text-blue-600">{analyticsData.engagementScore}/100</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-3">
            <div className="text-center">
              <Calendar className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Consistency</p>
              <p className="text-lg font-bold text-green-600">{analyticsData.consistencyScore}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
