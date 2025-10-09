"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trophy, Star, Flame, Target, Gift, Crown, Zap, Award, TrendingUp, TestTube } from "lucide-react";

export default function AchievementTestPage() {
  const [isConnected, setConnected] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const supabase = getSupabaseBrowserClient();

  // Get current user for testing
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Use real-time updates
  const { isConnected: realtimeConnected, triggerUpdate } = useRealtimeUpdates(currentUserId || undefined);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testTransactionAchievement = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to test achievements");
        return;
      }

      setCurrentUserId(user.id);

      // Simulate a transaction that should trigger achievements
      const testTransaction = {
        user_id: user.id,
        amount: 5000,
        type: 'deposit',
        description: 'Test achievement transaction',
        status: 'completed'
      };

      // Insert test transaction
      const { error } = await supabase
        .from('transactions')
        .insert([testTransaction]);

      if (error) {
        addTestResult(`❌ Transaction test failed: ${error.message}`);
        toast.error("Transaction test failed");
      } else {
        addTestResult("✅ Test transaction created - achievements should trigger!");
        toast.success("Test transaction created!");
      }
    } catch (error) {
      addTestResult(`❌ Error: ${error}`);
      toast.error("Test failed");
    }
  };

  const testGoalAchievement = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to test achievements");
        return;
      }

      // Create a test savings goal
      const testGoal = {
        user_id: user.id,
        title: 'Test Achievement Goal',
        target_amount: 10000,
        current_amount: 0,
        description: 'Testing goal achievements',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error } = await supabase
        .from('savings_goals')
        .insert([testGoal]);

      if (error) {
        addTestResult(`❌ Goal test failed: ${error.message}`);
        toast.error("Goal test failed");
      } else {
        addTestResult("✅ Test goal created - goal achievements should trigger!");
        toast.success("Test goal created!");
      }
    } catch (error) {
      addTestResult(`❌ Error: ${error}`);
      toast.error("Test failed");
    }
  };

  const testDirectAchievement = () => {
    // Test direct achievement trigger
    triggerUpdate('badge_earned', {
      badgeName: 'Test Badge',
      badgeId: 'test_badge',
      message: 'This is a test achievement!'
    });
    addTestResult("✅ Direct achievement trigger sent!");
  };

  const testLevelUp = () => {
    triggerUpdate('level_up', {
      newLevel: 5,
      totalSaved: 10000
    });
    addTestResult("✅ Level up trigger sent!");
  };

  const testStreakUpdate = () => {
    triggerUpdate('streak_updated', {
      streakDays: 7,
      previousStreak: 6
    });
    addTestResult("✅ Streak update trigger sent!");
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <TestTube className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Achievement Test Center
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Test all live achievement features including transaction-based badges, 
            goal completions, level ups, and streak tracking.
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${realtimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              Real-time Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant={realtimeConnected ? "default" : "destructive"}>
                {realtimeConnected ? "Connected" : "Disconnected"}
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {realtimeConnected ? "Achievements will trigger live!" : "Connect to test live features"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Transaction Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={testTransactionAchievement}
                className="w-full"
                variant="default"
              >
                Test Transaction Achievement
              </Button>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Creates a test transaction to trigger savings achievements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Goal Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={testGoalAchievement}
                className="w-full"
                variant="default"
              >
                Test Goal Achievement
              </Button>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Creates a test savings goal to trigger goal achievements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                Direct Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={testDirectAchievement}
                className="w-full"
                variant="outline"
              >
                Test Badge Trigger
              </Button>
              <Button 
                onClick={testLevelUp}
                className="w-full"
                variant="outline"
              >
                Test Level Up
              </Button>
              <Button 
                onClick={testStreakUpdate}
                className="w-full"
                variant="outline"
              >
                Test Streak Update
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-500" />
                Test Results
              </div>
              <Button onClick={clearResults} variant="outline" size="sm">
                Clear Results
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No test results yet. Run some tests to see live achievement triggers!
                </p>
              ) : (
                testResults.map((result, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-mono"
                  >
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Achievement Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Live Achievement Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600 dark:text-green-400">✅ Working Live:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Transaction-based achievements</li>
                  <li>• Savings goal completions</li>
                  <li>• Level up celebrations</li>
                  <li>• Streak tracking updates</li>
                  <li>• Badge earning notifications</li>
                  <li>• Real-time toast notifications</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600 dark:text-blue-400">🎯 Achievement Triggers:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• First save (₦1+)</li>
                  <li>• Streak achievements (3, 7, 14, 30, 100 days)</li>
                  <li>• Savings milestones (₦5K, ₦25K, ₦50K, ₦100K+)</li>
                  <li>• Goal completions</li>
                  <li>• Level progression</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
