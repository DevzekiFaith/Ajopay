// Smart notification system based on user patterns
import { analytics, UserInsight } from "./analytics";

export interface NotificationRule {
  id: string;
  userId: string;
  type: 'savings_reminder' | 'goal_progress' | 'low_activity' | 'payment_success' | 'milestone_reached';
  condition: (insights: UserInsight[], userEvents: any[]) => boolean;
  message: (insights: UserInsight[], userEvents: any[]) => string;
  priority: 'low' | 'medium' | 'high';
  cooldown: number; // hours
  lastTriggered?: Date;
}

export interface SmartNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  data?: Record<string, any>;
  scheduledFor: Date;
  sent: boolean;
  createdAt: Date;
}

class SmartNotificationEngine {
  private rules: NotificationRule[] = [];
  private notifications: SmartNotification[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Savings Reminder Rule
    this.addRule({
      id: 'savings_reminder_weekly',
      userId: 'all',
      type: 'savings_reminder',
      condition: (insights, events) => {
        const savingsInsight = insights.find(i => i.insightType === 'savings_pattern');
        if (!savingsInsight) return false;
        
        const lastSavingsEvent = events
          .filter(e => e.eventType === 'payment_completed')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        if (!lastSavingsEvent) return false;
        
        const daysSinceLastSavings = (Date.now() - new Date(lastSavingsEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        const expectedFrequency = 1 / (savingsInsight.insightData.frequency || 1); // days between savings
        
        return daysSinceLastSavings > expectedFrequency * 1.5; // 50% longer than usual
      },
      message: (insights, events) => {
        const savingsInsight = insights.find(i => i.insightType === 'savings_pattern');
        const avgAmount = savingsInsight?.insightData.averageAmount || 0;
        return `It's been a while since your last savings! Your average contribution is ₦${avgAmount.toLocaleString()}. Ready to save again? 💰`;
      },
      priority: 'medium',
      cooldown: 24, // 24 hours
    });

    // Goal Progress Rule
    this.addRule({
      id: 'goal_progress_check',
      userId: 'all',
      type: 'goal_progress',
      condition: (insights, events) => {
        const goalEvents = events.filter(e => e.eventType === 'savings_goal_set');
        if (goalEvents.length === 0) return false;
        
        const latestGoal = goalEvents[goalEvents.length - 1];
        const goalAmount = latestGoal.eventData.goalAmount || 0;
        const targetDate = new Date(latestGoal.eventData.targetDate);
        const daysRemaining = (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        
        return daysRemaining > 0 && daysRemaining <= 7; // 7 days or less remaining
      },
      message: (insights, events) => {
        const goalEvents = events.filter(e => e.eventType === 'savings_goal_set');
        const latestGoal = goalEvents[goalEvents.length - 1];
        const goalAmount = latestGoal.eventData.goalAmount || 0;
        const targetDate = new Date(latestGoal.eventData.targetDate);
        const daysRemaining = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        return `Your savings goal of ₦${goalAmount.toLocaleString()} is due in ${daysRemaining} days! Keep up the great work! 🎯`;
      },
      priority: 'high',
      cooldown: 12, // 12 hours
    });

    // Low Activity Rule
    this.addRule({
      id: 'low_activity_reminder',
      userId: 'all',
      type: 'low_activity',
      condition: (insights, events) => {
        const usageInsight = insights.find(i => i.insightType === 'usage_frequency');
        if (!usageInsight) return false;
        
        const lastAppOpen = events
          .filter(e => e.eventType === 'app_opened')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        if (!lastAppOpen) return false;
        
        const daysSinceLastOpen = (Date.now() - new Date(lastAppOpen.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        const expectedFrequency = 1 / (usageInsight.insightData.dailyUsage || 1);
        
        return daysSinceLastOpen > expectedFrequency * 3; // 3x longer than usual
      },
      message: (insights, events) => {
        return `We miss you! Your savings journey is waiting. Check your progress and keep building your financial future! 🌟`;
      },
      priority: 'low',
      cooldown: 48, // 48 hours
    });

    // Milestone Reached Rule
    this.addRule({
      id: 'milestone_reached',
      userId: 'all',
      type: 'milestone_reached',
      condition: (insights, events) => {
        const savingsInsight = insights.find(i => i.insightType === 'savings_pattern');
        if (!savingsInsight) return false;
        
        const totalSavings = savingsInsight.insightData.totalSavings || 0;
        const milestones = [10000, 25000, 50000, 100000, 250000, 500000]; // Naira milestones
        
        const reachedMilestone = milestones.find(milestone => 
          totalSavings >= milestone && totalSavings < milestone * 1.1 // Within 10% of milestone
        );
        
        return !!reachedMilestone;
      },
      message: (insights, events) => {
        const savingsInsight = insights.find(i => i.insightType === 'savings_pattern');
        const totalSavings = savingsInsight?.insightData.totalSavings || 0;
        return `🎉 Congratulations! You've saved ₦${totalSavings.toLocaleString()}! You're building an amazing financial future!`;
      },
      priority: 'high',
      cooldown: 168, // 1 week
    });
  }

  addRule(rule: NotificationRule) {
    this.rules.push(rule);
  }

  // Generate smart notifications for a user
  generateNotifications(userId: string): SmartNotification[] {
    const userInsights = analytics.getUserInsights(userId);
    const userEvents = analytics.getUserEvents(userId);
    const newNotifications: SmartNotification[] = [];

    // Check each rule
    for (const rule of this.rules) {
      if (rule.userId !== 'all' && rule.userId !== userId) continue;
      
      // Check cooldown
      if (rule.lastTriggered) {
        const hoursSinceLastTrigger = (Date.now() - rule.lastTriggered.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastTrigger < rule.cooldown) continue;
      }

      // Check if condition is met
      if (rule.condition(userInsights, userEvents)) {
        const message = rule.message(userInsights, userEvents);
        
        const notification: SmartNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          type: rule.type,
          title: this.getNotificationTitle(rule.type),
          message,
          priority: rule.priority,
          data: {
            ruleId: rule.id,
            insights: userInsights,
            eventCount: userEvents.length,
          },
          scheduledFor: new Date(),
          sent: false,
          createdAt: new Date(),
        };

        newNotifications.push(notification);
        rule.lastTriggered = new Date();
      }
    }

    this.notifications.push(...newNotifications);
    return newNotifications;
  }

  private getNotificationTitle(type: string): string {
    const titles = {
      'savings_reminder': '💰 Savings Reminder',
      'goal_progress': '🎯 Goal Progress Update',
      'low_activity': '🌟 We Miss You!',
      'payment_success': '✅ Payment Successful',
      'milestone_reached': '🎉 Milestone Achieved!',
    };
    return titles[type as keyof typeof titles] || '📱 Ajopay Notification';
  }

  // Get pending notifications for a user
  getPendingNotifications(userId: string): SmartNotification[] {
    return this.notifications.filter(n => 
      n.userId === userId && 
      !n.sent && 
      new Date(n.scheduledFor) <= new Date()
    );
  }

  // Mark notification as sent
  markAsSent(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.sent = true;
    }
  }

  // Get notification history for a user
  getNotificationHistory(userId: string, limit: number = 20): SmartNotification[] {
    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Schedule a custom notification
  scheduleNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    scheduledFor: Date,
    priority: 'low' | 'medium' | 'high' = 'medium',
    data?: Record<string, any>
  ): SmartNotification {
    const notification: SmartNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      priority,
      data,
      scheduledFor,
      sent: false,
      createdAt: new Date(),
    };

    this.notifications.push(notification);
    return notification;
  }
}

// Export singleton instance
export const smartNotifications = new SmartNotificationEngine();

// Helper functions
export const generateUserNotifications = (userId: string): SmartNotification[] => {
  return smartNotifications.generateNotifications(userId);
};

export const getPendingNotifications = (userId: string): SmartNotification[] => {
  return smartNotifications.getPendingNotifications(userId);
};

export const markNotificationAsSent = (notificationId: string): void => {
  smartNotifications.markAsSent(notificationId);
};

export const scheduleCustomNotification = (
  userId: string,
  type: string,
  title: string,
  message: string,
  scheduledFor: Date,
  priority: 'low' | 'medium' | 'high' = 'medium',
  data?: Record<string, any>
): SmartNotification => {
  return smartNotifications.scheduleNotification(
    userId,
    type,
    title,
    message,
    scheduledFor,
    priority,
    data
  );
};


