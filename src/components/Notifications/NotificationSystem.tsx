"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Wallet, CheckCircle, AlertCircle, Plus } from "lucide-react";
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
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    };

    loadNotifications();

    // Listen for real-time notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
          setUnreadCount(prev => prev + 1);

          // Show enhanced toast notification with sound
          if (newNotification.type === "wallet_funded") {
            const amount = newNotification.data?.amount_naira || 0;
            const amountKobo = newNotification.data?.amount_kobo || 0;
            const isLargeDeposit = newNotification.data?.is_large_deposit || false;
            
            // Play deposit notification sound
            playDepositNotification(amountKobo, isLargeDeposit);
            
            toast.success(
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
                  <Plus className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <div className="font-semibold">
                    {isLargeDeposit ? "Large Deposit Received! 🎉" : "Wallet Funded! 💰"}
                  </div>
                  <div className="text-sm opacity-80">₦{amount.toLocaleString()} added to your wallet</div>
                </div>
              </div>,
              {
                duration: isLargeDeposit ? 7000 : 5000,
                className: isLargeDeposit 
                  ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
                  : "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20",
              }
            );
            
            // Show browser notification for large deposits
            if (isLargeDeposit && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('AjoPay - Large Deposit! 🎉', {
                body: `₦${amount.toLocaleString()} has been added to your wallet`,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'large-deposit'
              });
            }
          } else {
            toast.success(newNotification.title, {
              description: newNotification.message,
              duration: 4000,
            });
          }
        }
      )
      .subscribe();

    // Listen for wallet funding broadcasts
    const walletChannel = supabase
      .channel(`user:${userId}`)
      .on("broadcast", { event: "wallet_funded" }, (payload) => {
        const { amount_naira, message } = payload.payload;
        
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
              <div className="text-sm">₦{amount_naira.toLocaleString()} credited instantly</div>
            </div>
          </div>,
          {
            duration: 6000,
            className: "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30",
          }
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(walletChannel);
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
    <div className="relative">
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-xl transition-all duration-300 z-40"
      >
        <Bell className="w-5 h-5 text-black dark:text-white" />
        {unreadCount > 0 ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white z-50"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full z-50"
          />
        )}
      </motion.button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <>
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[2147483647]"
              onClick={() => setShowNotifications(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl z-[2147483647]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="font-semibold text-black dark:text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-black/60 dark:text-white/60" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-black/60 dark:text-white/60">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                        !notification.read ? "bg-blue-500/5" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-black dark:text-white text-sm truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-black/70 dark:text-white/70 text-xs leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-black/50 dark:text-white/50 text-xs mt-1">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
