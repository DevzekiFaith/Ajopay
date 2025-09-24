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
import { ArrowLeft, Copy, Eye, EyeOff, CreditCard, TrendingUp, TrendingDown, Wallet, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import DashboardShell from "@/components/dashboard/Shell";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Bitcoin, Coins } from "lucide-react";

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
  total_contributed_kobo: number;
  total_withdrawn_kobo: number;
  last_activity_at: string;
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

  const handleSend = async () => {
    if (!amount || !walletAddress) return;
    
    setIsProcessing(true);
    try {
      // Convert amount to kobo (smallest currency unit)
      const amountInKobo = Math.round(parseFloat(amount) * 100);
      
      // Validate amount
      if (isNaN(amountInKobo) || amountInKobo <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      // Check if sender has sufficient balance
      if (walletData && walletData.balance_kobo < amountInKobo) {
        toast.error('Insufficient balance');
        return;
      }
      
      // Insert transfer record
      const { data, error } = await supabase
        .from('transfers')
        .insert([{
          amount_kobo: amountInKobo,
          recipient_address: walletAddress,
          type: 'send',
          status: 'pending',
          // Add any additional fields your transfers table requires
          // e.g., sender_id, currency_type, etc.
        }])
        .select(); // Add this to get the inserted data back
      
      if (error) throw error;
      
      // Update local state
      setAmount('');
      setWalletAddress('');
      setShowSendModal(false);
      
      // Update wallet data
      if (walletData) {
        setWalletData({
          ...walletData,
          balance_kobo: walletData.balance_kobo - amountInKobo,
          last_activity_at: new Date().toISOString()
        });
      }
      
      // Refresh transactions list and wallet data
      await loadWalletData();
      
      toast.success('Transfer initiated successfully!');
    } catch (error) {
      console.error('Error initiating transfer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate transfer. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !walletAddress) return;
    
    setIsProcessing(true);
    try {
      // Convert amount to kobo (smallest currency unit)
      const amountInKobo = Math.round(parseFloat(amount) * 100);
      
      // Validate amount
      if (isNaN(amountInKobo) || amountInKobo <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      
      // Add your withdrawal API call or Supabase function here
      // Example:
      const { data, error } = await supabase
        .from('withdrawals')
        .insert([{
          amount_kobo: amountInKobo,
          wallet_address: walletAddress,
          status: 'pending'
        }]);
      
      if (error) throw error;
      
      // Reset form and close modal on success
      setAmount('');
      setWalletAddress('');
      setShowWithdrawModal(false);
      
      // Refresh wallet data
      if (walletData) {
        setWalletData({
          ...walletData,
          balance_kobo: walletData.balance_kobo - amountInKobo,
          total_withdrawn_kobo: (walletData.total_withdrawn_kobo || 0) + amountInKobo,
          last_activity_at: new Date().toISOString()
        });
      }
      
      toast.success('Withdrawal request submitted successfully!');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error('Failed to process withdrawal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isCrypto = walletView === 'crypto';

  // Memoize loadWalletData to prevent unnecessary re-renders
  const loadWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Please sign in to view wallet');
        router.push('/login');
        return;
      }

      if (isCrypto) {
        // Mock crypto wallet data for now
        setWalletData({
          balance_kobo: Math.round(cryptoValue * 100), // Convert to kobo equivalent
          total_contributed_kobo: 0,
          total_withdrawn_kobo: 0,
          last_activity_at: new Date().toISOString(),
        });
        setTransactions([]);
      } else {
        // Load NGN wallet data
        // First try to get the wallet
        console.log('Checking for existing wallet for user:', user.id);
        const { data: wallet, error: walletError } = await supabase
          .from("wallets")
          .select("*")
          .eq("profile_id", user.id)
          .single();

        // Also fetch contributions to sync wallet balance
        const { data: contributions } = await supabase
          .from("contributions")
          .select("amount_kobo")
          .eq("user_id", user.id);
        
        const totalContributions = contributions?.reduce((sum, c) => sum + (c.amount_kobo || 0), 0) || 0;

        if (walletError) {
          console.log('Wallet error:', walletError);
          // If wallet doesn't exist, create one
          if (walletError.code === 'PGRST116' || walletError.code === 'PGRST116') {
            console.log('Creating new wallet for user:', user.id);
            const { data: newWallet, error: createError } = await supabase
              .from("wallets")
              .insert({
                profile_id: user.id,
                balance_kobo: totalContributions,
                total_contributed_kobo: totalContributions,
                total_withdrawn_kobo: 0,
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating wallet:', {
                message: createError.message,
                code: createError.code,
                details: createError.details,
                hint: createError.hint
              });
              toast.error(`Failed to initialize wallet: ${createError.message}`);
              return;
            }
            console.log('New wallet created:', newWallet);

            setWalletData({
              balance_kobo: totalContributions,
              total_contributed_kobo: totalContributions,
              total_withdrawn_kobo: 0,
              last_activity_at: new Date().toISOString()
            });
          } else {
            console.error('Error loading wallet:', walletError);
            toast.error('Failed to load wallet data');
            return;
          }
        } else if (wallet) {
          // Sync wallet balance with contributions if needed
          if (wallet.balance_kobo !== totalContributions) {
            console.log('Syncing wallet balance with contributions:', {
              walletBalance: wallet.balance_kobo,
              totalContributions: totalContributions
            });
            
            // Update wallet balance to match contributions
            const { error: updateError } = await supabase
              .from("wallets")
              .update({
                balance_kobo: totalContributions,
                total_contributed_kobo: totalContributions,
                updated_at: new Date().toISOString()
              })
              .eq("profile_id", user.id);

            if (updateError) {
              console.error('Error syncing wallet balance:', updateError);
            } else {
              console.log('Wallet balance synced successfully');
            }
          }

          setWalletData({
            balance_kobo: totalContributions, // Use synced balance
            total_contributed_kobo: totalContributions,
            total_withdrawn_kobo: wallet.total_withdrawn_kobo || 0,
            last_activity_at: wallet.last_activity_at || new Date().toISOString(),
          });
        }

        // Load transactions with error handling
        try {
          console.log('Loading transactions for user:', user.id);
          const { data: txns, error: txError, status } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50);

          console.log('Transaction query status:', status);
          
          if (txError) {
            console.error('Error loading transactions:', {
              message: txError.message,
              details: txError.details,
              hint: txError.hint,
              code: txError.code
            });
            toast.error(`Failed to load transaction history: ${txError.message}`);
          } else {
            console.log('Loaded transactions:', txns);
            setTransactions(txns || []);
          }
        } catch (error) {
          console.error('Unexpected error loading transactions:', error);
          toast.error('An unexpected error occurred while loading transactions');
          setTransactions([]);
        }
      }
    } catch (error) {
      console.error("Error loading wallet data:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  }, [isCrypto, router, supabase, cryptoValue]);
  
  // Manual refresh function
  const refreshWallet = async () => {
    setIsRefreshing(true);
    try {
      await loadWalletData();
      toast.success('Wallet balance refreshed');
    } catch (error) {
      toast.error('Failed to refresh wallet');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load wallet data when component mounts or when wallet type changes
  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);
  
  // Fetch real-time BTC price
  useEffect(() => {
    if (!isCrypto) return;
    
    // Initial price fetch
    const fetchBtcPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await response.json();
        setBtcPrice(data.bitcoin.usd);
      } catch (error) {
        console.error('Error fetching BTC price:', error);
      }
    };
    
    fetchBtcPrice();
    
    // Set up WebSocket for real-time price updates (using a mock interval for this example)
    // In production, you would use a WebSocket connection to a crypto price API
    const priceInterval = setInterval(fetchBtcPrice, 60000); // Update every minute
    
    // Subscribe to crypto transaction updates
    const cryptoChannel = supabase
      .channel('crypto_transactions')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crypto_transactions',
          filter: 'user_id=eq.' + (supabase.auth.getUser() as any)?.id + '&asset=eq.btc'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTx = payload.new as any;
            if (newTx.type === 'receive') {
              setCryptoBalance(prev => prev + parseFloat(newTx.amount));
            } else if (newTx.type === 'send') {
              setCryptoBalance(prev => prev - parseFloat(newTx.amount));
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      clearInterval(priceInterval);
      supabase.removeChannel(cryptoChannel);
    };
  }, [isCrypto, supabase]);

  // Set up real-time subscriptions for NGN wallet
  useEffect(() => {
    if (isCrypto || !walletData) return;

    // Get current user ID for filtering
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      const channel = supabase
        .channel('wallet_updates_dynamic')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `profile_id=eq.${user.id}`
          },
          (payload) => {
            // Handle real-time wallet balance updates
            console.log('Dynamic wallet balance update:', payload);
            loadWalletData(); // Refresh wallet data
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_transactions',
            filter: `wallet_id=eq.${user.id}`
          },
          (payload) => {
            // Handle wallet transaction updates
            console.log('Dynamic wallet transaction update:', payload);
            loadWalletData(); // Refresh wallet data
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contributions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Handle contribution updates that affect wallet balance
            console.log('Dynamic contribution update affecting wallet:', payload);
            loadWalletData(); // Refresh wallet data
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [isCrypto, walletData, supabase, loadWalletData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatBalance = (kobo: number) => {
    if (isNaN(kobo)) return '₦0.00';

    const naira = kobo / 100;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(naira);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-blue-500" />;
    }
  };

  const handleWalletToggle = (type: 'ngn' | 'crypto') => {
    if (type === walletView) return;
    setWalletView(type);
    router.push(`/wallet/${type}`);
  };

  const handleDeposit = useCallback(async () => {
    if (!walletData || Number(walletData.balance_kobo) < 1000) return;
    
    try {
      setIsProcessing(true);
      // TODO: Implement actual deposit logic
      // This is where you would typically call your payment API
      console.log('Processing deposit of:', walletData.balance_kobo);
      
      // Example API call (uncomment and implement as needed):
      // const response = await fetch('/api/deposit', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     amount: Number(walletData.balance_kobo) * 100, // Convert to kobo
      //     walletId: walletData.id,
      //     type: 'deposit'
      // }),
      // });
      // const data = await response.json();
      // 
      // if (!response.ok) {
      //   throw new Error(data.message || 'Failed to process deposit');
      // }
      // 
      // // Handle successful deposit
      // setShowDepositModal(false);
      // setAmount('');
      // // Refresh wallet data
      // fetchWalletData();
      
    } catch (error) {
      console.error('Deposit error:', error);
      // TODO: Show error to user
      // setError(error.message || 'Failed to process deposit');
    } finally {
      setIsProcessing(false);
    }
  }, [walletData]);

  const handleTransaction = async (type: 'deposit' | 'withdraw' | 'send') => {
    if (!walletData || Number(walletData.balance_kobo) < 1000) {
      toast.error('Please enter a valid amount');
      return;
    }

    if ((type === 'withdraw' || type === 'send') && !walletAddress) {
      toast.error(isCrypto ? 'Please enter a valid wallet address' : 'Please enter a valid account number');
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const endpoint = isCrypto ? 
        (type === 'deposit' ? '/api/crypto/deposit' : type === 'withdraw' ? '/api/crypto/withdraw' : '/api/crypto/send') 
        : (type === 'deposit' ? '/api/deposit' : type === 'withdraw' ? '/api/withdraw' : '/api/transfer');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: isCrypto ? Number(amount) : Math.round(Number(amount) * 100), // Convert to kobo for fiat
          address: walletAddress,
          currency: isCrypto ? 'BTC' : 'NGN',
          userId: user.id,
          ...(!isCrypto && { bankName: 'User Selected Bank' }), // Add bank name for fiat withdrawals
          ...(type === 'send' && { recipient: walletAddress, description: 'Wallet transfer' }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${type}`);
      }

      if (type === 'deposit') {
        if (data.data?.authorization_url) {
          window.location.href = data.data.authorization_url;
        } else {
          toast.success('Deposit initiated successfully');
          setShowDepositModal(false);
          setAmount('');
        }
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast.error(error.message || `Failed to process ${type}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell role="customer" title="Wallet">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="customer" title={`${isCrypto ? 'Crypto' : 'NGN'} Wallet`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Wallet</h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {walletView === 'crypto' ? 'Manage your crypto assets' : 'Manage your NGN balance and transactions'}
            </p>
            <ToggleGroup 
              type="single" 
              value={walletView}
              onValueChange={(value: 'ngn' | 'crypto') => handleWalletToggle(value)}
              className="bg-white/5 p-1 rounded-lg border border-white/10 h-9"
            >
              <ToggleGroupItem 
                value="ngn" 
                className={`px-3 py-1 text-sm rounded-md ${walletView === 'ngn' ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'}`}
              >
                <Coins className="h-3.5 w-3.5 mr-2" />
                NGN
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="crypto" 
                className={`px-3 py-1 text-sm rounded-md ${walletView === 'crypto' ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'}`}
              >
                <Bitcoin className="h-3.5 w-3.5 mr-2" />
                Crypto
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Card className="border border-white/20 dark:border-white/10 bg-gradient-to-br from-violet-600/20 to-purple-600/20 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {walletView === 'crypto' ? 'Crypto Balance' : 'Available Balance'}
                    </p>
                    {!isCrypto && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshWallet}
                        disabled={isRefreshing}
                        className="h-6 w-6 p-0"
                      >
                        {isRefreshing ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {balanceVisible ? (
                      <h2 className="text-3xl font-bold">
                        {walletView === 'crypto' ? (
                          <div className="space-y-2">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
                              {cryptoBalance.toFixed(8)} BTC
                            </h2>
                            <p className="text-sm text-white/60">
                              ≈ ${cryptoValue.toLocaleString()} USD
                            </p>
                          </div>
                        ) : walletData ? formatBalance(walletData.balance_kobo) : '₦0.00'}
                      </h2>
                    ) : (
                      <h2 className="text-3xl font-bold">••••••</h2>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBalanceVisible(!balanceVisible)}
                      className="h-6 w-6 p-0"
                    >
                      {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {walletView === 'crypto' && (
                    <p className="text-sm text-muted-foreground">
                      ≈ ${cryptoValue.toLocaleString()} USD
                    </p>
                  )}
                </div>
                <Badge variant={walletView === 'crypto' ? "secondary" : "default"}>
                  {walletView === 'crypto' ? 'BTC' : 'NGN'}
                </Badge>
              </div>

              {/* Card Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Wallet ID</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-black/20 px-2 py-1 rounded">
                      {walletView === 'crypto' ? 'bc1q...7x8y9z' : `AJO-${walletData?.balance_kobo.toString().slice(-6) || '000000'}`}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(walletView === 'crypto' ? 'bc1q...7x8y9z' : `AJO-${walletData?.balance_kobo.toString().slice(-6) || '000000'}`)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className="mt-1">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Total Deposited</p>
              </div>
              <p className="text-xl font-semibold mt-1">
                {walletData ? formatBalance(walletData.total_contributed_kobo) : '₦0.00'}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <p className="text-sm text-muted-foreground">Total Withdrawn</p>
              </div>
              <p className="text-xl font-semibold mt-1">
                {walletData ? formatBalance(walletData.total_withdrawn_kobo) : '₦0.00'}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-muted-foreground">Last Activity</p>
              </div>
              <p className="text-sm font-medium mt-1">
                {walletData?.last_activity_at 
                  ? format(new Date(walletData.last_activity_at), 'MMM dd, yyyy')
                  : 'No activity'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  className="h-12 flex-col gap-1"
                  onClick={() => setShowDepositModal(true)}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Deposit</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 flex-col gap-1"
                  onClick={() => setShowWithdrawModal(true)}
                >
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-xs">Withdraw</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 flex-col gap-1"
                  onClick={() => setShowSendModal(true)}
                >
                  <Copy className="h-4 w-4" />
                  <span className="text-xs">Send</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 flex-col gap-1"
                  onClick={() => setShowReceiveModal(true)}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs">Receive</span>
                </Button>
              </CardContent>
              
              {/* Deposit Modal */}
              {showDepositModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">
                      {isCrypto ? 'Deposit Crypto' : 'Deposit NGN'}
                    </h3>
                    {isCrypto ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Send only Bitcoin (BTC) to this address</p>
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                          <p className="font-mono text-sm break-all">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => {
                              navigator.clipboard.writeText('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
                              toast.success('Address copied to clipboard');
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" /> Copy Address
                          </Button>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">
                            Minimum deposit: 0.0001 BTC
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Amount (NGN)
                          </label>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Minimum deposit: ₦1,000
                        </p>
                      </div>
                    )}
                    <div className="mt-6 flex justify-end gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowDepositModal(false);
                          setAmount('');
                        }}
                      >
                        Cancel
                      </Button>
                      {!isCrypto && (
                        <Button 
                          onClick={handleDeposit}
                          disabled={isProcessing || !amount || Number(amount) < 1000}
                        >
                          {isProcessing ? 'Processing...' : 'Continue to Payment'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Withdraw Modal */}
              {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">
                      {isCrypto ? 'Withdraw Crypto' : 'Withdraw NGN'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Amount {isCrypto ? '(BTC)' : '(NGN)'}
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder={`Enter amount ${isCrypto ? 'in BTC' : 'in NGN'}`}
                          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          {isCrypto ? 'Wallet Address' : 'Bank Account'}
                        </label>
                        <input
                          type="text"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          placeholder={isCrypto ? 'Enter BTC address' : 'Enter account number'}
                          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      {!isCrypto && (
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Bank Name
                          </label>
                          <select className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option>Select Bank</option>
                            <option>Access Bank</option>
                            <option>GTBank</option>
                            <option>Zenith Bank</option>
                            <option>First Bank</option>
                            <option>UBA</option>
                          </select>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {isCrypto 
                          ? 'Network fee: 0.0005 BTC' 
                          : 'Processing time: 1-3 business days'}
                      </p>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowWithdrawModal(false);
                          setAmount('');
                          setWalletAddress('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleWithdraw}
                        disabled={isProcessing || !amount || !walletAddress}
                      >
                        {isProcessing ? 'Processing...' : 'Withdraw'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Send Modal */}
              {showSendModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">
                      {isCrypto ? 'Send Crypto' : 'Send Money'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Amount {isCrypto ? '(BTC)' : '(NGN)'}
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder={`Enter amount ${isCrypto ? 'in BTC' : 'in NGN'}`}
                          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          {isCrypto ? 'Recipient Wallet Address' : 'Recipient Account'}
                        </label>
                        <input
                          type="text"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          placeholder={isCrypto ? 'Enter BTC address' : 'Enter account number or email'}
                          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      {!isCrypto && (
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Description (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="What's it for?"
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowSendModal(false);
                          setAmount('');
                          setWalletAddress('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSend}
                        disabled={isProcessing || !amount || !walletAddress}
                      >
                        {isProcessing ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Receive Modal */}
              {showReceiveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">
                      {isCrypto ? 'Receive Crypto' : 'Receive Money'}
                    </h3>
                    {isCrypto ? (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-center">
                          <div className="w-48 h-48 bg-white p-2">
                            {/* QR Code Placeholder - Replace with actual QR Code component */}
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-400">QR Code</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium mb-2">Your BTC Address</p>
                          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md flex items-center justify-between">
                            <code className="text-xs break-all">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-2"
                              onClick={() => {
                                navigator.clipboard.writeText('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
                                toast.success('Address copied to clipboard');
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Send only Bitcoin (BTC) to this address
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-center">
                          <div className="w-48 h-48 bg-white p-2">
                            {/* QR Code Placeholder - Replace with actual QR Code component */}
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-400">QR Code</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium">Account Number</p>
                            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                              <span>0123456789</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  navigator.clipboard.writeText('0123456789');
                                  toast.success('Account number copied');
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Account Name</p>
                            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                              <span>John Doe</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText('John Doe');
                                  toast.success('Account name copied');
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Bank Name</p>
                            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                              <span>Ajopay Bank</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-6 flex justify-end">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowReceiveModal(false)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {walletView === 'crypto' && (
              <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl">
                <CardHeader>
                  <CardTitle>Market Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">BTC Price</p>
                      <p className="text-lg font-semibold">$45,000.00</p>
                      <p className="text-xs text-green-500">+2.5% (24h)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Portfolio Value</p>
                      <p className="text-lg font-semibold">${cryptoValue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">≈ ₦{(cryptoValue * 800).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No transactions yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-black/10">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(tx.type)}
                          <div>
                            <p className="font-medium capitalize">{tx.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.created_at), 'MMM dd, yyyy • HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {tx.type === 'withdrawal' ? '-' : '+'}
                            {formatBalance(tx.amount_kobo)}
                          </p>
                          <Badge variant={
                            tx.status === 'completed' ? 'default' :
                            tx.status === 'pending' ? 'secondary' :
                            tx.status === 'failed' ? 'destructive' : 'outline'
                          } className="text-xs">
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl">
              <CardHeader>
                <CardTitle>Wallet Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Transaction Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified of wallet activity</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-backup</p>
                    <p className="text-sm text-muted-foreground">Automatically backup wallet data</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
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
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
