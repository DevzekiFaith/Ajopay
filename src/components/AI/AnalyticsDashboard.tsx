"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Activity, Users, DollarSign } from "lucide-react";
import { analytics, UserInsight } from "@/lib/analytics";

interface AnalyticsDashboardProps {
  userId: string;
  className?: string;
}

export default function AnalyticsDashboard({ userId, className = "" }: AnalyticsDashboardProps) {
  const [insights, setInsights] = useState<UserInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateInsights = () => {
      const userInsights = analytics.generateInsights(userId);
      setInsights(userInsights);
      setLoading(false);
    };

    generateInsights();
  }, [userId]);

  const getInsightCard = (insight: UserInsight) => {
    switch (insight.insightType) {
      case 'savings_pattern':
        return (
          <Card key={insight.insightType} className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Savings Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Amount:</span>
                  <span className="font-medium">₦{insight.insightData.averageAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Frequency:</span>
                  <span className="font-medium">{insight.insightData.frequency?.toFixed(1)}/day</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Consistency:</span>
                  <span className="font-medium">{Math.round((insight.insightData.consistency || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Saved:</span>
                  <span className="font-medium text-green-600">₦{insight.insightData.totalSavings?.toLocaleString()}</span>
                </div>
                <Progress value={insight.confidence * 100} className="mt-2" />
                <p className="text-xs text-gray-500">Confidence: {Math.round(insight.confidence * 100)}%</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'usage_frequency':
        return (
          <Card key={insight.insightType} className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Usage Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily Usage:</span>
                  <span className="font-medium">{insight.insightData.dailyUsage?.toFixed(1)} sessions</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Sessions:</span>
                  <span className="font-medium">{insight.insightData.totalSessions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Engagement:</span>
                  <Badge variant={
                    insight.insightData.engagementLevel === 'high' ? 'default' :
                    insight.insightData.engagementLevel === 'medium' ? 'secondary' : 'outline'
                  }>
                    {insight.insightData.engagementLevel}
                  </Badge>
                </div>
                <Progress value={insight.confidence * 100} className="mt-2" />
                <p className="text-xs text-gray-500">Confidence: {Math.round(insight.confidence * 100)}%</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'payment_behavior':
        return (
          <Card key={insight.insightType} className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                Payment Behavior
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Success Rate:</span>
                  <span className="font-medium">{Math.round((insight.insightData.successRate || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Attempts:</span>
                  <span className="font-medium">{insight.insightData.totalAttempts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Completed:</span>
                  <span className="font-medium text-green-600">{insight.insightData.completedPayments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Amount:</span>
                  <span className="font-medium">₦{insight.insightData.averageAmount?.toLocaleString()}</span>
                </div>
                <Progress value={insight.confidence * 100} className="mt-2" />
                <p className="text-xs text-gray-500">Confidence: {Math.round(insight.confidence * 100)}%</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'engagement_score':
        return (
          <Card key={insight.insightType} className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                Engagement Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Score:</span>
                  <span className="font-medium text-lg">{insight.insightData.score}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Events:</span>
                  <span className="font-medium">{insight.insightData.totalEvents}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Days:</span>
                  <span className="font-medium">{insight.insightData.activeDays}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Level:</span>
                  <Badge variant={
                    insight.insightData.level === 'high' ? 'default' :
                    insight.insightData.level === 'medium' ? 'secondary' : 'outline'
                  }>
                    {insight.insightData.level}
                  </Badge>
                </div>
                <Progress value={insight.confidence * 100} className="mt-2" />
                <p className="text-xs text-gray-500">Confidence: {Math.round(insight.confidence * 100)}%</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Generating insights...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Available</h3>
            <p className="text-gray-500">
              Start using Ajopay to generate personalized insights about your savings behavior.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Analytics Insights</h2>
        <Badge variant="outline">{insights.length} insights</Badge>
      </div>
      
      {insights.map(insight => getInsightCard(insight))}
      
      <Card className="mt-4">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600 text-center">
            Insights are generated based on your usage patterns and may take time to become more accurate.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


