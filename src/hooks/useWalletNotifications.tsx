import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface WalletNotification {
  amount_kobo: number;
  amount_naira: number;
  provider_txn_id: string;
  timestamp: string;
  message: string;
}

export function useWalletNotifications(userId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to wallet funding events
    const walletChannel = supabase
      .channel(`wallet_notifications_${userId}`)
      .on("broadcast", { event: "wallet_funded" }, (payload: any) => {
        const notification = payload.payload as WalletNotification;
        
        // Show success toast with enhanced styling
        toast.success(
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
              <span className="text-white font-bold">₦</span>
            </div>
            <div>
              <div className="font-bold text-green-800 dark:text-green-200">
                Payment Confirmed! 🎉
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                ₦{notification.amount_naira.toLocaleString()} credited to your wallet
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                Transaction: {notification.provider_txn_id}
              </div>
            </div>
          </div>,
          {
            duration: 8000,
            className: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800",
          }
        );

        // Trigger browser notification if permission granted
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("Wallet Funded Successfully!", {
            body: `₦${notification.amount_naira.toLocaleString()} has been added to your Thriftly wallet`,
            icon: "/aj2.png",
            badge: "/aj2.png",
            tag: "wallet_funded",
            requireInteraction: true,
          });
        }

        // Haptic feedback on mobile
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([100, 50, 100, 50, 200]);
        }
      })
      .on("presence", { event: "sync" }, () => {
        setIsConnected(true);
      })
      .subscribe((status: any) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CLOSED") {
          setIsConnected(false);
        }
      });

    // Subscribe to wallet topup table changes for immediate feedback
    const topupChannel = supabase
      .channel("wallet_topups")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wallet_topups",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const topup = payload.new;
          const amount_naira = Math.round(topup.amount_kobo / 100);
          
          // Show immediate confirmation
          toast.success(
            <div className="flex items-center gap-3">
              <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-semibold">Wallet Update</div>
                <div className="text-sm">₦{amount_naira.toLocaleString()} processing...</div>
              </div>
            </div>,
            {
              duration: 3000,
              id: `topup_${topup.id}`,
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(topupChannel);
      setIsConnected(false);
    };
  }, [userId, supabase]);

  // Request notification permission on first use
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          toast.success("Notifications enabled! You'll get alerts when your wallet is funded.", {
            duration: 4000,
          });
        }
      });
    }
  }, []);

  return {
    isConnected,
  };
}
