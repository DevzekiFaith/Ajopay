// Analytics tracking for user behavior and insights
export interface UserEvent {
  id: string;
  userId: string;
  eventType: 'page_view' | 'button_click' | 'payment_initiated' | 'payment_completed' | 'savings_goal_set' | 'app_opened' | 'feature_used';
  eventData: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userAgent?: string;
  page?: string;
}

export interface UserInsight {
  userId: string;
  insightType: 'savings_pattern' | 'usage_frequency' | 'payment_behavior' | 'goal_progress' | 'engagement_score';
  insightData: Record<string, any>;
  confidence: number; // 0-1
  generatedAt: Date;
}

class AnalyticsTracker {
  private events: UserEvent[] = [];
  private insights: UserInsight[] = [];

  // Track user events
  async trackEvent(event: Omit<UserEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: UserEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.events.push(fullEvent);

    // Store in localStorage for persistence
    try {
      const storedEvents = JSON.parse(localStorage.getItem('ajopay_analytics') || '[]');
      storedEvents.push(fullEvent);
      // Keep only last 100 events to prevent storage bloat
      const recentEvents = storedEvents.slice(-100);
      localStorage.setItem('ajopay_analytics', JSON.stringify(recentEvents));
    } catch (error) {
      console.warn('Failed to store analytics event:', error);
    }

    // Send to server (non-blocking)
    this.sendEventToServer(fullEvent).catch(console.error);
  }

  // Send events to server for analysis
  private async sendEventToServer(event: UserEvent): Promise<void> {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.warn('Failed to send analytics event to server:', error);
    }
  }

  // Generate insights based on user behavior
  generateInsights(userId: string): UserInsight[] {
    const userEvents = this.events.filter(e => e.userId === userId);
    const insights: UserInsight[] = [];

    // Savings Pattern Insight
    const savingsEvents = userEvents.filter(e => e.eventType === 'payment_completed');
    if (savingsEvents.length >= 3) {
      const amounts = savingsEvents.map(e => e.eventData.amount || 0);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const frequency = savingsEvents.length / 30; // events per day over 30 days
      
      insights.push({
        userId,
        insightType: 'savings_pattern',
        insightData: {
          averageAmount: avgAmount,
          frequency: frequency,
          totalSavings: amounts.reduce((a, b) => a + b, 0),
          consistency: this.calculateConsistency(savingsEvents),
        },
        confidence: Math.min(0.9, savingsEvents.length / 10),
        generatedAt: new Date(),
      });
    }

    // Usage Frequency Insight
    const appOpens = userEvents.filter(e => e.eventType === 'app_opened');
    if (appOpens.length >= 5) {
      const daysSinceFirst = (Date.now() - new Date(appOpens[0].timestamp).getTime()) / (1000 * 60 * 60 * 24);
      const usageFrequency = appOpens.length / Math.max(1, daysSinceFirst);
      
      insights.push({
        userId,
        insightType: 'usage_frequency',
        insightData: {
          dailyUsage: usageFrequency,
          totalSessions: appOpens.length,
          lastActive: appOpens[appOpens.length - 1]?.timestamp,
          engagementLevel: this.getEngagementLevel(usageFrequency),
        },
        confidence: Math.min(0.8, appOpens.length / 20),
        generatedAt: new Date(),
      });
    }

    // Payment Behavior Insight
    const paymentEvents = userEvents.filter(e => 
      e.eventType === 'payment_initiated' || e.eventType === 'payment_completed'
    );
    if (paymentEvents.length >= 2) {
      const completedPayments = paymentEvents.filter(e => e.eventType === 'payment_completed');
      const successRate = completedPayments.length / paymentEvents.length;
      
      insights.push({
        userId,
        insightType: 'payment_behavior',
        insightData: {
          successRate: successRate,
          totalAttempts: paymentEvents.length,
          completedPayments: completedPayments.length,
          averageAmount: this.getAveragePaymentAmount(completedPayments),
        },
        confidence: Math.min(0.7, paymentEvents.length / 5),
        generatedAt: new Date(),
      });
    }

    // Engagement Score
    const allUserEvents = userEvents.length;
    const uniqueDays = new Set(userEvents.map(e => 
      new Date(e.timestamp).toDateString()
    )).size;
    
    if (allUserEvents >= 10) {
      const engagementScore = this.calculateEngagementScore(userEvents);
      
      insights.push({
        userId,
        insightType: 'engagement_score',
        insightData: {
          score: engagementScore,
          totalEvents: allUserEvents,
          activeDays: uniqueDays,
          level: this.getEngagementLevel(engagementScore / 10),
        },
        confidence: Math.min(0.9, allUserEvents / 50),
        generatedAt: new Date(),
      });
    }

    this.insights.push(...insights);
    return insights;
  }

  // Helper methods
  private calculateConsistency(events: UserEvent[]): number {
    if (events.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < events.length; i++) {
      const interval = new Date(events[i].timestamp).getTime() - new Date(events[i-1].timestamp).getTime();
      intervals.push(interval);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const consistency = Math.max(0, 1 - (Math.sqrt(variance) / avgInterval));
    
    return Math.round(consistency * 100) / 100;
  }

  private getEngagementLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 0.7) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }

  private getAveragePaymentAmount(events: UserEvent[]): number {
    const amounts = events.map(e => e.eventData.amount || 0).filter(a => a > 0);
    return amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  }

  private calculateEngagementScore(events: UserEvent[]): number {
    const weights = {
      'app_opened': 1,
      'payment_initiated': 3,
      'payment_completed': 5,
      'savings_goal_set': 3,
      'feature_used': 2,
      'button_click': 0.5,
      'page_view': 0.3,
    };

    const score = events.reduce((total, event) => {
      return total + (weights[event.eventType] || 1);
    }, 0);

    return Math.round(score * 10) / 10;
  }

  // Get insights for a user
  getUserInsights(userId: string): UserInsight[] {
    return this.insights.filter(insight => insight.userId === userId);
  }

  // Get all events for a user
  getUserEvents(userId: string): UserEvent[] {
    return this.events.filter(event => event.userId === userId);
  }
}

// Export singleton instance
export const analytics = new AnalyticsTracker();

// Helper functions for easy tracking
export const trackEvent = (eventType: UserEvent['eventType'], eventData: Record<string, any>, userId?: string) => {
  if (typeof window === 'undefined') return;
  
  const sessionId = sessionStorage.getItem('ajopay_session_id') || 
    (() => {
      const id = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ajopay_session_id', id);
      return id;
    })();

  // Allow tracking for both authenticated and anonymous users

  analytics.trackEvent({
    userId: userId || 'anonymous',
    eventType,
    eventData,
    sessionId,
    userAgent: navigator.userAgent,
    page: window.location.pathname,
  });
};

export const trackPageView = (page: string, userId?: string) => {
  trackEvent('page_view', { page }, userId);
};

export const trackButtonClick = (buttonName: string, userId?: string) => {
  trackEvent('button_click', { buttonName }, userId);
};

export const trackPaymentInitiated = (amount: number, userId?: string) => {
  trackEvent('payment_initiated', { amount }, userId);
};

export const trackPaymentCompleted = (amount: number, reference: string, userId?: string) => {
  trackEvent('payment_completed', { amount, reference }, userId);
};

export const trackSavingsGoalSet = (goalAmount: number, targetDate: string, userId?: string) => {
  trackEvent('savings_goal_set', { goalAmount, targetDate }, userId);
};

export const trackFeatureUsed = (featureName: string, userId?: string) => {
  trackEvent('feature_used', { featureName }, userId);
};

export const trackAppOpened = (userId?: string) => {
  trackEvent('app_opened', {}, userId);
};
