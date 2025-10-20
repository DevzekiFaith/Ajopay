"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Send, 
  Download, 
  Upload,
  CreditCard,
  DollarSign,
  Activity,
  RefreshCw,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface WalletStats {
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  today: {
    deposits: number;
    withdrawals: number;
    sent: number;
    received: number;
  };
  week: {
    deposits: number;
    withdrawals: number;
    sent: number;
    received: number;
  };
  month: {
    deposits: number;
    withdrawals: number;
    sent: number;
    received: number;
  };
}

interface WalletDashboardProps {
  userId: string;
  onActionClick: (action: string) => void;
  className?: string;
}

export function WalletDashboard({ 
  userId, 
  onActionClick,
  className = "" 
}: WalletDashboardProps) {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletStats = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/wallet/balance');
      const data = await response.json();
      
      if (data.success) {
        setStats(data);
      } else {
        toast.error('Failed to load wallet stats');
      }
    } catch (error) {
      console.error('Error fetching wallet stats:', error);
      toast.error('Failed to load wallet stats');
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    await fetchWalletStats();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchWalletStats();
  }, [userId]);

  const formatAmount = (amount: number) => {
    return `₦${Math.abs(amount).toLocaleString()}`;
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading wallet stats...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Failed to load wallet data</p>
        <Button onClick={fetchWalletStats} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl border border-white/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total Balance
                </h3>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">
                  {formatAmount(stats.balance)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshStats}
                disabled={refreshing}
                className="bg-white/20 hover:bg-white/30"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Deposited</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatAmount(stats.totalDeposited)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Withdrawn</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatAmount(stats.totalWithdrawn)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/20 backdrop-blur-xl border border-white/30">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => onActionClick('deposit')}
                className="h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Deposit
              </Button>
              <Button
                onClick={() => onActionClick('withdraw')}
                className="h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
              <Button
                onClick={() => onActionClick('send')}
                className="h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
              <Button
                onClick={() => onActionClick('receive')}
                className="h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Receive
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Today's Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-white/20 backdrop-blur-xl border border-white/30">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-green-500/20 rounded-lg">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Deposits</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatAmount(stats.today.deposits)}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-500/20 rounded-lg">
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">Withdrawals</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatAmount(stats.today.withdrawals)}
                  </p>
                </div>
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-500/20 rounded-lg">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Sent</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatAmount(stats.today.sent)}
                  </p>
                </div>
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-500/20 rounded-lg">
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Received</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {formatAmount(stats.today.received)}
                  </p>
                </div>
                <Download className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/20 backdrop-blur-xl border border-white/30">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Deposits</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-600">
                    {formatAmount(stats.week.deposits)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    +{getPercentageChange(stats.week.deposits, stats.month.deposits / 4).toFixed(0)}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Withdrawals</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-red-600">
                    {formatAmount(stats.week.withdrawals)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {getPercentageChange(stats.week.withdrawals, stats.month.withdrawals / 4).toFixed(0)}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Money Sent</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600">
                    {formatAmount(stats.week.sent)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {getPercentageChange(stats.week.sent, stats.month.sent / 4).toFixed(0)}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Money Received</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-600">
                    {formatAmount(stats.week.received)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    +{getPercentageChange(stats.week.received, stats.month.received / 4).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
