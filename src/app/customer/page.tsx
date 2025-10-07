"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import DashboardShell from "@/components/dashboard/Shell";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContributionSchema } from "@/lib/validators/contribution";
import type { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { SavingsGoals } from "@/components/Savings/SavingsGoals";
import { Gamification } from "@/components/Game/Gamification";
import { PeerChallenges } from "@/components/Peer/PeerChallenges";
import { SavingsCircles } from "@/components/Circle/SavingsCircle";
import { PersonalHealthDashboard } from "@/components/Monitoring/PersonalHealthDashboard";
import { Bitcoin, Coins, Wallet, Crown, Gem, Sparkles, TrendingUp, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { AfricanPatterns, AfricanGlassmorphismCard, AfricanButton } from "@/components/wallet/AfricanPatterns";
import { AdvancedLoadingSpinner, CardSkeleton } from "@/components/ui/loading-spinner";

export default function CustomerPage() {
  const USER_SETTINGS_BUCKET = process.env.NEXT_PUBLIC_USER_SETTINGS_BUCKET || 'user-settings';
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [amount, setAmount] = useState(200);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [walletNaira, setWalletNaira] = useState<number>(0);
  const [walletPulse, setWalletPulse] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ id: string; amount_kobo: number; contributed_at: string }>>([]);
  const [streak, setStreak] = useState<number>(0);
  const [isMockData, setIsMockData] = useState<boolean>(false);
  const [last7Naira, setLast7Naira] = useState<number>(0);
  const [prev7Naira, setPrev7Naira] = useState<number>(0);
  const [sparkPoints, setSparkPoints] = useState<string>("");
  const [autoMark, setAutoMark] = useState<boolean>(false);
  const [tab, setTab] = useState<"history" | "calendar">("history");
  const [windowOffset, setWindowOffset] = useState(0); // 0 = last 30 days ending today, 1 = previous 30-day window, etc.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [justMarked, setJustMarked] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState<number>(200);
  const [skipConfirm, setSkipConfirm] = useState<boolean>(false);
  const [profileSettings, setProfileSettings] = useState<Record<string, any> | null>(null);
  const [autoBusy, setAutoBusy] = useState<boolean>(false);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState("overview");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'ngn' | 'crypto'>('ngn');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const router = useRouter();
  const autoMarkFiredRef = useRef<string | null>(null);

  // Use schema INPUT type to align with zodResolver typing (coerce.number input is unknown)
  type ContributionFormValues = z.input<typeof ContributionSchema>;
  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(ContributionSchema),
    defaultValues: { amount: 200, proofUrl: "" },
  });

  const quick = [200, 500, 1000];

  const loadData = async () => {
    try {
      const res = await fetch('/api/customer/overview', { cache: 'no-store' });
      if (!res.ok) {
        console.error('Failed to load customer data:', res.status);
        return;
      }
      const j = await res.json();
      console.log('Customer data loaded:', j);
      setWalletNaira(j.walletNaira ?? 0);
      setHistory(j.history ?? []);
      setLast7Naira(j.last7Naira ?? 0);
      setPrev7Naira(j.prev7Naira ?? 0);
      setSparkPoints(j.sparkPoints ?? '');
      setStreak(j.streak ?? 0);
      setIsMockData(j.isMockData ?? false);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setInitialLoading(false);
    }

    // Load profile settings (try Firebase Storage first, then database, then localStorage)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Try Supabase Storage first (with proper error handling)
      try {
        const fileName = `${user.id}/settings.json`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from(USER_SETTINGS_BUCKET)
          .download(fileName);
        
        if (!storageError && storageData) {
          const text = await storageData.text();
          const settingsData = JSON.parse(text);
          const settings = settingsData.settings;
          
          if (settings) {
            setProfileSettings(settings);
            if (typeof settings.customer_skip_confirm === "boolean") {
              setSkipConfirm(settings.customer_skip_confirm);
            }
            if (typeof settings.customer_auto_mark === "boolean") {
              setAutoMark(settings.customer_auto_mark);
            }
            console.log('Settings loaded from Supabase Storage');
            return;
          }
        } else if (storageError) {
          const code = (storageError as any)?.statusCode ?? (storageError as any)?.status;
          const message = (storageError as any)?.message || 'Unknown storage error';
          
          // Log different types of errors appropriately
          if (code === 404) {
            console.log('Settings file not found in storage (this is normal for new users)');
          } else if (code === 400) {
            console.log('Storage bucket or permissions issue:', message);
          } else {
            console.log('Storage download failed:', message);
          }
        }
      } catch (storageAccessError) {
        console.log('Supabase Storage access failed:', storageAccessError);
      }
      
      console.log('Skipping database fallback to avoid profiles policy recursion; using localStorage next');
      
    } catch (error) {
      console.log('All storage methods failed, using localStorage fallback');
    }
    
    // Final fallback to localStorage
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try the new format first
        const localSettings = localStorage.getItem(`ajopay_settings_${user.id}`);
        if (localSettings) {
          const settingsData = JSON.parse(localSettings);
          if (settingsData.settings) {
            setProfileSettings(settingsData.settings);
            if (typeof settingsData.settings.customer_auto_mark === "boolean") {
              setAutoMark(settingsData.settings.customer_auto_mark);
            }
            console.log('Settings loaded from localStorage (new format)');
            return;
          }
        }
      }
      
      // Fallback to old format
      const localAutoMark = localStorage.getItem("cust_auto_mark");
      if (localAutoMark === "1") {
        setAutoMark(true);
        console.log('Settings loaded from localStorage (old format)');
      }
    } catch (localError) {
      console.warn('LocalStorage not available:', localError);
    }
  };

  const loadSampleData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sample-data', { method: 'POST' });
      if (res.ok) {
        toast.success("Sample data loaded successfully!");
        await loadData(); // Reload the dashboard data
      } else {
        toast.error("Failed to load sample data");
      }
    } catch (error) {
      toast.error("Error loading sample data");
    } finally {
      setLoading(false);
    }
  };

  // Initialize PSP checkout to fund wallet
  const fund = async () => {
    try {
      const amt = amount;
      if (amt < 200) throw new Error("Minimum is ₦200");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in");

      const email = (user as any)?.email || undefined;

      // Show loading toast
      toast.loading("Initializing payment...", { id: "fund-wallet" });

      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_kobo: amt * 100, user_id: user.id, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start payment");
      const url = data?.authorization_url as string | undefined;
      if (!url) throw new Error("No authorization URL");

      toast.success("Redirecting to payment...", { id: "fund-wallet" });
      window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message || "Failed to fund wallet", { id: "fund-wallet" });
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug: show Supabase envs and bucket (temporary; remove after diagnosing)
  useEffect(() => {
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || (globalThis as any)?.NEXT_PUBLIC_SUPABASE_URL;
      const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (globalThis as any)?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const USER_BUCKET = process.env.NEXT_PUBLIC_USER_SETTINGS_BUCKET || (globalThis as any)?.NEXT_PUBLIC_USER_SETTINGS_BUCKET;

      // eslint-disable-next-line no-console
      console.info('DEBUG: NEXT_PUBLIC_SUPABASE_URL =', SUPABASE_URL);
      if (ANON_KEY) {
        // eslint-disable-next-line no-console
        console.info('DEBUG: NEXT_PUBLIC_SUPABASE_ANON_KEY length =', (ANON_KEY as string).length,
          'preview =', (ANON_KEY as string).slice(0,6) + '...' + (ANON_KEY as string).slice(-6));
      } else {
        // eslint-disable-next-line no-console
        console.info('DEBUG: NEXT_PUBLIC_SUPABASE_ANON_KEY = <missing>');
      }
      // eslint-disable-next-line no-console
      console.info('DEBUG: USER_SETTINGS_BUCKET =', USER_BUCKET);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('DEBUG: failed to read envs', err);
    }
  }, []);

  // Realtime: refresh data when contributions for this user change
  useEffect(() => {
    let contributionsChannel: any = null;
    let settingsChannel: any = null;
    
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      
      // Subscribe to contributions changes
      contributionsChannel = supabase
        .channel("realtime:contributions:self")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "contributions", filter: `user_id=eq.${user.id}` },
          async (payload: any) => {
            // Optimistic UI: if today was just inserted, mark it immediately
            try {
              if (payload?.eventType === "INSERT") {
                const newRow = payload?.new as { id: string; amount_kobo: number; contributed_at: string } | undefined;
                if (newRow?.contributed_at) {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  if (newRow.contributed_at === todayStr) {
                    setHistory((prev) => {
                      if (prev.some((h) => h.id === newRow.id)) return prev;
                      return [
                        { id: newRow.id, amount_kobo: newRow.amount_kobo ?? 0, contributed_at: newRow.contributed_at },
                        ...prev,
                      ];
                    });
                    // Optimistically bump wallet balance
                    try {
                      const deltaNaira = Math.round(((newRow.amount_kobo ?? 0) as number) / 100);
                      if (deltaNaira > 0) {
                        setWalletNaira((prev) => Math.max(0, prev + deltaNaira));
                      }
                    } catch {}
                    setJustMarked(true);
                    setTimeout(() => setJustMarked(false), 900);
                  }
                }
              }
            } catch { }

            // Refresh data only for non-insert events to avoid potential policy recursion on immediate re-read
            if (payload?.eventType !== "INSERT") {
              await loadData();
            }
            // Pulse wallet subtly
            try {
              setWalletPulse(true);
              setTimeout(() => setWalletPulse(false), 600);
            } catch { }
            // Toast if today's contribution was recorded
            try {
              if (payload?.eventType === "INSERT") {
                const contributedAt = payload?.new?.contributed_at as string | undefined;
                const todayStr = new Date().toISOString().slice(0, 10);
                if (contributedAt === todayStr) {
                  toast.success("Contribution recorded");
                }
              }
            } catch { }
          }
        )
        .subscribe();

      // Subscribe to notifications for settings updates (real-time updates)
      settingsChannel = supabase
        .channel("realtime:settings:notifications")
        .on(
          "postgres_changes",
          { 
            event: "INSERT", 
            schema: "public", 
            table: "notifications", 
            filter: `user_id=eq.${user.id}` 
          },
          async (payload: any) => {
            console.log("Settings notification received:", payload);
            
            // Check if this is a settings update notification
            if (payload?.new?.event === "settings_updated") {
              const newSettings = payload?.new?.payload?.settings;
              if (newSettings) {
                setProfileSettings(newSettings);
                
                // Update auto-mark setting if it changed
                if (typeof newSettings.customer_auto_mark === "boolean") {
                  setAutoMark(newSettings.customer_auto_mark);
                  toast.success(`Auto-mark ${newSettings.customer_auto_mark ? 'enabled' : 'disabled'} (real-time update)`);
                }
              }
            }
          }
        )
        .subscribe();
        
    })();
    
    return () => {
      if (contributionsChannel) supabase.removeChannel(contributionsChannel);
      if (settingsChannel) supabase.removeChannel(settingsChannel);
    };
  }, [supabase]);


  // Persist auto-mark preference when toggled using Firebase Storage
  const toggleAutoMark = async (val: boolean) => {
    setAutoMark(val);
    setSavingSettings(true);
    
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      
      // Create settings object
      const nextSettings = { ...(profileSettings || {}), customer_auto_mark: val };
      
      // Try to save to Firebase Storage first
      try {
        // Create a simple JSON file in Firebase Storage
        const settingsData = {
          userId: user.id,
          settings: nextSettings,
          updatedAt: new Date().toISOString()
        };
        
        // Try to use Supabase Storage to store settings (browser: upload Blob)
        try {
          const fileName = `${user.id}/settings.json`;
          const blob = new Blob([JSON.stringify(settingsData)], { type: 'application/json' });
          const { error: uploadError } = await supabase.storage
            .from(USER_SETTINGS_BUCKET)
            .upload(fileName, blob, {
              contentType: 'application/json',
              upsert: true
            });
          
          if (uploadError) {
            const code = (uploadError as any)?.statusCode ?? (uploadError as any)?.status;
            const message = (uploadError as any)?.message || 'Unknown upload error';
            
            if (code === 400) {
              console.log('Storage bucket or permissions issue:', message);
            } else {
              console.log('Storage upload failed:', message);
            }
            
            // Fallback to localStorage
            localStorage.setItem(`ajopay_settings_${user.id}`, JSON.stringify(settingsData));
            setProfileSettings(nextSettings);
            toast.success(val ? "Auto-mark enabled (saved locally)" : "Auto-mark disabled (saved locally)");
            return;
          }
          
          // Success - saved to Supabase Storage
          setProfileSettings(nextSettings);
          toast.success(val ? "Auto-mark enabled (saved to cloud)" : "Auto-mark disabled (saved to cloud)");
        } catch (storageError) {
          console.log('Supabase Storage upload failed:', storageError);
          
          // Fallback to localStorage
          localStorage.setItem(`ajopay_settings_${user.id}`, JSON.stringify(settingsData));
          setProfileSettings(nextSettings);
          toast.success(val ? "Auto-mark enabled (saved locally)" : "Auto-mark disabled (saved locally)");
          return;
        }
        
        // Trigger real-time update for other sessions
        await triggerSettingsUpdate(user.id, nextSettings);
        
      } catch (storageError) {
        console.log('Cloud storage failed, using localStorage...');
        // Final fallback to localStorage
        localStorage.setItem("cust_auto_mark", val ? "1" : "0");
        setProfileSettings(nextSettings);
        toast.message(val ? "Auto-mark enabled (local storage)" : "Auto-mark disabled (local storage)");
      }
      
    } catch (error) {
      console.warn('Settings update error:', error);
      // Fallback to localStorage
      localStorage.setItem("cust_auto_mark", val ? "1" : "0");
      setProfileSettings({ ...(profileSettings || {}), customer_auto_mark: val });
      toast.message(val ? "Auto-mark enabled (local storage)" : "Auto-mark disabled (local storage)");
    } finally {
      setSavingSettings(false);
    }
  };

  // Function to trigger real-time updates for settings
  const triggerSettingsUpdate = async (userId: string, settings: any) => {
    try {
      // Create a notification to trigger real-time update
      await supabase.from("notifications").insert({
        user_id: userId,
        event: "settings_updated",
        payload: { settings }
      });
    } catch (error) {
      console.log('Could not trigger real-time update:', error);
    }
  };

  // Auto-mark today's contribution once when enabled and not yet contributed
  useEffect(() => {
    if (!autoMark) return;
    const today = new Date().toISOString().slice(0, 10);
    if (autoMarkFiredRef.current === today) return;
    const hasToday = history.some((h) => h.contributed_at === today);
    if (hasToday) {
      autoMarkFiredRef.current = today;
      return;
    }
    try {
      const last = localStorage.getItem("cust_auto_mark_last");
      if (last === today) return;
    } catch { }
    if (autoBusy) return;
    setAutoBusy(true);
    (async () => {
      try {
        autoMarkFiredRef.current = today;
        await submit();
        try { localStorage.setItem("cust_auto_mark_last", today); } catch { }
      } finally {
        setAutoBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMark, history]);

  useEffect(() => {
    try {
      const v = localStorage.getItem("cust_skip_confirm");
      setSkipConfirm(v === "1");
    } catch { }
  }, []);

  const submit = async (overrideAmount?: number) => {
    setLoading(true);
    setMessage(null);
    try {
      const amt = typeof overrideAmount === "number" ? overrideAmount : amount;
      if (amt < 200) throw new Error("Minimum is ₦200");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in");

      // Call server API to insert contribution with service role
      const res = await fetch("/api/contributions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          amount_kobo: amt * 100,
          method: "wallet",
          status: "confirmed",
          contributed_at: new Date().toISOString().slice(0, 10),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to insert contribution");
      setMessage(`Marked contribution: ₦${amt}`);
      toast.success(`Marked contribution: ₦${amt}`);
      setAmount(200);
      form.reset({ amount: 200, proofUrl: "" });
      // Defer to realtime/optimistic updates to refresh UI; avoid immediate re-read to prevent policy recursion
    } catch (err: any) {
      setMessage(err.message ?? "Failed to contribute");
      toast.error(err.message ?? "Failed to contribute");
    } finally {
      setLoading(false);
    }
  };


  const handleWalletToggle = (type: 'ngn' | 'crypto') => {
    if (type === walletType) {
      // If clicking the already active tab, navigate to the wallet page
      router.push(`/wallet/${type}`);
    } else {
      // If switching between NGN and Crypto, just update the UI state
      setWalletType(type);
    }
  };

  if (initialLoading) {
    return (
      <DashboardShell role="customer" title="Customer Dashboard">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between gap-4">
            <div className="h-8 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-8 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>

          {/* Insights skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CardSkeleton className="h-24" />
            <CardSkeleton className="h-24" />
          </div>

          {/* Wallet section skeleton */}
          <CardSkeleton className="h-40" />

          {/* Quick actions skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardSkeleton className="h-32" />
            <CardSkeleton className="h-32" />
            <CardSkeleton className="h-32" />
          </div>

          {/* Tabs skeleton */}
          <div className="space-y-4">
            <div className="h-10 w-64 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <CardSkeleton className="h-64" />
          </div>

          {/* Loading indicator */}
          <div className="flex justify-center py-8">
            <AdvancedLoadingSpinner 
              text="Loading Your Dashboard" 
              size="lg"
            />
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="customer" title="Customer Dashboard">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 p-4 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between">
              <div className="text-sm opacity-70">Last 7 days</div>
              {isMockData && (
                <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                  Demo Data
                </div>
              )}
            </div>
            <div className="mt-1 text-2xl font-semibold">₦{last7Naira.toLocaleString()}</div>
            {(() => {
              const up = prev7Naira === 0 ? last7Naira > 0 : last7Naira >= prev7Naira;
              const pct = prev7Naira === 0 ? (last7Naira > 0 ? 100 : 0) : Math.round(((last7Naira - prev7Naira) / prev7Naira) * 100);
              return (
                <div className={`mt-1 inline-flex items-center gap-1 text-xs ${up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  <span>{up ? "▲" : "▼"}</span>
                  <span>{isFinite(pct) ? pct : 0}% WoW</span>
                </div>
              );
            })()}
            {sparkPoints && (
              <svg viewBox="0 0 100 26" className="mt-2 w-full h-7 opacity-80">
                <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={sparkPoints} />
              </svg>
            )}
          </div>
          <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 p-4 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between">
              <div className="text-sm opacity-70">Total contributions</div>
              {isMockData && (
                <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                  Demo Data
                </div>
              )}
            </div>
            <div className={`mt-1 text-2xl font-semibold ${walletPulse ? "animate-pulse" : ""}`}>₦{walletNaira.toLocaleString()}</div>
            <div className="mt-1 text-xs opacity-70">All time</div>
          </div>
        </div>

        {/* Sample Data Button - Show when no data and not using mock data */}
        {walletNaira === 0 && last7Naira === 0 && !isMockData && (
          <div className="rounded-2xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-6 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            <div className="text-center space-y-4">
              <div className="text-orange-800 dark:text-orange-200">
                <h3 className="text-lg font-semibold mb-2">🚀 Welcome to Your Dashboard!</h3>
                <p className="text-sm opacity-80">
                  Start by loading some sample data to see how your savings dashboard works, or make your first contribution!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={loadSampleData}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Loading..." : "📊 Load Sample Data"}
                </button>
                <button
                  onClick={() => submit(200)}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "💰 Make First Contribution"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl rounded-2xl p-3 shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="relative h-7 w-7">
              <Image src="/aj2.png" alt="Ajopay" fill sizes="28px" className="object-contain" />
            </div>
            <h1 className="text-xl font-semibold">Customer Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Connection Status */}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ y: -4, scale: 1.02 }} 
            transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}
            className="cursor-pointer"
            onClick={() => router.push(`/wallet/${walletType}`)}
          >
            <AfricanGlassmorphismCard className="overflow-hidden">
              {/* African Patterns Background */}
              <AfricanPatterns />
              
              <div className="relative z-10 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="p-3 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-2xl backdrop-blur-sm border border-white/30 shadow-lg">
                        <Wallet className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <Gem className="h-1.5 w-1.5 text-white" />
                      </div>
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        Digital Wallet
                        <Crown className="h-4 w-4 text-amber-500" />
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {walletType === 'ngn' ? 'Nigerian Naira' : 'Bitcoin & Crypto'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setBalanceVisible(!balanceVisible);
                    }}
                    className="p-2 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-gray-800 dark:text-white rounded-lg transition-all duration-300"
                  >
                    {balanceVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                </div>

                {/* Wallet Type Toggle */}
                <div className="mb-6">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1 border border-white/30">
                    <div className="flex">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWalletToggle('ngn');
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 relative flex-1 ${
                          walletType === 'ngn'
                            ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-gray-800 shadow-lg'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Coins className="h-3 w-3" />
                        NGN
                        {walletType === 'ngn' && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWalletToggle('crypto');
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 relative flex-1 ${
                          walletType === 'crypto'
                            ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-gray-800 shadow-lg'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Bitcoin className="h-3 w-3" />
                        Crypto
                        {walletType === 'crypto' && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Balance Display */}
                <div className="text-center mb-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-2"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm border border-white/30">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Available Balance</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className={`text-2xl font-bold transition-all ${walletPulse ? "animate-pulse" : ""} bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent`}
                  >
                    {balanceVisible ? (
                      walletType === 'crypto' ? (
                        <>
                          <div>0.00000000 BTC</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            ≈ $0.00
                            <span className="text-xs text-green-500">+2.5%</span>
                          </div>
                        </>
                      ) : (
                        `₦${walletNaira.toLocaleString()}`
                      )
                    ) : (
                      '••••••'
                    )}
                  </motion.div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-70 text-gray-600 dark:text-gray-300">
                    {walletType === 'crypto' ? 'Multi-chain support' : 'Personal savings wallet'}
                  </span>
                  <div className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
                    View details
                    <Sparkles className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </AfricanGlassmorphismCard>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
            <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
              <CardHeader>
                <CardTitle>Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{streak} day{streak === 1 ? "" : "s"}</div>
                <div className="text-xs opacity-70">Keep going for rewards</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
          <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle>Quick Contribution</CardTitle>
                <span className="text-xs opacity-70">Minimum ₦200</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Label htmlFor="amount" className="text-sm flex-shrink-0">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={200}
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))}
                    className="w-28 sm:w-32 flex-shrink-0"
                  />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch 
                    id="auto" 
                    checked={autoMark} 
                    onCheckedChange={toggleAutoMark}
                    disabled={savingSettings}
                  />
                  <Label htmlFor="auto" className="text-sm whitespace-nowrap">
                    Auto-mark
                    {savingSettings && (
                      <span className="ml-2 text-xs opacity-70">Saving...</span>
                    )}
                  </Label>
                </div>
              </div>

              <ToggleGroup type="single" value={String(amount)} aria-label="Quick amounts" className="justify-center sm:justify-start gap-2 flex-wrap">
                {quick.map((q) => (
                  <ToggleGroupItem
                    key={q}
                    value={String(q)}
                    aria-label={`₦${q}`}
                    onClick={() => setAmount(q)}
                    className="h-11 sm:h-9 px-3 min-w-[4.5rem] flex-shrink-0"
                  >
                    ₦{q}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => void submit()} disabled={loading} className="h-11 sm:h-10 flex-1 sm:flex-none">
                  {loading ? "Submitting..." : "Submit"}
                </Button>
                <Button variant="outline" onClick={() => void fund()} className="h-11 sm:h-10 flex-1 sm:flex-none">
                  Fund Wallet
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="h-11 sm:h-10 flex-1 sm:flex-none">Contribute now…</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contribute</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const raw = form.getValues();
                        const v = ContributionSchema.parse(raw); // ensures amount is number
                        setAmount(v.amount);
                        submit(v.amount);
                      }}
                      className="space-y-4"
                    >
                      <div className="grid gap-2">
                        <Label htmlFor="dlg-amount">Amount</Label>
                        <Input
                          id="dlg-amount"
                          type="number"
                          min={200}
                          {...form.register("amount", { valueAsNumber: true })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="proof">Proof URL (optional)</Label>
                        <Input id="proof" type="url" placeholder="https://..." {...form.register("proofUrl")} />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={loading} className="h-11 sm:h-10">{loading ? "Submitting..." : "Submit"}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              {message && <p className="text-sm opacity-80">{message}</p>}
            </CardContent>
          </Card>
        </motion.div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="flex flex-wrap gap-2 w-full">
            <TabsTrigger value="history" className="flex-1 sm:flex-none">History</TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1 sm:flex-none">Card Grid</TabsTrigger>
          </TabsList>
          <TabsContent value="history">
            <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
              <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
                <CardHeader>
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <p className="opacity-70 text-sm">No contributions yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-sm">
                      {history.map((h) => (
                        <li key={h.id} className="flex justify-between border-b pb-1 border-neutral-800">
                          <span>{format(new Date(h.contributed_at), "PPP")}</span>
                          <span>₦{Math.round((h.amount_kobo ?? 0) / 100).toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          <TabsContent value="calendar">
            <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
              <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>Active Card • 30 days</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        className="h-8 px-2 text-xs"
                        onClick={() => setWindowOffset((v) => v + 1)}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-8 px-2 text-xs"
                        onClick={() => setWindowOffset((v) => Math.max(0, v - 1))}
                        disabled={windowOffset === 0}
                      >
                        Next
                      </Button>
                      <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setTab("history")}>View History</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const today = new Date();
                    const end = new Date();
                    end.setDate(today.getDate() - windowOffset * 30);
                    const start = new Date(end);
                    start.setDate(end.getDate() - 29);
                    const dateToIso = (d: Date) => d.toISOString().slice(0, 10);
                    const contributedSet = new Set(history.map((h) => h.contributed_at));
                    const days = Array.from({ length: 30 }, (_, i) => {
                      const d = new Date(start);
                      d.setDate(start.getDate() + i);
                      const iso = dateToIso(d);
                      const isToday = iso === dateToIso(today) && windowOffset === 0;
                      const didContribute = contributedSet.has(iso);
                      return { i: i + 1, iso, isToday, didContribute };
                    });
                    const contributedDays = days.reduce((acc, d) => acc + (d.didContribute ? 1 : 0), 0);
                    const pct = Math.round((contributedDays / 30) * 100);
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs opacity-80">
                          <span>{contributedDays}/30 days contributed</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                          <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                          {days.map((d) => (
                            <div
                              key={d.iso}
                              className={
                                "relative h-10 rounded-md border text-sm grid place-items-center select-none transition-colors " +
                                (d.didContribute
                                  ? "bg-emerald-900/40 border-emerald-700 text-emerald-100"
                                  : "bg-neutral-900/40 border-neutral-800 hover:bg-neutral-800/50") +
                                (d.isToday ? " ring-1 ring-violet-500 cursor-pointer" : "") +
                                (d.isToday && justMarked ? " ring-2 ring-emerald-500" : "")
                              }
                              title={`${d.iso}${d.didContribute ? " • contributed" : ""}`}
                              role={d.isToday ? "button" : undefined}
                              aria-pressed={d.isToday && d.didContribute ? true : undefined}
                              onClick={() => {
                                if (!d.isToday) return;
                                if (d.didContribute) return;
                                setConfirmOpen(true);
                              }}
                            >
                              {d.i}
                              {d.isToday && justMarked && (
                                <span className="pointer-events-none absolute inset-0 rounded-md animate-ping ring-2 ring-emerald-500/60" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Personal Health Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PersonalHealthDashboard />
        </motion.div>

        {/* Confirm mark dialog */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark today as contributed?</AlertDialogTitle>
              <AlertDialogDescription>
                This will record ₦{amount} for today. You can change the amount above.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  try { if (typeof navigator !== "undefined" && "vibrate" in navigator) (navigator as any).vibrate?.(10); } catch { }
                  setConfirmOpen(false);
                  await submit();
                  setJustMarked(true);
                  setTimeout(() => setJustMarked(false), 900);
                }}
              >
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardShell>
  );
}
