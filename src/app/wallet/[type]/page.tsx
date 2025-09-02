"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, Eye, EyeOff, CreditCard, TrendingUp, TrendingDown, Wallet } from "lucide-react";
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
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  
  const walletType = params.type as string;
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [walletView, setWalletView] = useState<'ngn' | 'crypto'>(walletType as 'ngn' | 'crypto');

  // Mock crypto data for future implementation
  const isCrypto = walletView === 'crypto';
  const cryptoBalance = 0.00234567; // BTC example
  const cryptoValue = cryptoBalance * 45000; // USD value

  const loadWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        const { data: wallet } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wallet) {
          setWalletData(wallet);
        }

        // Load transactions
        const { data: txns } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (txns) {
          setTransactions(txns);
        }
      }
    } catch (error) {
      console.error("Error loading wallet data:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletType !== 'ngn' && walletType !== 'crypto') {
      router.push('/customer');
      return;
    }
    setWalletView(walletType as 'ngn' | 'crypto');
    loadWalletData();
  }, [walletType, supabase, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatBalance = (kobo: number) => {
    if (isCrypto) {
      return `${cryptoBalance.toFixed(8)} BTC`;
    }
    return `₦${(kobo / 100).toLocaleString()}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'withdrawal': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'commission': return <Wallet className="h-4 w-4 text-blue-500" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const handleWalletToggle = (type: 'ngn' | 'crypto') => {
    if (type === walletView) return;
    setWalletView(type);
    router.push(`/wallet/${type}`);
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
                  <p className="text-sm text-muted-foreground">
                    {walletView === 'crypto' ? 'Crypto Balance' : 'Available Balance'}
                  </p>
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
                <Button className="h-12 flex-col gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Deposit</span>
                </Button>
                <Button variant="outline" className="h-12 flex-col gap-1">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-xs">Withdraw</span>
                </Button>
                <Button variant="outline" className="h-12 flex-col gap-1">
                  <Copy className="h-4 w-4" />
                  <span className="text-xs">Send</span>
                </Button>
                <Button variant="outline" className="h-12 flex-col gap-1">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs">Receive</span>
                </Button>
              </CardContent>
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
