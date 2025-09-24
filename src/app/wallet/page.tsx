'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Copy, QrCode, Send, Plus, Download, RefreshCw } from 'lucide-react';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { WalletQRCode } from '@/components/wallet/WalletQRCode';
import { soundManager, playTransactionSound } from '@/lib/sounds';
import { formatAmount, formatDate, truncateMiddle } from '@/lib/utils';

interface WalletData {
  balance_kobo: number;
  address: string;
  currency: 'NGN' | 'BTC';
  last_activity: string;
  pending_balance_kobo: number;
}

export default function WalletPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Initialize sound manager
  useEffect(() => {
    soundManager;
  }, []);

  // Fetch wallet data
  const fetchWallet = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/sign-in');
        return;
      }

      console.log('Fetching wallet for user:', user.id);

      // Fetch real wallet data from database
      const { data: walletData, error: walletError } = await supabase
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
        console.log('Wallet not found, creating new wallet:', walletError);
        
        // Create new wallet if it doesn't exist, sync with contributions
        const { data: newWallet, error: createError } = await supabase
          .from("wallets")
          .insert({
            profile_id: user.id,
            balance_kobo: totalContributions,
            total_contributed_kobo: totalContributions,
            total_withdrawn_kobo: 0
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating wallet:', createError);
          toast.error('Failed to create wallet');
          return;
        }

        const wallet: WalletData = {
          balance_kobo: newWallet.balance_kobo,
          pending_balance_kobo: 0,
          address: newWallet.id, // Use wallet ID as address
          currency: 'NGN',
          last_activity: newWallet.updated_at || new Date().toISOString()
        };

        setWallet(wallet);
      } else {
        console.log('Found existing wallet:', walletData);
        
        // Sync wallet balance with contributions if needed
        if (walletData.balance_kobo !== totalContributions) {
          console.log('Syncing wallet balance with contributions:', {
            walletBalance: walletData.balance_kobo,
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
        
        const wallet: WalletData = {
          balance_kobo: totalContributions, // Use synced balance
          pending_balance_kobo: 0, // You can add pending balance logic here
          address: walletData.id, // Use wallet ID as address
          currency: 'NGN',
          last_activity: walletData.updated_at || new Date().toISOString()
        };

        setWallet(wallet);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const refreshWallet = async () => {
    setIsRefreshing(true);
    try {
      await fetchWallet();
      toast.success('Wallet balance refreshed');
    } catch (error) {
      toast.error('Failed to refresh wallet');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWallet();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!wallet) return;

    const channel = supabase
      .channel('wallet_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `profile_id=eq.${wallet.address}`
        },
        (payload) => {
          // Handle real-time wallet balance updates
          console.log('Wallet balance update:', payload);
          fetchWallet();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `wallet_id=eq.${wallet.address}`
        },
        (payload) => {
          // Handle wallet transaction updates
          console.log('Wallet transaction update:', payload);
          fetchWallet();
          
          // Play sound for new transactions
          if (payload.eventType === 'INSERT') {
            playTransactionSound('deposit');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contributions',
          filter: `user_id=eq.${wallet.address}`
        },
        (payload) => {
          // Handle contribution updates that affect wallet balance
          console.log('Contribution update affecting wallet:', payload);
          fetchWallet();
          
          // Play sound for new contributions
          if (payload.eventType === 'INSERT') {
            playTransactionSound('deposit');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wallet?.address]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !sendAmount || !recipientAddress) return;

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount * 100 > wallet.balance_kobo) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setIsSending(true);
      
      // In a real app, this would be an API call to your backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate transaction
      const newBalance = wallet.balance_kobo - (amount * 100);
      setWallet({
        ...wallet,
        balance_kobo: newBalance,
        last_activity: new Date().toISOString()
      });
      
      toast.success(`Sent ${formatAmount(amount * 100)} to ${truncateMiddle(recipientAddress)}`);
      setSendAmount('');
      setRecipientAddress('');
      playTransactionSound('withdrawal');
    } catch (error) {
      console.error('Error sending funds:', error);
      toast.error('Failed to send funds');
      playTransactionSound('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeposit = async () => {
    if (!wallet) return;
    
    try {
      setIsDepositing(true);
      
      // In a real app, this would redirect to a payment gateway
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate deposit
      const depositAmount = 10000; // 100 NGN
      setWallet({
        ...wallet,
        pending_balance_kobo: wallet.pending_balance_kobo + depositAmount,
        last_activity: new Date().toISOString()
      });
      
      toast.success('Deposit initiated. It may take a few minutes to process.');
      playTransactionSound('success');
    } catch (error) {
      console.error('Error initiating deposit:', error);
      toast.error('Failed to initiate deposit');
      playTransactionSound('error');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!wallet) return;
    
    try {
      setIsWithdrawing(true);
      
      // In a real app, this would be an API call to your backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate withdrawal
      const withdrawalAmount = Math.min(10000, wallet.balance_kobo); // Max 100 NGN
      setWallet({
        ...wallet,
        balance_kobo: wallet.balance_kobo - withdrawalAmount,
        last_activity: new Date().toISOString()
      });
      
      toast.success(`Withdrawal of ${formatAmount(withdrawalAmount)} initiated`);
      playTransactionSound('success');
    } catch (error) {
      console.error('Error initiating withdrawal:', error);
      toast.error('Failed to initiate withdrawal');
      playTransactionSound('error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading || !wallet) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-3xl font-bold">Wallet</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>Available Balance</CardDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshWallet}
                  disabled={isRefreshing}
                  className="h-8 w-8 p-0"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <CardTitle className="text-4xl font-bold">
                {formatAmount(wallet.balance_kobo)}
              </CardTitle>
              {wallet.pending_balance_kobo > 0 && (
                <p className="text-sm text-muted-foreground">
                  +{formatAmount(wallet.pending_balance_kobo)} pending
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleDeposit} 
                  disabled={isDepositing}
                  className="flex-1 min-w-[120px]"
                >
                  {isDepositing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Deposit
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || wallet.balance_kobo <= 0}
                  className="flex-1 min-w-[120px]"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Withdraw
                    </>
                  )}
                </Button>
                <WalletQRCode 
                  address={wallet.address}
                  label="Receive"
                  isCrypto={wallet.currency === 'BTC'}
                />
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Wallet Address</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{truncateMiddle(wallet.address)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => copyToClipboard(wallet!.address)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span className="sr-only">Copy address</span>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Last Activity</span>
                  <span>{formatDate(wallet.last_activity, 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Send Funds Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send Funds</CardTitle>
              <CardDescription>Transfer money to another wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input
                    id="recipient"
                    placeholder="Enter wallet address"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (NGN)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Available: {formatAmount(wallet.balance_kobo)}
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Now
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All your wallet transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionHistory 
                userId={wallet.address} 
                isCrypto={wallet.currency === 'BTC'}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
