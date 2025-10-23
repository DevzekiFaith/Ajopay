"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  DollarSign, 
  Euro, 
  PoundSterling, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown,
  History
} from "lucide-react";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number; // Rate to NGN
  change24h: number; // 24h change percentage
  lastUpdated: string;
}

interface CurrencyWallet {
  currency: string;
  balance: number;
  balanceNGN: number;
  lastUpdated: string;
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
}

interface Transaction {
  id: string;
  type: 'exchange' | 'deposit' | 'withdrawal';
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

const supportedCurrencies: Currency[] = [
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    flag: '🇳🇬',
    rate: 1.0,
    change24h: 0.0,
    lastUpdated: new Date().toISOString()
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    rate: 0.00067, // 1 NGN = 0.00067 USD (approximate)
    change24h: -0.5,
    lastUpdated: new Date().toISOString()
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    rate: 0.00061, // 1 NGN = 0.00061 EUR (approximate)
    change24h: 0.8,
    lastUpdated: new Date().toISOString()
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    rate: 0.00052, // 1 NGN = 0.00052 GBP (approximate)
    change24h: -0.3,
    lastUpdated: new Date().toISOString()
  }
];

export function MultiCurrencySupport() {
  const [currencies] = useState<Currency[]>(supportedCurrencies);
  const [userWallets, setUserWallets] = useState<CurrencyWallet[]>([]);
  const [exchangeRates] = useState<ExchangeRate[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Exchange form state
  const [showExchangeDialog, setShowExchangeDialog] = useState(false);
  const [exchangeForm, setExchangeForm] = useState({
    fromCurrency: 'NGN',
    toCurrency: 'USD',
    amount: '',
    convertedAmount: 0
  });

  // Mock data initialization
  useEffect(() => {
    const mockWallets: CurrencyWallet[] = [
      {
        currency: 'NGN',
        balance: 50000000, // ₦500,000
        balanceNGN: 50000000,
        lastUpdated: new Date().toISOString()
      },
      {
        currency: 'USD',
        balance: 500, // $500
        balanceNGN: 75000000, // ₦750,000 equivalent
        lastUpdated: new Date().toISOString()
      },
      {
        currency: 'EUR',
        balance: 300, // €300
        balanceNGN: 49200000, // ₦492,000 equivalent
        lastUpdated: new Date().toISOString()
      }
    ];

    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'exchange',
        fromCurrency: 'NGN',
        toCurrency: 'USD',
        fromAmount: 15000000, // ₦150,000
        toAmount: 100, // $100
        rate: 0.00067,
        status: 'completed',
        createdAt: '2024-01-20T10:30:00Z'
      },
      {
        id: '2',
        type: 'deposit',
        fromCurrency: 'USD',
        toCurrency: 'USD',
        fromAmount: 200,
        toAmount: 200,
        rate: 1.0,
        status: 'completed',
        createdAt: '2024-01-18T14:15:00Z'
      }
    ];

    setUserWallets(mockWallets);
    setTransactions(mockTransactions);
    setLoading(false);
  }, []);

  const calculateExchange = (amount: string, fromCurrency: string, toCurrency: string) => {
    if (!amount || fromCurrency === toCurrency) {
      setExchangeForm(prev => ({ ...prev, convertedAmount: 0 }));
      return;
    }

    const fromRate = currencies.find(c => c.code === fromCurrency)?.rate || 1;
    const toRate = currencies.find(c => c.code === toCurrency)?.rate || 1;
    
    // Convert to NGN first, then to target currency
    const amountInNGN = parseFloat(amount) / fromRate;
    const convertedAmount = amountInNGN * toRate;
    
    setExchangeForm(prev => ({ ...prev, convertedAmount }));
  };

  const handleExchange = async () => {
    if (!exchangeForm.amount || exchangeForm.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const fromWallet = userWallets.find(w => w.currency === exchangeForm.fromCurrency);
    if (!fromWallet || fromWallet.balance < parseFloat(exchangeForm.amount) * 100) {
      toast.error('Insufficient balance');
      return;
    }

    // Mock exchange transaction
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'exchange',
      fromCurrency: exchangeForm.fromCurrency,
      toCurrency: exchangeForm.toCurrency,
      fromAmount: parseFloat(exchangeForm.amount) * 100,
      toAmount: exchangeForm.convertedAmount * 100,
      rate: exchangeForm.convertedAmount / parseFloat(exchangeForm.amount),
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setShowExchangeDialog(false);
    setExchangeForm({
      fromCurrency: 'NGN',
      toCurrency: 'USD',
      amount: '',
      convertedAmount: 0
    });

    toast.success(`Successfully exchanged ${exchangeForm.fromCurrency} to ${exchangeForm.toCurrency}`);
  };

  const getCurrencyIcon = (code: string) => {
    switch (code) {
      case 'USD': return <DollarSign className="h-5 w-5" />;
      case 'EUR': return <Euro className="h-5 w-5" />;
      case 'GBP': return <PoundSterling className="h-5 w-5" />;
      default: return <span className="text-lg">₦</span>;
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <span className="h-4 w-4" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Multi-Currency</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage multiple currencies with real-time exchange rates</p>
        </div>
        <Dialog open={showExchangeDialog} onOpenChange={setShowExchangeDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Exchange
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Currency Exchange</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fromCurrency">From</Label>
                <Select 
                  value={exchangeForm.fromCurrency} 
                  onValueChange={(value) => {
                    setExchangeForm(prev => ({ ...prev, fromCurrency: value }));
                    calculateExchange(exchangeForm.amount, value, exchangeForm.toCurrency);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span>{currency.flag}</span>
                          <span>{currency.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={exchangeForm.amount}
                  onChange={(e) => {
                    setExchangeForm(prev => ({ ...prev, amount: e.target.value }));
                    calculateExchange(e.target.value, exchangeForm.fromCurrency, exchangeForm.toCurrency);
                  }}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <Label htmlFor="toCurrency">To</Label>
                <Select 
                  value={exchangeForm.toCurrency} 
                  onValueChange={(value) => {
                    setExchangeForm(prev => ({ ...prev, toCurrency: value }));
                    calculateExchange(exchangeForm.amount, exchangeForm.fromCurrency, value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span>{currency.flag}</span>
                          <span>{currency.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {exchangeForm.convertedAmount > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {exchangeForm.toCurrency} {exchangeForm.convertedAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Exchange rate: 1 {exchangeForm.fromCurrency} = {(exchangeForm.convertedAmount / parseFloat(exchangeForm.amount || '1')).toFixed(4)} {exchangeForm.toCurrency}
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleExchange} className="w-full" disabled={!exchangeForm.amount || exchangeForm.amount <= 0}>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Exchange Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Currency Wallets */}
          <div className="grid gap-4">
            {userWallets.map((wallet) => {
              const currency = currencies.find(c => c.code === wallet.currency);
              return (
                <Card key={wallet.currency}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                          {getCurrencyIcon(wallet.currency)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{currency?.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {currency?.flag} {wallet.currency}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">
                          {currency?.symbol}{wallet.balance.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ₦{(wallet.balanceNGN / 100).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          {/* Exchange Rates */}
          <div className="grid gap-4">
            {currencies.map((currency) => (
              <Card key={currency.code}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                        {getCurrencyIcon(currency.code)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{currency.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {currency.flag} {currency.code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        1 {currency.code} = ₦{(1 / currency.rate).toLocaleString()}
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${getChangeColor(currency.change24h)}`}>
                        {getChangeIcon(currency.change24h)}
                        {currency.change24h > 0 ? '+' : ''}{currency.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Transaction History */}
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No transactions yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your currency exchange history will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                          <ArrowUpDown className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold capitalize">{transaction.type}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {transaction.fromCurrency} → {transaction.toCurrency}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {transaction.fromAmount / 100} {transaction.fromCurrency}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          → {transaction.toAmount / 100} {transaction.toCurrency}
                        </div>
                        <Badge 
                          className={
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


