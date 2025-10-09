"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { DollarSign, Users, TrendingUp, Calendar, Copy, Check, TestTube, Zap, Trophy, Target } from "lucide-react";

export default function CommissionTestPage() {
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

  const testCommissionTransaction = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to test commissions");
        return;
      }

      setCurrentUserId(user.id);

      // Simulate a transaction that should generate a commission
      const testTransaction = {
        user_id: user.id,
        amount: 10000, // ₦100
        type: 'deposit',
        description: 'Test commission transaction',
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
        addTestResult("✅ Test transaction created - commission should be generated!");
        toast.success("Test transaction created!");
        
        // Trigger commission check
        triggerUpdate('transaction_made', {
          amount: testTransaction.amount,
          type: testTransaction.type,
          description: 'Test transaction for commission generation'
        });
      }
    } catch (error) {
      addTestResult(`❌ Error: ${error}`);
      toast.error("Test failed");
    }
  };

  const testDailyCheckin = async () => {
    try {
      const response = await fetch('/api/commissions/daily-checkin', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addTestResult("✅ Daily check-in completed - commission should be awarded!");
        toast.success("Daily check-in completed!");
      } else {
        addTestResult(`❌ Daily check-in failed: ${data.error || data.message}`);
        toast.error("Daily check-in failed");
      }
    } catch (error) {
      addTestResult(`❌ Error: ${error}`);
      toast.error("Test failed");
    }
  };

  const testGoalCompletion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to test goal completion");
        return;
      }

      // Create a test savings goal
      const testGoal = {
        user_id: user.id,
        title: 'Test Commission Goal',
        target_amount: 50000, // ₦500
        current_amount: 50000, // Already completed
        description: 'Testing goal completion commission',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed'
      };

      const { error } = await supabase
        .from('savings_goals')
        .insert([testGoal]);

      if (error) {
        addTestResult(`❌ Goal test failed: ${error.message}`);
        toast.error("Goal test failed");
      } else {
        addTestResult("✅ Test goal created - goal completion commission should trigger!");
        toast.success("Test goal created!");
        
        // Trigger goal completion event
        triggerUpdate('goal_completed', {
          goalTitle: testGoal.title,
          goalId: testGoal.id,
          targetAmount: testGoal.target_amount
        });
      }
    } catch (error) {
      addTestResult(`❌ Error: ${error}`);
      toast.error("Test failed");
    }
  };

  const testDirectCommission = () => {
    // Test direct commission trigger
    triggerUpdate('transaction_made', {
      amount: 5000,
      type: 'commission',
      description: 'Direct commission test'
    });
    addTestResult("✅ Direct commission trigger sent!");
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-green-900 dark:to-purple-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <TestTube className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Commission Test Center
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Test all live commission features including transaction-based earnings, 
            daily check-ins, goal completion bonuses, and real-time updates.
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
                {realtimeConnected ? "Commissions will update live!" : "Connect to test live features"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Transaction Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={testCommissionTransaction}
                className="w-full"
                variant="default"
              >
                Test Transaction Commission
              </Button>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Creates a test transaction to trigger commission generation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Daily Check-in
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={testDailyCheckin}
                className="w-full"
                variant="default"
              >
                Test Daily Check-in
              </Button>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Tests daily check-in commission awarding
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                Goal Completion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={testGoalCompletion}
                className="w-full"
                variant="default"
              >
                Test Goal Completion
              </Button>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Tests goal completion commission bonus
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Direct Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={testDirectCommission}
                className="w-full"
                variant="outline"
              >
                Test Direct Commission
              </Button>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Tests direct commission trigger
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-500" />
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
                  No test results yet. Run some tests to see live commission triggers!
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

        {/* Commission Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Live Commission Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600 dark:text-green-400">✅ Working Live:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Transaction-based commissions</li>
                  <li>• Daily check-in bonuses</li>
                  <li>• Goal completion rewards</li>
                  <li>• Referral commissions</li>
                  <li>• Real-time commission updates</li>
                  <li>• Live earning activity tracking</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600 dark:text-blue-400">💰 Commission Sources:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Daily check-ins (₦50-100)</li>
                  <li>• Transaction commissions (1-5%)</li>
                  <li>• Goal completion bonuses (₦200-500)</li>
                  <li>• Referral rewards (₦500-1000)</li>
                  <li>• Achievement bonuses</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
