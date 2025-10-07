"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Coins, 
  TrendingUp, 
  Gift, 
  Users, 
  Target, 
  Award, 
  Clock, 
  CheckCircle,
  Zap,
  Star,
  Trophy,
  DollarSign
} from "lucide-react";

interface Commission {
  id: string;
  commission_type: string;
  amount_kobo: number;
  description: string;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  source_type?: string;
}

interface Reward {
  id: string;
  reward_type: string;
  amount_kobo: number;
  title: string;
  description?: string;
  expires_at?: string;
  is_claimed: boolean;
  created_at: string;
}

interface CommissionSummary {
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
  byType: Record<string, number>;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  totalEarned: number;
  referralCode: string;
}

export function UserCommissionDashboard() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [summary, setSummary] = useState<CommissionSummary>({
    totalEarned: 0,
    totalPaid: 0,
    totalPending: 0,
    byType: {}
  });
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    totalEarned: 0,
    referralCode: ''
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');
  const [withdrawing, setWithdrawing] = useState(false);

  const loadCommissionData = async () => {
    try {
      // Load commissions
      const commissionsRes = await fetch('/api/commissions/list');
      const commissionsData = await commissionsRes.json();
      
      if (commissionsRes.ok) {
        setCommissions(commissionsData.commissions || []);
        setSummary(commissionsData.summary || summary);
      }

      // Load rewards
      const rewardsRes = await fetch('/api/commissions/rewards');
      const rewardsData = await rewardsRes.json();
      
      if (rewardsRes.ok) {
        setRewards(rewardsData.rewards || []);
      }

      // Load referral stats
      const referralRes = await fetch('/api/commissions/referral');
      const referralData = await referralRes.json();
      
      if (referralRes.ok) {
        setReferralStats(referralData);
      }

    } catch (error) {
      console.error('Error loading commission data:', error);
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const handleDailyCheckin = async () => {
    try {
      const response = await fetch('/api/commissions/daily-checkin', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        loadCommissionData(); // Refresh data
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Daily check-in error:', error);
      toast.error('Failed to check in');
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    try {
      const response = await fetch('/api/commissions/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        loadCommissionData(); // Refresh data
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Claim reward error:', error);
      toast.error('Failed to claim reward');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }

    const availableAmount = (summary.totalEarned - summary.totalPaid) / 100;
    if (parseFloat(withdrawAmount) > availableAmount) {
      toast.error('Insufficient balance for withdrawal');
      return;
    }

    setWithdrawing(true);
    try {
      const response = await fetch('/api/commissions/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          method: withdrawMethod,
          accountDetails: {
            // In production, this would be user's saved account details
            accountNumber: '1234567890',
            bankName: 'Access Bank',
            accountName: 'John Doe'
          }
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        loadCommissionData(); // Refresh data
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralStats.referralCode);
    toast.success('Referral code copied to clipboard!');
  };

  const formatAmount = (kobo: number) => {
    return `₦${(kobo / 100).toLocaleString()}`;
  };

  const getCommissionIcon = (type: string) => {
    switch (type) {
      case 'daily_checkin': return <Clock className="w-4 h-4" />;
      case 'save_activity': return <DollarSign className="w-4 h-4" />;
      case 'streak_milestone': return <Zap className="w-4 h-4" />;
      case 'goal_complete': return <Target className="w-4 h-4" />;
      case 'badge_earned': return <Award className="w-4 h-4" />;
      case 'referral_bonus': return <Users className="w-4 h-4" />;
      default: return <Coins className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    loadCommissionData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          💰 Commission Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Earn real money by using AjoPay! Check in daily, complete goals, and refer friends.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Earned</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {formatAmount(summary.totalEarned)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Available</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {formatAmount(summary.totalEarned - summary.totalPaid)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-full">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <Button 
                onClick={() => setShowWithdrawModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={summary.totalEarned - summary.totalPaid <= 0}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Withdraw Now
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Paid Out</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {formatAmount(summary.totalPaid)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-full">
                  <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Daily Check-in */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                  Daily Check-in Bonus
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Earn ₦50-₦500 daily just for checking in!
                </p>
              </div>
              <Button 
                onClick={handleDailyCheckin}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                <Star className="w-4 h-4 mr-2" />
                Check In Today
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commission Types Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Earnings by Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(summary.byType).map(([type, amount]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCommissionIcon(type)}
                        <span className="text-sm font-medium capitalize">
                          {type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="font-semibold text-green-600">
                        {formatAmount(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleDailyCheckin}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Daily Check-in
                </Button>
                <Button 
                  onClick={copyReferralCode}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Copy Referral Code
                </Button>
                <Button 
                  onClick={() => setActiveTab('rewards')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  View Rewards
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {commissions.slice(0, 10).map((commission, index) => (
                    <motion.div
                      key={commission.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getCommissionIcon(commission.commission_type)}
                        <div>
                          <p className="font-medium">{commission.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(commission.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatAmount(commission.amount_kobo)}
                        </p>
                        <Badge className={getStatusColor(commission.status)}>
                          {commission.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Available Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rewards.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No rewards available at the moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {rewards.map((reward, index) => (
                      <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700"
                      >
                        <div>
                          <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                            {reward.title}
                          </h4>
                          <p className="text-sm text-purple-600 dark:text-purple-400">
                            {reward.description}
                          </p>
                          {reward.expires_at && (
                            <p className="text-xs text-gray-500">
                              Expires: {new Date(reward.expires_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                            {formatAmount(reward.amount_kobo)}
                          </p>
                          <Button
                            onClick={() => handleClaimReward(reward.id)}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Claim
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Referral Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {referralStats.totalReferrals}
                  </p>
                  <p className="text-sm text-gray-500">Total Referrals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(referralStats.totalEarned)}
                  </p>
                  <p className="text-sm text-gray-500">Earned from Referrals</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Referral Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                  <p className="text-2xl font-mono font-bold text-orange-600">
                    {referralStats.referralCode}
                  </p>
                </div>
                <Button 
                  onClick={copyReferralCode}
                  className="w-full"
                >
                  Copy Referral Code
                </Button>
                <p className="text-sm text-gray-500 text-center">
                  Share this code with friends to earn ₦500 for each successful referral!
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Withdraw Commission
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available Balance
                </label>
                <div className="text-2xl font-bold text-green-600">
                  {formatAmount(summary.totalEarned - summary.totalPaid)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Withdrawal Amount (₦)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  min="100"
                  max={(summary.totalEarned - summary.totalPaid) / 100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Withdrawal Method
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="bank_transfer">Bank Transfer (1-3 days)</option>
                  <option value="mobile_money">Mobile Money (Instant)</option>
                  <option value="wallet">AjoPay Wallet (Instant)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowWithdrawModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {withdrawing ? 'Processing...' : 'Withdraw'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
