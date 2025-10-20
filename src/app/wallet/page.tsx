"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  EyeOff, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  RefreshCw,
  Send,
  Download,
  Upload,
  QrCode,
  Bitcoin,
  Coins,
  Shield,
  Zap,
  Star,
  Globe,
  Smartphone,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Settings,
  Bell,
  ChevronRight,
  Sparkles,
  Crown,
  Gem,
  X
} from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/dashboard/Shell";
import { WalletModals } from "@/components/wallet/WalletModals";
import { NotificationBell } from "@/components/Notifications/NotificationBell";
import { NotificationSystem } from "@/components/Notifications/NotificationSystem";
import { AfricanPatterns, AfricanGlassmorphismCard, AfricanButton } from "@/components/wallet/AfricanPatterns";
import { RealTimeTransactionHistory } from "@/components/wallet/RealTimeTransactionHistory";
import { WalletDashboard } from "@/components/wallet/WalletDashboard";

interface WalletData {
  balance_kobo: number;
  total_contributed_kobo: number;
  total_withdrawn_kobo: number;
  last_activity_at: string;
}

export default function WalletPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeWallet, setActiveWallet] = useState<'ngn' | 'crypto'>('ngn');
  const [cryptoBalance, setCryptoBalance] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  // Calculate crypto value in NGN
  const cryptoValue = useMemo(() => {
    if (!btcPrice) return 0;
    return parseFloat((cryptoBalance * btcPrice).toFixed(2));
  }, [cryptoBalance, btcPrice]);

  const formatAmount = (amountKobo: number) => {
    return `₦${(amountKobo / 100).toLocaleString()}`;
  };

  const formatCryptoAmount = (amount: number) => {
    return `${amount.toFixed(8)} BTC`;
  };

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'deposit':
        setShowDepositModal(true);
        break;
      case 'withdraw':
        setShowWithdrawModal(true);
        break;
      case 'send':
        setShowSendModal(true);
        break;
      case 'receive':
        setShowReceiveModal(true);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };
  
  useEffect(() => {
    loadWalletData();
  }, []);

  // Real-time updates for wallet data
  useEffect(() => {
    if (!user?.id) return;

    const supabase = getSupabaseBrowserClient();
    
    // Listen to wallet balance changes
    const walletChannel = supabase
      .channel('wallet_balance_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `profile_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Wallet balance updated:', payload);
          loadWalletData(); // Reload wallet data
        }
      )
      .subscribe();

    // Listen to transaction changes
    const transactionChannel = supabase
      .channel('wallet_transaction_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Transaction change detected:', payload);
          loadWalletData(); // Reload wallet data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(transactionChannel);
    };
  }, [user?.id]);

  useEffect(() => {
    // Listen for notification bell clicks
    const handleNotificationBellClick = () => {
      setShowNotifications(true);
    };

    window.addEventListener('notificationBellClick', handleNotificationBellClick);
    
    return () => {
      window.removeEventListener('notificationBellClick', handleNotificationBellClick);
    };
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Load user data
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({ id: authUser.id, email: authUser.email });
        
        // Fetch real wallet data using the wallet balance API
        const response = await fetch('/api/wallet/balance');
        const data = await response.json();

        if (data.success && data.wallet) {
          setWalletData(data.wallet);
        } else {
          console.error('Error fetching wallet data:', data.error);
          // Create empty wallet if none exists
        setWalletData({
            balance_kobo: 0,
            total_contributed_kobo: 0,
            total_withdrawn_kobo: 0,
          last_activity_at: new Date().toISOString()
        });
        }
      }
        setLoading(false);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setLoading(false);
    }
  };

  const quickActions = [
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
  ];

  // Remove static transactions - we'll use real-time data instead

  return (
    <DashboardShell role="customer">
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
        {/* African-inspired background elements */}
        <AfricanPatterns />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-3xl backdrop-blur-sm border border-white/30">
                    <Wallet className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-2 w-2 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                    Digital Wallet
                    <Crown className="h-6 w-6 text-amber-500" />
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Manage your Naira and crypto assets with African-inspired design
                  </p>
                </div>
              </div>
        <div className="flex items-center gap-2 sm:gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2 sm:p-3 rounded-xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/30 hover:from-white/30 hover:to-white/20 transition-all duration-300 shadow-lg"
                >
                  <NotificationBell 
                    userId={user?.id} 
                    size="md" 
                    variant="wallet"
                    className="text-gray-700 dark:text-white"
                  />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2 sm:p-3 rounded-xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/30 hover:from-white/30 hover:to-white/20 transition-all duration-300 shadow-lg"
                >
                  <Settings className="h-4 w-4 text-gray-700 dark:text-white" />
                </motion.button>
              </div>
            </div>

            {/* Wallet Type Toggle */}
            <div className="flex items-center justify-center">
              <AfricanGlassmorphismCard className="p-2">
                <div className="flex">
                  <motion.button
                    onClick={() => setActiveWallet('ngn')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 relative ${
                      activeWallet === 'ngn'
                        ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-gray-800 shadow-lg'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Coins className="h-4 w-4" />
                    Naira Wallet
                    {activeWallet === 'ngn' && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => setActiveWallet('crypto')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 relative ${
                      activeWallet === 'crypto'
                        ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-gray-800 shadow-lg'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Bitcoin className="h-4 w-4" />
                    Crypto Wallet
                    {activeWallet === 'crypto' && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
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
            className="mb-8"
          >
            <AfricanGlassmorphismCard className="overflow-hidden">
              <CardContent className="p-0">
                {/* Wallet Header */}
                <div className="relative p-8 bg-gradient-to-br from-amber-400/20 via-orange-400/20 to-red-400/20 overflow-hidden">
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-amber-300/10 to-orange-300/10 rounded-full blur-xl"></div>
                  <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-red-300/10 to-pink-300/10 rounded-full blur-xl"></div>
                  
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {activeWallet === 'ngn' ? (
                          <div className="p-4 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-3xl backdrop-blur-sm border border-white/30 shadow-lg">
                            <Coins className="h-8 w-8 text-amber-600" />
                          </div>
                        ) : (
                          <div className="p-4 bg-gradient-to-br from-orange-400/30 to-red-400/30 rounded-3xl backdrop-blur-sm border border-white/30 shadow-lg">
                            <Bitcoin className="h-8 w-8 text-orange-600" />
                          </div>
                        )}
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                          <Gem className="h-2 w-2 text-white" />
                        </div>
                      </motion.div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          {activeWallet === 'ngn' ? 'Naira Wallet' : 'Bitcoin Wallet'}
                          <Crown className="h-5 w-5 text-amber-500" />
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {activeWallet === 'ngn' ? 'Your Nigerian Naira balance' : 'Your Bitcoin holdings'}
                        </p>
                      </div>
                    </div>
                    <AfricanButton
                      variant="secondary"
                      className="p-3"
                      onClick={() => setBalanceVisible(!balanceVisible)}
                    >
                      {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </AfricanButton>
              </div>
              
                  {/* Balance Display */}
                  <div className="text-center mb-8 relative z-10">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mb-4"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/30">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Available Balance</p>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      className="text-5xl font-bold text-gray-800 dark:text-white mb-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
                    >
                      {balanceVisible ? (
                        activeWallet === 'ngn' ? (
                          walletData ? formatAmount(walletData.balance_kobo) : '₦0'
                        ) : (
                          formatCryptoAmount(cryptoBalance)
                        )
                      ) : (
                        '••••••'
                      )}
                    </motion.div>
                    
                    {activeWallet === 'crypto' && balanceVisible && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-lg text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2"
                      >
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        ≈ {formatAmount(cryptoValue * 100)}
                        <span className="text-xs text-green-500">+2.5%</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <AfricanButton
                          onClick={action.action}
                          variant={action.id === 'send' ? 'primary' : action.id === 'receive' ? 'accent' : 'secondary'}
                          className="w-full h-20 flex flex-col items-center justify-center gap-2"
                        >
                          <action.icon className="h-6 w-6" />
                          <span className="text-sm font-medium">{action.title}</span>
                        </AfricanButton>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Wallet Stats */}
                <div className="p-6 bg-white/10 backdrop-blur-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="p-3 bg-green-500/20 rounded-2xl w-fit mx-auto mb-3">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Deposited</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {walletData ? formatAmount(walletData.total_contributed_kobo) : '₦0'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="p-3 bg-blue-500/20 rounded-2xl w-fit mx-auto mb-3">
                        <ArrowUpRight className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Withdrawn</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {walletData ? formatAmount(walletData.total_withdrawn_kobo) : '₦0'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="p-3 bg-purple-500/20 rounded-2xl w-fit mx-auto mb-3">
                        <Shield className="h-6 w-6 text-purple-600" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Security Level</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">High</p>
                    </div>
                </div>
              </div>
            </CardContent>
            </AfricanGlassmorphismCard>
          </motion.div>


          {/* Wallet Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {user?.id && (
              <WalletDashboard 
                userId={user.id}
                onActionClick={handleActionClick}
              />
            )}
          </motion.div>

          {/* Real-time Transaction History */}
                    <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {user?.id && (
              <RealTimeTransactionHistory 
                userId={user.id}
                className="bg-white/20 backdrop-blur-xl border border-white/30"
              />
            )}
          </motion.div>
        </div>

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
          activeWallet={activeWallet}
          walletBalance={(walletData?.balance_kobo || 0) / 100}
          onWalletUpdate={loadWalletData}
          user={user}
        />
        
        {/* Notification System Modal */}
        <AnimatePresence>
          {showNotifications && user?.id && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowNotifications(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-sm sm:max-w-md max-h-[70vh] sm:max-h-[80vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-7 h-7 sm:w-8 sm:h-8 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-red-500/20"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                
                {/* Notification System */}
                <div className="p-4 sm:p-6">
                  <NotificationSystem userId={user.id} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
    </DashboardShell>
  );
}