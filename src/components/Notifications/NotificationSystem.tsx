"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Wallet, CheckCircle, AlertCircle, Plus, TrendingUp, TrendingDown, Send, CreditCard, DollarSign } from "lucide-react";
import { playDepositNotification } from "@/lib/sounds";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

interface NotificationSystemProps {
  userId?: string;
}

export function NotificationSystem({ userId }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!userId) return;

    // Load existing notifications
    const loadNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data as Notification[]);
        setUnreadCount((data as Notification[]).filter(n => !n.read).length);
      }
    };

    loadNotifications();

    // create channel then attach handlers (avoids chaining/brace issues)
    const notificationsChannel = supabase.channel("notifications");
    notificationsChannel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        const newNotification = payload.new as Notification;

        // Add to notifications list
        setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
        setUnreadCount(prev => prev + 1);

        // Show enhanced toast notification with sound
        if (newNotification.type === "wallet_funded") {
          const rawAmount = newNotification.data?.amount_naira ?? 0;
          const amount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount) || 0;
          const amountKobo = typeof newNotification.data?.amount_kobo === 'number' ? newNotification.data.amount_kobo : 0;
          const isLargeDeposit = typeof newNotification.data?.is_large_deposit === 'boolean' ? newNotification.data.is_large_deposit : false;

          // Play deposit notification sound
          playDepositNotification(amountKobo || 0, isLargeDeposit);
        } else if (newNotification.type === "withdrawal") {
          const rawAmount = newNotification.data?.amount_naira ?? 0;
          const amount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount) || 0;
          const amountKobo = typeof newNotification.data?.amount_kobo === 'number' ? newNotification.data.amount_kobo : 0;
          const status = newNotification.data?.status || 'pending';

          // Play withdrawal notification sound
          playDepositNotification(amountKobo || 0, false); // Use regular notification sound for withdrawals

          toast.success(
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20">
                <TrendingDown className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <div className="font-semibold">
                  {status === 'completed' ? "Withdrawal Completed! 📤" : "Withdrawal Initiated! 📤"}
                </div>
                <div className="text-sm opacity-80">₦{amount.toLocaleString()} withdrawn from your wallet</div>
              </div>
            </div>,
            {
              duration: 5000,
              className: "bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20",
            }
          );
        } else {
          // Handle other notification types
          toast.success(
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10">
                {getNotificationIcon(newNotification.type)}
              </div>
              <div>
                <div className="font-medium">{newNotification.title}</div>
                {newNotification.message && <div className="text-sm opacity-80">{newNotification.message}</div>}
              </div>
            </div>,
            { duration: 4000 }
          );
        }
      }
    );
    notificationsChannel.subscribe();

    // Listen for transaction changes
    const transactionsChannel = supabase.channel("transactions");
    transactionsChannel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "transactions",
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        const transaction = payload.new;
        console.log('New transaction detected:', transaction);
        
        // Create notification for transaction
        const transactionType = transaction.type || 'unknown';
        const amount = transaction.amount_kobo ? Math.round(transaction.amount_kobo / 100) : 0;
        
        let notificationTitle = '';
        let notificationMessage = '';
        let icon = <DollarSign className="w-4 h-4 text-blue-500" />;
        
        switch (transactionType) {
          case 'deposit':
            notificationTitle = 'Deposit Received! 💰';
            notificationMessage = `₦${amount.toLocaleString()} has been deposited to your wallet`;
            icon = <TrendingUp className="w-4 h-4 text-green-500" />;
            break;
          case 'withdrawal':
            notificationTitle = 'Withdrawal Processed! 📤';
            notificationMessage = `₦${amount.toLocaleString()} has been withdrawn from your wallet`;
            icon = <TrendingDown className="w-4 h-4 text-orange-500" />;
            break;
          case 'transfer':
            notificationTitle = 'Transfer Completed! 🔄';
            notificationMessage = `₦${amount.toLocaleString()} transfer has been processed`;
            icon = <Send className="w-4 h-4 text-blue-500" />;
            break;
          case 'commission':
            notificationTitle = 'Commission Earned! 🎉';
            notificationMessage = `₦${amount.toLocaleString()} commission has been added to your wallet`;
            icon = <CreditCard className="w-4 h-4 text-purple-500" />;
            break;
          default:
            notificationTitle = 'Transaction Update! 📊';
            notificationMessage = `A new transaction of ₦${amount.toLocaleString()} has been processed`;
        }
        
        // Show toast notification
        toast.success(
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20"
            >
              {icon}
            </motion.div>
            <div>
              <div className="font-semibold">{notificationTitle}</div>
              <div className="text-sm opacity-80">{notificationMessage}</div>
            </div>
          </div>,
          {
            duration: 5000,
            className: "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20",
          }
        );
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
      }
    );
    transactionsChannel.subscribe();

    // Listen for wallet funding broadcasts on a user-specific channel
    const walletChannel = supabase.channel(`user:${userId}`);
    walletChannel.on("broadcast", { event: "wallet_funded" }, (payload: any) => {
      const { amount_naira } = payload.payload ?? {};
      const amount = typeof amount_naira === "number" ? amount_naira : Number(amount_naira) || 0;

      // Show immediate visual feedback
      toast.success(
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
          >
            <Wallet className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <div className="font-bold">Payment Confirmed! 🎉</div>
            <div className="text-sm">₦{amount.toLocaleString()} credited instantly</div>
          </div>
        </div>,
        {
          duration: 6000,
          className: "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30",
        }
      );
    });
    walletChannel.subscribe();

    return () => {
      // cleanup channels
      try { supabase.removeChannel(notificationsChannel); } catch { /* ignore */ }
      try { supabase.removeChannel(transactionsChannel); } catch { /* ignore */ }
      try { supabase.removeChannel(walletChannel); } catch { /* ignore */ }
    };
  }, [userId, supabase]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "wallet_funded":
        return <Wallet className="w-4 h-4 text-green-500" />;
      case "deposit":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "withdrawal":
        return <TrendingDown className="w-4 h-4 text-orange-500" />;
      case "transfer":
        return <Send className="w-4 h-4 text-blue-500" />;
      case "commission":
        return <CreditCard className="w-4 h-4 text-purple-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg sm:rounded-xl">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Notifications</h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md sm:rounded-lg transition-all duration-200"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-80 sm:max-h-96 overflow-y-auto space-y-2 sm:space-y-3">
        {notifications.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No notifications yet</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              You'll see transaction updates and important alerts here
            </p>
          </div>
        ) : (
          notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${
                !notification.read 
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700" 
                  : "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-white/70 dark:hover:bg-gray-800/70"
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${
                  !notification.read 
                    ? "bg-gradient-to-br from-blue-500/20 to-indigo-500/20" 
                    : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800"
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1 sm:mb-2">
                    <h4 className="font-semibold text-gray-800 dark:text-white text-xs sm:text-sm leading-tight">
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0 mt-0.5 sm:mt-1" />
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed mb-1 sm:mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
