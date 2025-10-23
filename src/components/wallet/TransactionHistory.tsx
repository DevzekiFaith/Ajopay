'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { AjoPaySpinnerCompact } from '@/components/ui/AjoPaySpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 10;

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

interface TransactionHistoryProps {
  userId: string;
  isCrypto?: boolean;
}

export function TransactionHistory({ userId, isCrypto = false }: TransactionHistoryProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [exporting, setExporting] = useState(false);
  
  const supabase = getSupabaseBrowserClient();

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build the query
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      // Apply filters
      if (searchQuery) {
        query = query.or(
          `reference.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        );
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, count, error } = await query;
      
      if (error) throw error;
      
      setTransactions(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, page, searchQuery, statusFilter, typeFilter, supabase]);

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, fetchTransactions]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const csvContent = [
        ['Date', 'Type', 'Status', 'Amount', 'Reference', 'Description'],
        ...(data || []).map((tx: any) => [
          new Date(tx.created_at).toLocaleString(),
          tx.type,
          tx.status,
          isCrypto ? `${(tx.amount_kobo / 100000000).toFixed(8)} BTC` : `₦${(tx.amount_kobo / 100).toFixed(2)}`,
          tx.reference,
          tx.description || ''
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: string }> = {
      deposit: { label: 'Deposit', variant: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      withdrawal: { label: 'Withdrawal', variant: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
      commission: { label: 'Commission', variant: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      penalty: { label: 'Penalty', variant: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    };

    const typeInfo = typeMap[type] || { label: type, variant: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    
    return <Badge className={typeInfo.variant}>{typeInfo.label}</Badge>;
  };

  // Loading skeleton
  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search transactions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
              <SelectItem value="penalty">Penalty</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <AjoPaySpinnerCompact size="sm" className="mr-2" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
        </div>
      </div>
      
      {/* Transactions */}
      <div className="space-y-2">
        <AnimatePresence>
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
              onClick={() => router.push(`/transaction/${tx.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </p>
                    {getStatusBadge(tx.status)}
                    {getTypeBadge(tx.type)}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(tx.created_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {format(new Date(tx.created_at), 'h:mm a')}
                    </p>
                  </div>
                  {tx.reference && (
                    <p className="text-xs text-gray-400 font-mono">
                      Ref: {tx.reference}
                    </p>
                  )}
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <p className={`font-medium ${tx.type === 'withdrawal' || tx.type === 'penalty' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {tx.type === 'withdrawal' || tx.type === 'penalty' ? '-' : '+'}
                      {isCrypto 
                        ? `${(tx.amount_kobo / 100000000).toFixed(8)} BTC` 
                        : `₦${(tx.amount_kobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    </p>
                  </div>
                  <span className="text-gray-400 group-hover:text-orange-500 transition-colors">→</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {transactions.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No transactions found
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          
          <div className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
