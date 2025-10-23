"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { toast } from "sonner";

interface NotificationBellProps {
  userId?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function NotificationBell({ 
  userId, 
  className = "", 
  size = "md",
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!userId) return;

    // Load initial unread count
    const loadUnreadCount = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("read", false);
      
      if (data) {
        setUnreadCount(data.length);
      }
    };

    loadUnreadCount();

    // Listen for new notifications
    const notificationsChannel = supabase.channel("bell-notifications");
    notificationsChannel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        setUnreadCount(prev => prev + 1);
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 2000);
      }
    );
    notificationsChannel.subscribe();

    // Listen for transaction changes
    const transactionsChannel = supabase.channel("bell-transactions");
    transactionsChannel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "transactions",
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        setUnreadCount(prev => prev + 1);
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 2000);
      }
    );
    transactionsChannel.subscribe();

    return () => {
      try { supabase.removeChannel(notificationsChannel); } catch { /* ignore */ }
      try { supabase.removeChannel(transactionsChannel); } catch { /* ignore */ }
    };
  }, [userId, supabase]);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  const badgeSizeClasses = {
    sm: "w-3 h-3 text-[8px]",
    md: "w-4 h-4 text-[10px]",
    lg: "w-5 h-5 text-xs"
  };

  const badgePositionClasses = {
    sm: "-top-0.5 -right-0.5",
    md: "-top-1 -right-1",
    lg: "-top-1.5 -right-1.5"
  };

  const handleClick = () => {
    // Trigger a custom event that the parent can listen to
    const event = new CustomEvent('notificationBellClick', { 
      detail: { userId, unreadCount } 
    });
    window.dispatchEvent(event);
    
    // Also show a toast with notification summary
    if (unreadCount > 0) {
      toast.info(`You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`, {
        duration: 3000,
        className: "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20",
      });
    } else {
      toast.success("All caught up! No new notifications", {
        duration: 2000,
        className: "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20",
      });
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`relative ${className}`}
    >
      <Bell className={`${sizeClasses[size]} text-current ${isPulsing ? 'animate-pulse' : ''}`} />
      
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute ${badgePositionClasses[size]} ${badgeSizeClasses[size]} bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold z-50 shadow-lg border border-white/20`}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </motion.div>
      )}
      
      {unreadCount === 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute ${badgePositionClasses[size]} ${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-3 h-3'} bg-gradient-to-r from-green-500 to-emerald-500 rounded-full z-50 shadow-sm border border-white/20`}
        />
      )}
    </motion.button>
  );
}
