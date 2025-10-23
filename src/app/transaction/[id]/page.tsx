"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Wallet, Coins } from "lucide-react";
import { toast } from "sonner";
import { AjoPaySpinner } from "@/components/ui/AjoPaySpinner";

interface Transaction {
  id: string;
  amount_kobo: number;
  type: 'deposit' | 'withdrawal' | 'commission' | 'penalty' | 'wallet_topup' | 'group_contribution' | 'send' | 'receive' | 'contribution';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference: string;
  description?: string;
  created_at: string;
  completed_at?: string;
  metadata?: any;
  user_id: string;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transactionId = params.id as string;

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching transaction with ID:', transactionId);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('❌ No authenticated user');
          router.push('/sign-in');
          return;
        }

        console.log('✅ Authenticated user:', user.id);

        // Check if this is mock data by trying to get customer overview
        try {
          console.log('🔍 Checking for mock data...');
          const overviewRes = await fetch('/api/customer/overview', { cache: 'no-store' });
          console.log('📊 Overview API response status:', overviewRes.status);
          
          if (overviewRes.ok) {
            const overviewData = await overviewRes.json();
            console.log('📊 Overview data:', { 
              isMockData: overviewData.isMockData, 
              historyLength: overviewData.history?.length,
              historyIds: overviewData.history?.map((h: any) => h.id)
            });
            
            if (overviewData.isMockData && overviewData.history) {
              const mockTransaction = overviewData.history.find((h: any) => h.id === transactionId);
              console.log('🔍 Looking for transaction ID:', transactionId);
              console.log('🔍 Available mock transaction IDs:', overviewData.history.map((h: any) => h.id));
              console.log('🔍 Found mock transaction:', mockTransaction);
              
              if (mockTransaction) {
                console.log('✅ Found mock transaction:', mockTransaction);
                // Transform mock data to transaction format
                const mockTransactionData = {
                  id: mockTransaction.id,
                  amount_kobo: mockTransaction.amount_kobo,
                  type: 'contribution' as const,
                  status: 'completed' as const,
                  reference: `MOCK-${mockTransaction.id.slice(-8)}`,
                  description: 'Mock Contribution',
                  created_at: mockTransaction.contributed_at,
                  completed_at: mockTransaction.contributed_at,
                  metadata: { isMockData: true },
                  user_id: user.id
                };
                setTransaction(mockTransactionData);
                return;
              } else {
                console.log('❌ Mock transaction not found in history');
              }
            } else {
              console.log('❌ No mock data or history available');
            }
          } else {
            console.log('❌ Overview API failed:', overviewRes.status);
          }
        } catch (mockError) {
          console.log('⚠️ Could not check for mock data:', mockError);
        }

        // Special test case for debugging
        if (transactionId === 'test-transaction') {
          console.log('🧪 Creating test transaction for debugging');
          const testTransaction = {
            id: 'test-transaction',
            amount_kobo: 100000, // ₦1,000
            type: 'contribution' as const,
            status: 'completed' as const,
            reference: 'TEST-12345678',
            description: 'Test Transaction for Debugging',
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            metadata: { isMockData: true, isTest: true },
            user_id: user.id
          };
          setTransaction(testTransaction);
          return;
        }

        // Fallback: If this looks like a mock transaction ID, create a test transaction
        if (transactionId.startsWith('00000000-0000-4000-8000-')) {
          console.log('🔧 Creating fallback mock transaction for ID:', transactionId);
          const fallbackTransaction = {
            id: transactionId,
            amount_kobo: 50000, // ₦500
            type: 'contribution' as const,
            status: 'completed' as const,
            reference: `MOCK-${transactionId.slice(-8)}`,
            description: 'Mock Contribution (Fallback)',
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            metadata: { isMockData: true, isFallback: true },
            user_id: user.id
          };
          setTransaction(fallbackTransaction);
          return;
        }

        // Try to fetch from transactions table first
        console.log('🔍 Checking transactions table...');
        let { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transactionId)
          .eq('user_id', user.id)
          .single();

        console.log('📊 Transactions table result:', { transactionData, transactionError });

        // Check if we got a 500 error (database issue)
        if (transactionError && transactionError.message?.includes('500')) {
          console.log('⚠️ Database error (500), creating fallback transaction');
          const fallbackTransaction = {
            id: transactionId,
            amount_kobo: 75000, // ₦750
            type: 'contribution' as const,
            status: 'completed' as const,
            reference: `DB-${transactionId.slice(-8)}`,
            description: 'Transaction (Database Unavailable)',
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            metadata: { isMockData: true, isDatabaseError: true, originalError: transactionError.message },
            user_id: user.id
          };
          setTransaction(fallbackTransaction);
          return;
        }

        if (transactionError && transactionError.code === 'PGRST116') {
          console.log('❌ Not found in transactions table, checking wallet_transactions...');
          // If not found in transactions, try wallet_transactions
          // First get the user's wallet ID
          try {
            const { data: walletData, error: walletError } = await supabase
              .from('wallets')
              .select('id')
              .eq('profile_id', user.id)
              .single();

            if (walletError && walletError.message?.includes('500')) {
              console.log('⚠️ Wallet database error (500), creating fallback transaction');
              const fallbackTransaction = {
                id: transactionId,
                amount_kobo: 60000, // ₦600
                type: 'contribution' as const,
                status: 'completed' as const,
                reference: `WALLET-${transactionId.slice(-8)}`,
                description: 'Transaction (Wallet DB Unavailable)',
                created_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
                metadata: { isMockData: true, isDatabaseError: true, originalError: walletError instanceof Error ? walletError.message : String(walletError) },
                user_id: user.id
              };
              setTransaction(fallbackTransaction);
              return;
            }

            if (!walletError && walletData) {
              const { data: walletTransactionData, error: walletTransactionError } = await supabase
                .from('wallet_transactions')
                .select('*')
                .eq('id', transactionId)
                .eq('wallet_id', walletData.id)
                .single();

              if (!walletTransactionError) {
                // Transform wallet transaction data to match transaction format
                transactionData = {
                  id: walletTransactionData.id,
                  amount_kobo: walletTransactionData.amount_kobo,
                  type: walletTransactionData.type === 'credit' ? 'wallet_topup' : 'withdrawal',
                  status: 'completed',
                  reference: `WT-${walletTransactionData.id.slice(-8)}`,
                  description: walletTransactionData.description || 'Wallet transaction',
                  created_at: walletTransactionData.created_at,
                  completed_at: walletTransactionData.created_at,
                  metadata: walletTransactionData.meta || {},
                  user_id: user.id
                };
              } else if (walletTransactionError && walletTransactionError.code === 'PGRST116') {
                // If not found in wallet_transactions, try contributions table
                console.log('❌ Not found in wallet_transactions, checking contributions table...');
                try {
                  const { data: contributionData, error: contributionError } = await supabase
                    .from('contributions')
                    .select('*')
                    .eq('id', transactionId)
                    .eq('user_id', user.id)
                    .single();

                  console.log('📊 Contributions table result:', { contributionData, contributionError });

                  if (contributionError && contributionError.message?.includes('500')) {
                    console.log('⚠️ Contributions database error (500), creating fallback transaction');
                    const fallbackTransaction = {
                      id: transactionId,
                      amount_kobo: 45000, // ₦450
                      type: 'contribution' as const,
                      status: 'completed' as const,
                      reference: `CONT-${transactionId.slice(-8)}`,
                      description: 'Transaction (Contributions DB Unavailable)',
                      created_at: new Date().toISOString(),
                      completed_at: new Date().toISOString(),
                      metadata: { isMockData: true, isDatabaseError: true, originalError: contributionError.message },
                      user_id: user.id
                    };
                    setTransaction(fallbackTransaction);
                    return;
                  }

                  if (contributionError) {
                    console.log('❌ Not found in contributions table either');
                    throw new Error('Transaction not found');
                  }

                  // Transform contribution data to match transaction format
                  transactionData = {
                    id: contributionData.id,
                    amount_kobo: contributionData.amount_kobo,
                    type: 'contribution',
                    status: contributionData.status || 'completed',
                    reference: `CONT-${contributionData.id.slice(-8)}`,
                    description: contributionData.description || 'Contribution',
                    created_at: contributionData.created_at || contributionData.contributed_at,
                    completed_at: contributionData.status === 'confirmed' ? contributionData.created_at : null,
                    metadata: contributionData.metadata || {},
                    user_id: contributionData.user_id
                  };
                } catch (contribError) {
                  console.log('⚠️ Contributions query failed, creating fallback transaction');
                  const fallbackTransaction = {
                    id: transactionId,
                    amount_kobo: 35000, // ₦350
                    type: 'contribution' as const,
                    status: 'completed' as const,
                    reference: `FALLBACK-${transactionId.slice(-8)}`,
                    description: 'Transaction (Query Failed)',
                    created_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    metadata: { isMockData: true, isDatabaseError: true, originalError: contribError instanceof Error ? contribError.message : String(contribError) },
                    user_id: user.id
                  };
                  setTransaction(fallbackTransaction);
                  return;
                }
              } else if (walletTransactionError) {
                throw walletTransactionError;
              }
            } else {
              // If no wallet found, try contributions table directly
              try {
                const { data: contributionData, error: contributionError } = await supabase
                  .from('contributions')
                  .select('*')
                  .eq('id', transactionId)
                  .eq('user_id', user.id)
                  .single();

                if (contributionError && contributionError.message?.includes('500')) {
                  console.log('⚠️ Direct contributions database error (500), creating fallback transaction');
                  const fallbackTransaction = {
                    id: transactionId,
                    amount_kobo: 55000, // ₦550
                    type: 'contribution' as const,
                    status: 'completed' as const,
                    reference: `DIRECT-${transactionId.slice(-8)}`,
                    description: 'Transaction (Direct DB Unavailable)',
                    created_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    metadata: { isMockData: true, isDatabaseError: true, originalError: contributionError.message },
                    user_id: user.id
                  };
                  setTransaction(fallbackTransaction);
                  return;
                }

                if (contributionError) {
                  throw new Error('Transaction not found');
                }

                // Transform contribution data to match transaction format
                transactionData = {
                  id: contributionData.id,
                  amount_kobo: contributionData.amount_kobo,
                  type: 'contribution',
                  status: contributionData.status || 'completed',
                  reference: `CONT-${contributionData.id.slice(-8)}`,
                  description: contributionData.description || 'Contribution',
                  created_at: contributionData.created_at || contributionData.contributed_at,
                  completed_at: contributionData.status === 'confirmed' ? contributionData.created_at : null,
                  metadata: contributionData.metadata || {},
                  user_id: contributionData.user_id
                };
              } catch (directError) {
                console.log('⚠️ Direct contributions query failed, creating fallback transaction');
                const fallbackTransaction = {
                  id: transactionId,
                  amount_kobo: 40000, // ₦400
                  type: 'contribution' as const,
                  status: 'completed' as const,
                  reference: `DIRECT-${transactionId.slice(-8)}`,
                  description: 'Transaction (Direct Query Failed)',
                  created_at: new Date().toISOString(),
                  completed_at: new Date().toISOString(),
                  metadata: { isMockData: true, isDatabaseError: true, originalError: directError instanceof Error ? directError.message : String(directError) },
                  user_id: user.id
                };
                setTransaction(fallbackTransaction);
                return;
              }
            }
          } catch (walletError) {
            console.log('⚠️ Wallet query failed, creating fallback transaction');
            const fallbackTransaction = {
              id: transactionId,
              amount_kobo: 65000, // ₦650
              type: 'contribution' as const,
              status: 'completed' as const,
              reference: `WALLET-${transactionId.slice(-8)}`,
              description: 'Transaction (Wallet Query Failed)',
              created_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              metadata: { isMockData: true, isDatabaseError: true, originalError: walletError instanceof Error ? walletError.message : String(walletError) },
              user_id: user.id
            };
            setTransaction(fallbackTransaction);
            return;
          }
        } else if (transactionError) {
          throw transactionError;
        }

        if (!transactionData) {
          console.log('❌ No transaction data found after all checks');
          throw new Error('Transaction not found');
        }

        console.log('✅ Transaction found:', transactionData);
        setTransaction(transactionData);
      } catch (err: any) {
        console.error('Error fetching transaction:', err);
        setError(err.message || 'Failed to load transaction details');
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId, supabase, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'wallet_topup':
      case 'commission':
      case 'receive':
      case 'contribution':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
      case 'send':
      case 'penalty':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'group_contribution':
        return <Coins className="h-5 w-5 text-blue-500" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'wallet_topup':
      case 'commission':
      case 'receive':
      case 'contribution':
        return 'text-green-600 dark:text-green-400';
      case 'withdrawal':
      case 'send':
      case 'penalty':
        return 'text-red-600 dark:text-red-400';
      case 'group_contribution':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AjoPaySpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Transaction Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'The transaction you\'re looking for doesn\'t exist or you don\'t have permission to view it.'}
            </p>
            <Button onClick={() => router.push('/customer')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const amountNaira = transaction.amount_kobo / 100;
  const isCredit = ['deposit', 'wallet_topup', 'commission', 'receive', 'contribution'].includes(transaction.type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            onClick={() => router.push('/customer')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Transaction Details
          </h1>
        </motion.div>

        {/* Transaction Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTypeIcon(transaction.type)}
                  <div>
                    <CardTitle className="text-xl">
                      {transaction.description || transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).replace('_', ' ')}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(transaction.created_at), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(transaction.status)}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount */}
              <div className="text-center py-6 border-b">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Amount</p>
                <p className={`text-4xl font-bold ${getTypeColor(transaction.type)}`}>
                  {isCredit ? '+' : '-'}₦{amountNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Transaction Details */}
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Transaction ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{transaction.id}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(transaction.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Reference</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{transaction.reference}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(transaction.reference)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Type</span>
                  <Badge variant="outline">
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transaction.status)}
                    <span className="capitalize">{transaction.status}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Date & Time</span>
                  <span className="text-sm">
                    {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>

                {transaction.completed_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Completed</span>
                    <span className="text-sm">
                      {format(new Date(transaction.completed_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                )}
              </div>

              {/* Mock Data Notice */}
              {transaction.metadata?.isMockData && (
                <div className="border-t pt-4">
                  <div className={`rounded-lg p-4 ${
                    transaction.metadata?.isDatabaseError 
                      ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className={`h-5 w-5 ${
                        transaction.metadata?.isDatabaseError 
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`} />
                      <h3 className={`font-semibold ${
                        transaction.metadata?.isDatabaseError 
                          ? 'text-orange-800 dark:text-orange-200'
                          : 'text-blue-800 dark:text-blue-200'
                      }`}>
                        {transaction.metadata?.isDatabaseError 
                          ? 'Database Unavailable' 
                          : transaction.metadata?.isFallback 
                            ? 'Demo Data (Fallback)' 
                            : 'Demo Data'
                        }
                      </h3>
                    </div>
                    <p className={`text-sm ${
                      transaction.metadata?.isDatabaseError 
                        ? 'text-orange-700 dark:text-orange-300'
                        : 'text-blue-700 dark:text-blue-300'
                    }`}>
                      {transaction.metadata?.isDatabaseError 
                        ? 'The database is currently unavailable. This is demo data to show you what the transaction would look like. Please try again later.'
                        : transaction.metadata?.isFallback 
                          ? 'This is demo data created for testing purposes. The original transaction data could not be retrieved.'
                          : 'This is demo data for testing purposes. In a real scenario, this would be an actual transaction from your account.'
                      }
                    </p>
                    {transaction.metadata?.originalError && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer opacity-70 hover:opacity-100">
                          Technical Details
                        </summary>
                        <pre className="text-xs mt-1 opacity-60 overflow-auto">
                          {transaction.metadata.originalError}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {transaction.metadata && Object.keys(transaction.metadata).length > 0 && !transaction.metadata.isMockData && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Additional Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(transaction.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
