'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { AjoPaySpinnerCompact } from '@/components/ui/AjoPaySpinner';
import { getSupabaseBrowserClient, TransactionType, TransactionStatus } from '@/lib/supabase';

interface TransactionNotificationProps {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  timestamp: Date;
  onDismiss: (id: string) => void;
  isCrypto?: boolean;
}

export function TransactionNotification({
  id,
  type,
  amount,
  status,
  timestamp,
  onDismiss,
  isCrypto = false
}: TransactionNotificationProps) {
  // Using NodeJS.Timeout for timerRef to properly type setTimeout return
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Play sound effect when status changes
  useEffect(() => {
    if (status === 'completed' && audioRef.current) {
      // Set the audio source based on the transaction type
      const audioSrc = type === 'commission' 
        ? '/sounds/coin.mp3' 
        : '/sounds/notification.mp3';
      
      // Only update source if it's different to avoid unnecessary reloads
      if (audioRef.current.src !== window.location.origin + audioSrc) {
        audioRef.current.src = audioSrc;
      }
      
      audioRef.current.play().catch(e => console.error('Audio play failed:', e));
    }
  }, [status, type]);
  
  // Add audio element to the component
  // This will be hidden but still play sounds
  const audioElement = (
    <audio 
      ref={audioRef} 
      preload="auto"
      className="hidden"
    />
  );

  // Auto-dismiss after 5 seconds if completed
  useEffect(() => {
    if (status === 'completed') {
      timerRef.current = setTimeout(() => {
        onDismiss(id);
      }, 5000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [id, status, onDismiss]);

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <AjoPaySpinnerCompact size="sm" className="text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'withdrawal': return 'Withdrawal';
      case 'commission': return 'Commission';
      case 'penalty': return 'Penalty';
      default: return 'Transaction';
    }
  };

  return (
    <>
      {audioElement}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
      >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {getStatusIcon()}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {getTypeLabel()} {status === 'completed' ? 'Completed' : status.charAt(0).toUpperCase() + status.slice(1)}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isCrypto 
                ? `${amount.toFixed(8)} BTC` 
                : `₦${(amount / 100).toLocaleString()}`}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }).format(timestamp)}
            </p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => onDismiss(id)}
            >
              <span className="sr-only">Close</span>
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar for pending transactions */}
      {status === 'pending' && (
        <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 30, ease: 'linear' }}
            onAnimationComplete={() => {
              if (status === 'pending') {
                onDismiss(id);
              }
            }}
          />
        </div>
      )}
      
    </motion.div>
    </>
  );
}

export function TransactionNotificationContainer() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'deposit' | 'withdrawal' | 'commission' | 'penalty';
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    timestamp: Date;
  }>>([]);
  const supabase = getSupabaseBrowserClient();

  // Subscribe to transaction changes
  useEffect(() => {
    const channel = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        (payload: { new: Record<string, unknown> }) => {
          const newTransaction = payload.new as {
            id: string;
            type: TransactionType;
            amount_kobo: number;
            status: TransactionStatus;
            created_at: string;
          };
          setNotifications(prev => [
            ...prev,
            {
              id: newTransaction.id,
              type: newTransaction.type,
              amount: newTransaction.amount_kobo,
              status: newTransaction.status,
              timestamp: new Date(newTransaction.created_at)
            }
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <TransactionNotification
            key={notification.id}
            id={notification.id}
            type={notification.type}
            amount={notification.amount}
            status={notification.status}
            timestamp={notification.timestamp}
            onDismiss={removeNotification}
            isCrypto={false}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
