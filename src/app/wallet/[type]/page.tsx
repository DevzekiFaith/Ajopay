"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, Eye, EyeOff, CreditCard, TrendingUp, TrendingDown, Wallet, RefreshCw, Crown, Gem, Sparkles, Send, Download, Upload, ArrowUpRight, Shield, Star, History, Settings, Bell } from "lucide-react";
import { toast } from "sonner";
import DashboardShell from "@/components/dashboard/Shell";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Bitcoin, Coins } from "lucide-react";
import { AfricanPatterns, AfricanGlassmorphismCard, AfricanButton } from "@/components/wallet/AfricanPatterns";
import { WalletModals } from "@/components/wallet/WalletModals";

interface Transaction {
  id: string;
  amount_kobo: number;
  type: 'deposit' | 'withdrawal' | 'commission' | 'penalty';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference: string;
  description?: string;
  created_at: string;
  completed_at?: string;
}

interface WalletData {
  balance_kobo: number;
  total_contributed_kobo?: number;
  total_withdrawn_kobo?: number;
  last_activity_at?: string;
}

export default function WalletDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  
  // State declarations - moved to the top to avoid TDZ issues
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [walletView, setWalletView] = useState<'ngn' | 'crypto'>(params.type as 'ngn' | 'crypto');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoBalance, setCryptoBalance] = useState(0.00234567); // BTC balance
  const [btcPrice, setBtcPrice] = useState<number | null>(45000); // Default price in USD
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Calculate crypto value in NGN
  const cryptoValue = useMemo(() => {
    if (!btcPrice) return 0;
    return parseFloat((cryptoBalance * btcPrice).toFixed(2));
  }, [cryptoBalance, btcPrice]);

  const isCrypto = walletView === 'crypto';

  const formatBalance = (amountKobo: number) => {
    return `₦${(amountKobo / 100).toLocaleString()}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleWalletToggle = (value: 'ngn' | 'crypto') => {
    setWalletView(value);
    router.push(`/wallet/${value}`);
  };

  const refreshWallet = async () => {
    setIsRefreshing(true);
    try {
      await loadWalletData();
      toast.success('Wallet refreshed!');
    } catch (error) {
      toast.error('Failed to refresh wallet');
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Fetch wallet data from API
      const response = await fetch('/api/wallet/data');
      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }
      
      const data = await response.json();
      setWalletData(data.wallet);
      
      // Load transactions
      const txResponse = await fetch('/api/wallet/transactions');
      if (txResponse.ok) {
        const txData = await txResponse.json();
        setTransactions(txData.transactions || []);
      }
      
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  if (loading) {
    return (
      <DashboardShell role="customer" title="Loading...">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="customer" title={`${isCrypto ? 'Crypto' : 'NGN'} Wallet`}>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-2 sm:p-4 md:p-6 lg:p-8">
        {/* African-inspired background elements */}
        <AfricanPatterns />
        
        <div className="relative z-10 max-w-6xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <AfricanButton
                  variant="secondary"
                  className="p-2 sm:p-3"
              onClick={() => router.back()}
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </AfricanButton>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative">
                    <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-2xl sm:rounded-3xl backdrop-blur-sm border border-white/30">
                      <Wallet className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-amber-600" />
          </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Sparkles className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
                      {walletView === 'crypto' ? 'Crypto Wallet' : 'Naira Wallet'}
                      <Crown className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-amber-500" />
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      {walletView === 'crypto' ? 'Manage your crypto assets with African-inspired design' : 'Manage your NGN balance and transactions'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <AfricanButton
                  variant="secondary"
                  className="p-2 sm:p-3"
                >
                  <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                </AfricanButton>
                <AfricanButton
                  variant="secondary"
                  className="p-2 sm:p-3"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                </AfricanButton>
              </div>
            </div>

            {/* Wallet Type Toggle */}
            <div className="flex items-center justify-center">
              <AfricanGlassmorphismCard className="p-1 sm:p-2">
                <div className="flex">
                  <motion.button
                    onClick={() => handleWalletToggle('ngn')}
                    className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-300 flex items-center gap-1 sm:gap-2 relative text-xs sm:text-sm ${
                      walletView === 'ngn'
                        ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-gray-800 shadow-lg'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Coins className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Naira Wallet</span>
                    <span className="sm:hidden">NGN</span>
                    {walletView === 'ngn' && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => handleWalletToggle('crypto')}
                    className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-300 flex items-center gap-1 sm:gap-2 relative text-xs sm:text-sm ${
                      walletView === 'crypto'
                        ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-gray-800 shadow-lg'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Bitcoin className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Crypto Wallet</span>
                    <span className="sm:hidden">BTC</span>
                    {walletView === 'crypto' && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
          </div>
              </AfricanGlassmorphismCard>
        </div>
          </motion.div>

          {/* Main Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            <AfricanGlassmorphismCard className="overflow-hidden">
              <CardContent className="p-0">
                {/* Wallet Header */}
                <div className="relative p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-amber-400/20 via-orange-400/20 to-red-400/20 overflow-hidden">
                  {/* Decorative elements */}
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-300/10 to-orange-300/10 rounded-full blur-xl"></div>
                  <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-300/10 to-pink-300/10 rounded-full blur-xl"></div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6 relative z-10">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <motion.div
          className="relative"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {walletView === 'ngn' ? (
                          <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-2xl sm:rounded-3xl backdrop-blur-sm border border-white/30 shadow-lg">
                            <Coins className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-amber-600" />
                          </div>
                        ) : (
                          <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-orange-400/30 to-red-400/30 rounded-2xl sm:rounded-3xl backdrop-blur-sm border border-white/30 shadow-lg">
                            <Bitcoin className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-orange-600" />
                          </div>
                        )}
                        <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                          <Gem className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-white" />
                  </div>
                      </motion.div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-1 sm:gap-2">
                          {walletView === 'ngn' ? 'Naira Wallet' : 'Bitcoin Wallet'}
                          <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                            </h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                          {walletView === 'ngn' ? 'Your Nigerian Naira balance' : 'Your Bitcoin holdings'}
                            </p>
                          </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      {!isCrypto && (
                        <AfricanButton
                          variant="secondary"
                          className="p-2 sm:p-3"
                          onClick={refreshWallet}
                        >
                          <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </AfricanButton>
                      )}
                      <button
                      onClick={() => setBalanceVisible(!balanceVisible)}
                        className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-gray-800 dark:text-white rounded-lg transition-all duration-300"
                    >
                        {balanceVisible ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </button>
                  </div>
                </div>

                  {/* Balance Display */}
                  <div className="text-center mb-4 sm:mb-6 lg:mb-8 relative z-10">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mb-3 sm:mb-4"
                    >
                      <div className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/30">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">Available Balance</p>
              </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
                    >
                      {balanceVisible ? (
                        walletView === 'crypto' ? (
                          <>
                            <div className="break-all">{cryptoBalance.toFixed(8)} BTC</div>
                            <div className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1 sm:gap-2">
                              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                              ≈ ${cryptoValue.toLocaleString()}
                              <span className="text-xs text-green-500">+2.5%</span>
                  </div>
                          </>
                        ) : (
                          walletData ? formatBalance(walletData.balance_kobo) : '₦0.00'
                        )
                      ) : (
                        '••••••'
                      )}
                    </motion.div>
                </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                    {[
                      {
                        id: 'send',
                        title: 'Send',
                        icon: Send,
                        color: 'from-blue-500 to-cyan-500',
                        action: () => setShowSendModal(true)
                      },
                      {
                        id: 'receive',
                        title: 'Receive',
                        icon: Download,
                        color: 'from-green-500 to-emerald-500',
                        action: () => setShowReceiveModal(true)
                      },
                      {
                        id: 'deposit',
                        title: 'Deposit',
                        icon: Upload,
                        color: 'from-purple-500 to-violet-500',
                        action: () => setShowDepositModal(true)
                      },
                      {
                        id: 'withdraw',
                        title: 'Withdraw',
                        icon: ArrowUpRight,
                        color: 'from-orange-500 to-red-500',
                        action: () => setShowWithdrawModal(true)
                      }
                    ].map((action, index) => (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <AfricanButton
                          onClick={action.action}
                          variant={action.id === 'send' ? 'primary' : action.id === 'receive' ? 'accent' : 'secondary'}
                          className="w-full h-16 sm:h-18 lg:h-20 flex flex-col items-center justify-center gap-1 sm:gap-2"
                        >
                          <action.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                          <span className="text-xs sm:text-sm font-medium">{action.title}</span>
                        </AfricanButton>
                      </motion.div>
                    ))}
                </div>
              </div>

            </CardContent>
            </AfricanGlassmorphismCard>
        </motion.div>

        {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8"
          >
            <AfricanGlassmorphismCard>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="p-2 sm:p-3 bg-green-500/20 rounded-xl sm:rounded-2xl w-fit mx-auto mb-2 sm:mb-3">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">Total Deposited</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                  {walletData ? formatBalance(walletData.total_contributed_kobo || 0) : '₦0.00'}
              </p>
            </CardContent>
            </AfricanGlassmorphismCard>

            <AfricanGlassmorphismCard>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="p-2 sm:p-3 bg-red-500/20 rounded-xl sm:rounded-2xl w-fit mx-auto mb-2 sm:mb-3">
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-600" />
              </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">Total Withdrawn</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                  {walletData ? formatBalance(walletData.total_withdrawn_kobo || 0) : '₦0.00'}
              </p>
            </CardContent>
            </AfricanGlassmorphismCard>

            <AfricanGlassmorphismCard className="sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="p-2 sm:p-3 bg-purple-500/20 rounded-xl sm:rounded-2xl w-fit mx-auto mb-2 sm:mb-3">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
              </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">Security Level</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">High</p>
            </CardContent>
            </AfricanGlassmorphismCard>
          </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-8 sm:h-10">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transactions</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 sm:space-y-4">
              <AfricanGlassmorphismCard>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <Button 
                  className="h-10 sm:h-12 flex-col gap-1"
                  onClick={() => setShowDepositModal(true)}
                >
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs">Deposit</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-10 sm:h-12 flex-col gap-1"
                  onClick={() => setShowWithdrawModal(true)}
                >
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs">Withdraw</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-10 sm:h-12 flex-col gap-1"
                  onClick={() => setShowSendModal(true)}
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs">Send</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-10 sm:h-12 flex-col gap-1"
                  onClick={() => setShowReceiveModal(true)}
                >
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs">Receive</span>
                </Button>
              </CardContent>
              </AfricanGlassmorphismCard>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
              <AfricanGlassmorphismCard>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                    No transactions yet
                    </div>
                ) : (
                  <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              transaction.type === 'deposit' || transaction.type === 'commission' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {transaction.type === 'deposit' || transaction.type === 'commission' ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                            </div>
                          <div>
                              <p className="font-medium">{transaction.description || transaction.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-semibold ${
                              transaction.type === 'deposit' || transaction.type === 'commission' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {transaction.type === 'deposit' || transaction.type === 'commission' ? '+' : '-'}
                              {formatBalance(transaction.amount_kobo)}
                            </p>
                            <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                              {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              </AfricanGlassmorphismCard>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
              <AfricanGlassmorphismCard>
              <CardHeader>
                <CardTitle>Wallet Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                      <p className="font-medium">Show Balance</p>
                      <p className="text-sm text-muted-foreground">Toggle balance visibility</p>
                  </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBalanceVisible(!balanceVisible)}
                    >
                      {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                      <p className="font-medium">Wallet Address</p>
                      <p className="text-sm text-muted-foreground">Your wallet address</p>
                  </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-black/20 px-2 py-1 rounded">
                        {walletView === 'crypto' ? 'bc1q...7x8y9z' : `AJO-${walletData?.balance_kobo.toString().slice(-6) || '000000'}`}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(walletView === 'crypto' ? 'bc1q...7x8y9z' : `AJO-${walletData?.balance_kobo.toString().slice(-6) || '000000'}`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                </div>
                {walletView === 'crypto' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Private Key Export</p>
                      <p className="text-sm text-muted-foreground">Export your private keys securely</p>
                    </div>
                    <Button variant="outline" size="sm">Export</Button>
                  </div>
                )}
              </CardContent>
              </AfricanGlassmorphismCard>
          </TabsContent>
        </Tabs>

          {/* Wallet Modals */}
          <WalletModals
            showDepositModal={showDepositModal}
            setShowDepositModal={setShowDepositModal}
            showWithdrawModal={showWithdrawModal}
            setShowWithdrawModal={setShowWithdrawModal}
            showSendModal={showSendModal}
            setShowSendModal={setShowSendModal}
            showReceiveModal={showReceiveModal}
            setShowReceiveModal={setShowReceiveModal}
            activeWallet={walletView}
            onWalletUpdate={loadWalletData}
          />
        </div>
      </div>
    </DashboardShell>
  );
}