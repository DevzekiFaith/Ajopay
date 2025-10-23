"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trophy, Star, Target, Gift, Crown, Zap, Award, TrendingUp } from "lucide-react";
import { AjoPaySpinner } from "@/components/ui/AjoPaySpinner";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalSaved: number;
  streakDays: number;
  goalsCompleted: number;
  badges: string[];
  rewards: Reward[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  earned: boolean;
  earnedDate?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'badge' | 'xp' | 'cashback' | 'discount';
  value: number;
  claimed: boolean;
  earnedDate: string;
}

const badges: Badge[] = [
  {
    id: 'first_save',
    name: 'First Steps',
    description: 'Made your first savings contribution',
    icon: '🎯',
    requirement: 'Save any amount',
    earned: false,
    rarity: 'common'
  },
  {
    id: 'week_streak',
    name: 'Week Warrior',
    description: 'Saved for 7 consecutive days',
    icon: '🔥',
    requirement: '7-day streak',
    earned: false,
    rarity: 'common'
  },
  {
    id: 'month_streak',
    name: 'Monthly Master',
    description: 'Saved for 30 consecutive days',
    icon: '⚡',
    requirement: '30-day streak',
    earned: false,
    rarity: 'rare'
  },
  {
    id: 'goal_achiever',
    name: 'Goal Crusher',
    description: 'Completed your first savings goal',
    icon: '🏆',
    requirement: 'Complete 1 goal',
    earned: false,
    rarity: 'rare'
  },
  {
    id: 'big_saver',
    name: 'Big Saver',
    description: 'Saved ₦100,000 in total',
    icon: '💰',
    requirement: 'Save ₦100,000',
    earned: false,
    rarity: 'epic'
  },
  {
    id: 'legend',
    name: 'Savings Legend',
    description: 'Saved for 100 consecutive days',
    icon: '👑',
    requirement: '100-day streak',
    earned: false,
    rarity: 'legendary'
  }
];

const levels = [
  { level: 1, xpRequired: 0, title: "Savings Newbie", icon: "🌱" },
  { level: 2, xpRequired: 100, title: "Penny Pincher", icon: "🪙" },
  { level: 3, xpRequired: 250, title: "Smart Saver", icon: "🧠" },
  { level: 4, xpRequired: 500, title: "Goal Getter", icon: "🎯" },
  { level: 5, xpRequired: 1000, title: "Savings Pro", icon: "⭐" },
  { level: 6, xpRequired: 2000, title: "Money Master", icon: "💎" },
  { level: 7, xpRequired: 4000, title: "Wealth Builder", icon: "🏗️" },
  { level: 8, xpRequired: 8000, title: "Financial Guru", icon: "🧙‍♂️" },
  { level: 9, xpRequired: 15000, title: "Savings Legend", icon: "👑" },
  { level: 10, xpRequired: 30000, title: "Ultimate Saver", icon: "🚀" }
];

export function Gamification() {
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalSaved: 0,
    streakDays: 0,
    goalsCompleted: 0,
    badges: [],
    rewards: []
  });
  const [userBadges, setUserBadges] = useState<Badge[]>(badges);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [celebratingLevel, setCelebratingLevel] = useState<number | null>(null);
  const [celebratingBadge, setCelebratingBadge] = useState<Badge | null>(null);
  const [activeTab, setActiveTab] = useState('badges');
  
  const supabase = getSupabaseBrowserClient();
  const { isConnected, lastUpdate, triggerUpdate } = useRealtimeUpdates(currentUserId || undefined);

  // Load user data and stats
  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      // Load user stats from contributions
      const { data: contributions } = await supabase
        .from("contributions")
        .select("amount_kobo, contributed_at")
        .eq("user_id", user.id);

      if (contributions) {
        const totalSaved = contributions.reduce((sum: number, c: any) => sum + (c.amount_kobo || 0), 0) / 100;
        const uniqueDays = new Set(contributions.map((c: any) => c.contributed_at)).size;
        
        // Calculate level and XP based on total saved
        const level = Math.floor(totalSaved / 1000) + 1;
        const xp = totalSaved % 1000;
        const xpToNextLevel = 1000 - xp;

        // Calculate streak
        const today = new Date().toISOString().slice(0, 10);
        const dates = contributions.map((c: any) => c.contributed_at).sort().reverse();
        let streak = 0;
        let currentDate = new Date(today);
        
        for (const date of dates) {
          if (date === currentDate.toISOString().slice(0, 10)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }

        // Check for earned badges
        const earnedBadges = [];
        if (totalSaved >= 200) earnedBadges.push('first_save');
        if (streak >= 7) earnedBadges.push('week_warrior');
        if (streak >= 30) earnedBadges.push('month_master');
        if (totalSaved >= 10000) earnedBadges.push('savings_champion');
        if (level >= 5) earnedBadges.push('level_5');

        setUserStats({
          level,
          xp,
          xpToNextLevel,
          totalSaved,
          streakDays: streak,
          goalsCompleted: 0,
          badges: earnedBadges,
          rewards: []
        });

        // Check for new achievements
        checkForNewAchievements(level, streak, totalSaved, earnedBadges);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewAchievements = (level: number, streak: number, totalSaved: number, badges: string[]) => {
    // Check for level up
    if (level > userStats.level) {
      triggerUpdate('level_up', { newLevel: level });
    }

    // Check for new badges
    const newBadges = badges.filter(badge => !userStats.badges.includes(badge));
    newBadges.forEach(badgeId => {
      const badge = getBadgeInfo(badgeId);
      if (badge) {
        triggerUpdate('badge_earned', { badgeName: badge.name, badgeId });
      }
    });
  };

  const getBadgeInfo = (badgeId: string) => {
    const badgeMap: Record<string, { name: string; description: string; icon: string }> = {
      first_save: { name: 'First Steps', description: 'Made your first savings contribution', icon: '🎯' },
      week_warrior: { name: 'Week Warrior', description: '7-day savings streak', icon: '🔥' },
      month_master: { name: 'Month Master', description: '30-day savings streak', icon: '👑' },
      savings_champion: { name: 'Savings Champion', description: 'Saved ₦10,000+', icon: '🏆' },
      level_5: { name: 'Rising Star', description: 'Reached level 5', icon: '⭐' }
    };
    return badgeMap[badgeId];
  };

  // Reload data when real-time updates occur
  useEffect(() => {
    loadUserData();
  }, [lastUpdate]);

  useEffect(() => {
    loadUserData();
  }, []);

  // Add transaction listeners for real-time achievements
  useEffect(() => {
    if (!currentUserId) return;

    // Listen to transaction changes for real-time achievements
    const transactionsChannel = supabase
      .channel("user_transactions_gamification")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload: any) => {
          console.log('New transaction detected for achievements:', payload.new);
          const transaction = payload.new;
          
          // Check for achievements based on transaction
          await checkTransactionAchievements(transaction);
          
          // Reload user data to update stats
          setTimeout(() => loadUserData(), 1000);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "savings_goals",
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload: any) => {
          console.log('New savings goal detected:', payload.new);
          // Check for goal-related achievements
          setTimeout(() => checkAndAwardBadges(), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
    };
  }, [currentUserId, supabase]);

  const claimReward = async (rewardId: string) => {
    toast.success("Reward claimed! 🎉", {
      description: "Your reward has been added to your account",
    });
    
    setUserStats(prev => ({
      ...prev,
      rewards: prev.rewards.map(r => 
        r.id === rewardId ? { ...r, claimed: true } : r
      )
    }));
  };

  const addXP = (amount: number, reason: string) => {
    const newXP = userStats.xp + amount;
    const currentLevel = getCurrentLevel(newXP);
    const nextLevel = levels.find(l => l.level === currentLevel + 1);
    
    const newStats = {
      ...userStats,
      xp: newXP,
      level: currentLevel,
      xpToNextLevel: nextLevel ? nextLevel.xpRequired - newXP : 0
    };

    if (currentLevel > userStats.level) {
      setCelebratingLevel(currentLevel);
      toast.success(`🎉 Level Up! You're now ${levels.find(l => l.level === currentLevel)?.title}!`);
    }

    setUserStats(newStats);
    toast.success(`+${amount} XP for ${reason}!`);
  };

  const getCurrentLevel = (xp: number): number => {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (xp >= levels[i].xpRequired) {
        return levels[i].level;
      }
    }
    return 1;
  };

  // Check achievements based on transaction
  const checkTransactionAchievements = async (transaction: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current user stats
      const { data: contributions } = await supabase
        .from('contributions')
        .select('amount_kobo, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!contributions) return;

      const totalSaved = contributions.reduce((sum: number, c: any) => sum + (c.amount_kobo / 100), 0);
      
      // Calculate streak
      let streak = 0;
      const uniqueDays = new Set<string>();
      contributions.forEach((c: any) => {
        const day = new Date(c.created_at).toDateString();
        uniqueDays.add(day);
      });
      
      const sortedDays = Array.from(uniqueDays).sort().reverse();
      for (let i = 0; i < sortedDays.length; i++) {
        const day = new Date(sortedDays[i]);
        const expectedDay = new Date(Date.now() - (i * 86400000));
        if (day.toDateString() === expectedDay.toDateString()) {
          streak++;
        } else {
          break;
        }
      }

      // Check for new achievements
      const newAchievements = [];
      
      // First save achievement
      if (totalSaved > 0 && !userBadges.find(b => b.id === 'first_save')?.earned) {
        newAchievements.push({
          id: 'first_save',
          name: 'First Steps',
          icon: '🎯',
          message: 'Made your first savings contribution!'
        });
      }

      // Week warrior achievement
      if (streak >= 7 && !userBadges.find(b => b.id === 'week_streak')?.earned) {
        newAchievements.push({
          id: 'week_streak',
          name: 'Week Warrior',
          icon: '🔥',
          message: '7-day savings streak achieved!'
        });
      }

      // Month master achievement
      if (streak >= 30 && !userBadges.find(b => b.id === 'month_streak')?.earned) {
        newAchievements.push({
          id: 'month_streak',
          name: 'Month Master',
          icon: '👑',
          message: '30-day savings streak achieved!'
        });
      }

      // Big saver achievement
      if (totalSaved >= 100000 && !userBadges.find(b => b.id === 'big_saver')?.earned) {
        newAchievements.push({
          id: 'big_saver',
          name: 'Big Saver',
          icon: '🏆',
          message: 'Saved ₦100,000+! You\'re a savings legend!'
        });
      }

      // Legend achievement
      if (streak >= 100 && !userBadges.find(b => b.id === 'legend')?.earned) {
        newAchievements.push({
          id: 'legend',
          name: 'Legend',
          icon: '👑',
          message: '100-day savings streak! You\'re a legend!'
        });
      }

      // Trigger achievements
      newAchievements.forEach(achievement => {
        triggerUpdate('badge_earned', { 
          badgeName: achievement.name, 
          badgeId: achievement.id,
          message: achievement.message 
        });
      });

      // Trigger streak update if streak changed
      if (streak !== userStats.streakDays) {
        triggerUpdate('streak_updated', {
          streakDays: streak,
          previousStreak: userStats.streakDays
        });
      }

      // Check for level up
      const newLevel = Math.floor(totalSaved / 2000) + 1;
      if (newLevel > userStats.level) {
        triggerUpdate('level_up', { 
          newLevel: newLevel,
          totalSaved: totalSaved 
        });
      }

      // Check for streak achievements
      if (streak >= 3 && !userBadges.find(b => b.id === 'streak_starter')?.earned) {
        newAchievements.push({
          id: 'streak_starter',
          name: 'Streak Starter',
          icon: '🔥',
          message: '3-day savings streak! You\'re on fire!'
        });
      }

      if (streak >= 14 && !userBadges.find(b => b.id === 'streak_master')?.earned) {
        newAchievements.push({
          id: 'streak_master',
          name: 'Streak Master',
          icon: '⚡',
          message: '14-day savings streak! You\'re unstoppable!'
        });
      }

      // Check for savings amount achievements
      if (totalSaved >= 5000 && !userBadges.find(b => b.id === 'savings_starter')?.earned) {
        newAchievements.push({
          id: 'savings_starter',
          name: 'Savings Starter',
          icon: '💎',
          message: 'Saved ₦5,000+! Great start!'
        });
      }

      if (totalSaved >= 25000 && !userBadges.find(b => b.id === 'savings_pro')?.earned) {
        newAchievements.push({
          id: 'savings_pro',
          name: 'Savings Pro',
          icon: '💎',
          message: 'Saved ₦25,000+! You\'re a savings pro!'
        });
      }

      if (totalSaved >= 50000 && !userBadges.find(b => b.id === 'savings_expert')?.earned) {
        newAchievements.push({
          id: 'savings_expert',
          name: 'Savings Expert',
          icon: '💎',
          message: 'Saved ₦50,000+! You\'re a savings expert!'
        });
      }

    } catch (error) {
      console.error('Error checking transaction achievements:', error);
    }
  };

  const checkAndAwardBadges = async () => {
    const updatedBadges = userBadges.map(badge => {
      if (!badge.earned) {
        let shouldEarn = false;

        switch (badge.id) {
          case 'first_save':
            shouldEarn = userStats.totalSaved > 0;
            break;
          case 'week_streak':
            shouldEarn = userStats.streakDays >= 7;
            break;
          case 'month_streak':
            shouldEarn = userStats.streakDays >= 30;
            break;
          case 'goal_achiever':
            shouldEarn = userStats.goalsCompleted >= 1;
            break;
          case 'big_saver':
            shouldEarn = userStats.totalSaved >= 100000;
            break;
          case 'legend':
            shouldEarn = userStats.streakDays >= 100;
            break;
        }

        if (shouldEarn) {
          const earnedBadge = {
            ...badge,
            earned: true,
            earnedDate: new Date().toISOString()
          };
          setCelebratingBadge(earnedBadge);
          toast.success(`🏆 Badge Earned: ${badge.name}!`);
          addXP(50, `earning ${badge.name} badge`);
          
          // Award real money commission for badge
          awardBadgeCommission(badge);
          
          return earnedBadge;
        }
      }
      return badge;
    });

    setUserBadges(updatedBadges);
  };

  const awardBadgeCommission = async (badge: Badge) => {
    try {
      const response = await fetch('/api/commissions/badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          badgeName: badge.name,
          badgeRarity: badge.rarity
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`💰 Earned ${data.amount} for earning ${badge.name} badge!`);
      }
    } catch (error) {
      console.error('Error awarding badge commission:', error);
    }
  };

  const simulateActivity = (type: 'save' | 'streak' | 'goal') => {
    let newStats = { ...userStats };

    switch (type) {
      case 'save':
        newStats.totalSaved += 1000;
        addXP(10, "saving money");
        break;
      case 'streak':
        newStats.streakDays += 1;
        addXP(5, "maintaining streak");
        break;
      case 'goal':
        newStats.goalsCompleted += 1;
        addXP(100, "completing a goal");
        break;
    }

    setUserStats(newStats);
    setTimeout(() => checkAndAwardBadges(), 500);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500/50 bg-gray-500/10';
      case 'rare': return 'border-blue-500/50 bg-blue-500/10';
      case 'epic': return 'border-purple-500/50 bg-purple-500/10';
      case 'legendary': return 'border-yellow-500/50 bg-yellow-500/10';
      default: return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const getLevelTitle = (level: number): string => {
    const levels = [
      { level: 1, title: "Savings Starter" },
      { level: 2, title: "Penny Pincher" },
      { level: 3, title: "Budget Boss" },
      { level: 4, title: "Savings Superstar" },
      { level: 5, title: "Financial Guru" },
      { level: 6, title: "Wealth Wizard" },
      { level: 7, title: "Money Master" },
      { level: 8, title: "Savings Legend" },
      { level: 9, title: "Financial Phoenix" },
      { level: 10, title: "Thrift King/Queen" }
    ];
    
    return levels.find(l => l.level === level)?.title || "Savings Champion";
  };

  const getXPForNextLevel = (level: number): number => {
    return level * 1000;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <AjoPaySpinner size="md" showText text="Loading gamification..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 dark:from-slate-900 dark:via-emerald-900 dark:to-teal-900 min-h-screen">
      {/* Header Section with Neuomorphic Design */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="relative inline-block">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-3xl blur-2xl opacity-20"
            animate={{ scale: [1, 1.1] }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
          <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#0f172a,-20px_-20px_60px_#334155]">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              🎮 Gamification
            </h1>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Level up your savings journey with achievements and rewards
        </p>
      </motion.div>

      {/* Stats Overview - Neuomorphic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Level Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="group relative"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-600/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"
            animate={{ scale: [1, 1.05] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
          <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-8 shadow-[25px_25px_50px_#d1d9e6,-25px_-25px_50px_#ffffff] dark:shadow-[25px_25px_50px_#0f172a,-25px_-25px_50px_#334155] hover:shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:hover:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] transition-all duration-700 border border-white/30 dark:border-slate-700/30">
            
            <div className="text-center space-y-4">
              <motion.div
                whileHover={{ scale: 1.2, rotate: 15 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-20 h-20 mx-auto bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center text-4xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155]"
              >
                🏆
              </motion.div>
              
              <div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">Level {userStats.level}</h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium">{getLevelTitle(userStats.level)}</p>
              </div>

              {/* XP Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-600 dark:text-slate-400">XP Progress</span>
                  <span className="text-slate-700 dark:text-slate-300">{userStats.xp}/{userStats.xp + userStats.xpToNextLevel} XP</span>
                </div>
                <div className="relative">
                  <div className="h-4 bg-slate-200/60 dark:bg-slate-700/60 rounded-2xl shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] dark:shadow-[inset_8px_8px_16px_#0f172a,inset_-8px_-8px_16px_#334155] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(userStats.xp / (userStats.xp + userStats.xpToNextLevel)) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#334155] relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Total Savings Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="group relative"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-600/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"
            animate={{ scale: [1, 1.05] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
          <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-8 shadow-[25px_25px_50px_#d1d9e6,-25px_-25px_50px_#ffffff] dark:shadow-[25px_25px_50px_#0f172a,-25px_-25px_50px_#334155] hover:shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:hover:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] transition-all duration-700 border border-white/30 dark:border-slate-700/30">
            
            <div className="text-center space-y-4">
              <motion.div
                whileHover={{ scale: 1.2, rotate: -15 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155]"
              >
                💰
              </motion.div>
              
              <div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">₦{userStats.totalSaved.toLocaleString()}</h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Total Savings</p>
              </div>

              <div className="p-4 bg-slate-100/40 dark:bg-slate-700/40 rounded-2xl shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#0f172a,inset_-6px_-6px_12px_#334155]">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  +₦{(userStats.totalSaved * 0.1).toLocaleString()} this month
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="group relative"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-600/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"
            animate={{ scale: [1, 1.05] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
          <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-8 shadow-[25px_25px_50px_#d1d9e6,-25px_-25px_50px_#ffffff] dark:shadow-[25px_25px_50px_#0f172a,-25px_-25px_50px_#334155] hover:shadow-[30px_30px_60px_#d1d9e6,-30px_-30px_60px_#ffffff] dark:hover:shadow-[30px_30px_60px_#0f172a,-30px_-30px_60px_#334155] transition-all duration-700 border border-white/30 dark:border-slate-700/30">
            
            <div className="text-center space-y-4">
              <motion.div
                whileHover={{ scale: 1.2 }}
                animate={{ rotate: [0, 5] }}
                transition={{ 
                  duration: 0.5, 
                  repeat: Infinity, 
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
                className="w-20 h-20 mx-auto bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl flex items-center justify-center text-4xl shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] dark:shadow-[15px_15px_30px_#0f172a,-15px_-15px_30px_#334155]"
              >
                🔥
              </motion.div>
              
              <div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">{userStats.streakDays} Days</h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Savings Streak</p>
              </div>

              <div className="p-4 bg-slate-100/40 dark:bg-slate-700/40 rounded-2xl shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_6px_6px_12px_#0f172a,inset_-6px_-6px_12px_#334155]">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Keep it up! 🚀
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Achievements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">🏅 Achievements</h2>
          <p className="text-slate-600 dark:text-slate-300">Unlock badges as you reach milestones</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {userBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1, y: -5 }}
              className={`group relative p-6 rounded-3xl transition-all duration-500 ${
                badge.earned
                  ? 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] dark:shadow-[20px_20px_40px_#0f172a,-20px_-20px_40px_#334155] border border-white/30 dark:border-slate-700/30'
                  : 'bg-slate-200/40 dark:bg-slate-700/40 backdrop-blur-xl shadow-[inset_10px_10px_20px_#d1d9e6,inset_-10px_-10px_20px_#ffffff] dark:shadow-[inset_10px_10px_20px_#0f172a,inset_-10px_-10px_20px_#334155] border border-slate-300/30 dark:border-slate-600/30'
              }`}
            >
              {badge.earned && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"
                  animate={{ scale: [1, 1.05] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
                />
              )}
              
              <div className="relative text-center space-y-3">
                <motion.div
                  whileHover={badge.earned ? { rotate: 360 } : {}}
                  transition={{ duration: 0.6 }}
                  className={`text-4xl ${badge.earned ? '' : 'grayscale opacity-50'}`}
                >
                  {badge.icon}
                </motion.div>
                
                <div>
                  <h3 className={`font-bold text-sm ${
                    badge.earned 
                      ? 'text-slate-800 dark:text-slate-200' 
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {badge.name}
                  </h3>
                  <p className={`text-xs ${
                    badge.earned 
                      ? 'text-slate-600 dark:text-slate-400' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {badge.requirement}
                  </p>
                </div>

                {badge.earned && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#334155]"
                  >
                    <span className="text-white text-xs">✓</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">📈 Recent Activity</h2>
          <p className="text-slate-600 dark:text-slate-300">Your latest savings milestones</p>
        </div>

        <div className="space-y-4">
          {/* Recent Activity Items */}
        </div>
      </motion.div>
    </div>
  );
}
