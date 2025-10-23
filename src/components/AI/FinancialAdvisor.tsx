"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  AlertCircle,
  CheckCircle,
  Sparkles,
  BarChart3,
  PiggyBank,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface FinancialInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'achievement' | 'opportunity';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'savings' | 'investment' | 'spending' | 'goal';
  impact: number; // 1-10 scale
  icon: React.ReactNode;
}

interface FinancialAdvisorProps {
  userBalance: number;
  monthlyIncome?: number;
  savingsGoals?: any[];
  transactionHistory?: any[];
  onActionClick?: (action: string) => void;
}

export function FinancialAdvisor({ 
  userBalance, 
  monthlyIncome = 0, 
  savingsGoals = [], 
  transactionHistory = [],
  onActionClick 
}: FinancialAdvisorProps) {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // AI-powered financial analysis
  const analyzeFinances = useCallback(async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newInsights: FinancialInsight[] = [];
    
    // Analyze savings rate
    if (monthlyIncome > 0) {
      const savingsRate = (userBalance / monthlyIncome) * 100;
      if (savingsRate < 10) {
        newInsights.push({
          id: 'low-savings-rate',
          type: 'warning',
          title: 'Low Savings Rate Detected',
          description: `Your savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your income.`,
          action: 'Set up automatic savings',
          priority: 'high',
          category: 'savings',
          impact: 8,
          icon: <AlertCircle className="h-5 w-5 text-orange-500" />
        });
      } else if (savingsRate > 20) {
        newInsights.push({
          id: 'excellent-savings',
          type: 'achievement',
          title: 'Excellent Savings Rate!',
          description: `Your savings rate of ${savingsRate.toFixed(1)}% is above the recommended 20%. Keep it up!`,
          priority: 'medium',
          category: 'savings',
          impact: 7,
          icon: <CheckCircle className="h-5 w-5 text-green-500" />
        });
      }
    }
    
    // Analyze spending patterns
    if (transactionHistory.length > 0) {
      const recentTransactions = transactionHistory.slice(0, 10);
      const totalSpent = recentTransactions
        .filter(t => t.type === 'withdrawal' || t.type === 'send')
        .reduce((sum, t) => sum + Math.abs(t.amount_kobo), 0);
      
      if (totalSpent > userBalance * 0.8) {
        newInsights.push({
          id: 'high-spending',
          type: 'warning',
          title: 'High Spending Alert',
          description: 'Your recent spending is high relative to your balance. Consider reviewing your expenses.',
          action: 'Review spending habits',
          priority: 'high',
          category: 'spending',
          impact: 6,
          icon: <AlertCircle className="h-5 w-5 text-red-500" />
        });
      }
    }
    
    // Investment opportunities
    if (userBalance > 50000) { // ₦500
      newInsights.push({
        id: 'investment-opportunity',
        type: 'opportunity',
        title: 'Investment Opportunity Available',
        description: 'You have sufficient funds to start investing. Consider our low-risk investment options for better returns.',
        action: 'Explore investments',
        priority: 'medium',
        category: 'investment',
        impact: 8,
        icon: <TrendingUp className="h-5 w-5 text-blue-500" />
      });
    }
    
    // Goal progress analysis
    if (savingsGoals.length > 0) {
      const activeGoals = savingsGoals.filter(goal => goal.status === 'active');
      if (activeGoals.length > 3) {
        newInsights.push({
          id: 'too-many-goals',
          type: 'suggestion',
          title: 'Consider Consolidating Goals',
          description: 'You have many active savings goals. Consider focusing on 2-3 priority goals for better results.',
          action: 'Review goals',
          priority: 'low',
          category: 'goal',
          impact: 4,
          icon: <Target className="h-5 w-5 text-purple-500" />
        });
      }
    }
    
    // Emergency fund check
    if (monthlyIncome > 0 && userBalance < monthlyIncome * 3) {
      newInsights.push({
        id: 'emergency-fund',
        type: 'suggestion',
        title: 'Build Your Emergency Fund',
        description: 'Consider building an emergency fund worth 3-6 months of expenses for financial security.',
        action: 'Create emergency fund goal',
        priority: 'high',
        category: 'savings',
        impact: 9,
        icon: <PiggyBank className="h-5 w-5 text-yellow-500" />
      });
    }
    
    // Smart savings suggestions
    if (userBalance > 0 && userBalance < 100000) { // Less than ₦1,000
      newInsights.push({
        id: 'micro-savings',
        type: 'suggestion',
        title: 'Micro-Savings Challenge',
        description: 'Start with small daily savings. Even ₦50 daily can grow to ₦18,250 in a year!',
        action: 'Start micro-savings',
        priority: 'medium',
        category: 'savings',
        impact: 6,
        icon: <Zap className="h-5 w-5 text-green-500" />
      });
    }
    
    setInsights(newInsights);
    setIsAnalyzing(false);
    
    if (newInsights.length > 0) {
      toast.success(`AI analysis complete! Found ${newInsights.length} insights for you.`);
    }
  }, [userBalance, monthlyIncome, savingsGoals.length, transactionHistory.length]);
    
  useEffect(() => {
    // Only run analysis once on mount, not on every dependency change
    const hasRun = sessionStorage.getItem('ai-analysis-run');
    if (!hasRun) {
      analyzeFinances();
      sessionStorage.setItem('ai-analysis-run', 'true');
    }
  }, [analyzeFinances]);
    
    const filteredInsights = selectedCategory === 'all' 
      ? insights 
      : insights.filter(insight => insight.category === selectedCategory);
    
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
        case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
        case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      }
    };
    
    const getTypeColor = (type: string) => {
      switch (type) {
        case 'warning': return 'border-red-200 dark:border-red-800';
        case 'achievement': return 'border-green-200 dark:border-green-800';
        case 'opportunity': return 'border-blue-200 dark:border-blue-800';
        case 'suggestion': return 'border-purple-200 dark:border-purple-800';
        default: return 'border-gray-200 dark:border-gray-800';
      }
    };
    
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">AI Financial Advisor</CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Personalized insights powered by AI
                </p>
              </div>
            </div>
            <Button
              onClick={analyzeFinances}
              disabled={isAnalyzing}
              size="sm"
              variant="outline"
              className="gap-2 w-full sm:w-auto"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-purple-500"></div>
                  <span className="text-xs sm:text-sm">Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Re-analyze</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-1 sm:gap-2 flex-wrap">
            {['all', 'savings', 'investment', 'spending', 'goal'].map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                className="capitalize text-xs sm:text-sm"
              >
                {category}
              </Button>
            ))}
          </div>
          
          {/* Insights List */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredInsights.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {isAnalyzing ? 'Analyzing your finances...' : 'No insights available. Try re-analyzing.'}
                  </p>
                </div>
              ) : (
                filteredInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`border-l-4 ${getTypeColor(insight.type)}`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="scale-75 sm:scale-100">
                              {insight.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                                {insight.title}
                              </h4>
                              <Badge className={`${getPriorityColor(insight.priority)} text-xs w-fit`}>
                                {insight.priority}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {insight.description}
                            </p>
                            {insight.action && (
                              <Button
                                onClick={() => onActionClick?.(insight.action!)}
                                size="sm"
                                variant="outline"
                                className="gap-2 w-full sm:w-auto"
                              >
                                <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm">{insight.action}</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
          
          {/* Summary Stats */}
          {insights.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {insights.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Total Insights
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {Math.round(insights.reduce((sum, insight) => sum + insight.impact, 0) / insights.length)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Avg. Impact
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
