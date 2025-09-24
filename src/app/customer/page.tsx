"use client";

import { useEffect, useMemo, useState } from "react";
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
import { CommissionTracking } from "@/components/Commission/CommissionTracking";
import { PersonalHealthDashboard } from "@/components/Monitoring/PersonalHealthDashboard";
import { Bitcoin, Coins } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CustomerPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [amount, setAmount] = useState(200);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [walletNaira, setWalletNaira] = useState<number>(0);
  const [walletPulse, setWalletPulse] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ id: string; amount_kobo: number; contributed_at: string }>>([]);
  const [streak, setStreak] = useState<number>(0);
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
  const [activeFeatureTab, setActiveFeatureTab] = useState("overview");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'ngn' | 'crypto'>('ngn');
  const router = useRouter();

  // Use schema INPUT type to align with zodResolver typing (coerce.number input is unknown)
  type ContributionFormValues = z.input<typeof ContributionSchema>;
  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(ContributionSchema),
    defaultValues: { amount: 200, proofUrl: "" },
  });

  const quick = [200, 500, 1000];

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Set current user ID for notifications
    setCurrentUserId(user.id);

    // Wallet total
    const { data: sumRows, error: sumErr } = await supabase
      .from("contributions")
      .select("amount_kobo")
      .eq("user_id", user.id);
    if (!sumErr && sumRows) {
      const totalKobo = sumRows.reduce((acc, r) => acc + (r.amount_kobo ?? 0), 0);
      setWalletNaira(Math.round(totalKobo / 100));
    }

    // Recent history
    const { data: hist, error: histErr } = await supabase
      .from("contributions")
      .select("id, amount_kobo, contributed_at")
      .eq("user_id", user.id)
      .order("contributed_at", { ascending: false })
      .limit(60);
    if (!histErr && hist) setHistory(hist);

    // KPI: last 7 days vs previous 7 days (sum in ₦)
    try {
      const today = new Date();
      const toIso = (d: Date) => d.toISOString().slice(0, 10);
      const end = new Date(toIso(today)); // strip time
      const start14 = new Date(end);
      start14.setDate(end.getDate() - 13); // inclusive 14 days
      const { data: krows } = await supabase
        .from("contributions")
        .select("amount_kobo, contributed_at")
        .eq("user_id", user.id)
        .gte("contributed_at", toIso(start14))
        .lte("contributed_at", toIso(end));
      const rows14 = (krows as any[]) ?? [];
      const last7Start = new Date(end);
      last7Start.setDate(end.getDate() - 6);
      const prev7Start = new Date(end);
      prev7Start.setDate(end.getDate() - 13);
      const prev7End = new Date(end);
      prev7End.setDate(end.getDate() - 7);
      let last7 = 0, prev7 = 0;
      for (const r of rows14) {
        const d = (r.contributed_at || "").slice(0, 10);
        if (!d) continue;
        if (d >= toIso(last7Start) && d <= toIso(end)) last7 += (r.amount_kobo ?? 0);
        else if (d >= toIso(prev7Start) && d <= toIso(prev7End)) prev7 += (r.amount_kobo ?? 0);
      }
      setLast7Naira(Math.round(last7 / 100));
      setPrev7Naira(Math.round(prev7 / 100));

      // Build 14-day sparkline points (₦ per day)
      const days = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date(end);
        d.setDate(end.getDate() - (13 - i));
        return toIso(d);
      });
      const daySums: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
      for (const r of rows14) {
        const d = (r.contributed_at || "").slice(0, 10);
        if (d && d in daySums) daySums[d] += Math.round(((r.amount_kobo ?? 0) as number) / 100);
      }
      const series = days.map((d) => daySums[d] ?? 0);
      const maxVal = Math.max(1, ...series);
      const pts = series
        .map((v, i) => {
          const x = (i / (series.length - 1)) * 100;
          const y = 26 - (v / maxVal) * 26;
          return `${x},${y}`;
        })
        .join(" ");
      setSparkPoints(pts);
    } catch { }

    // Streak: compute consecutive days including today if contributed
    const dates = new Set((hist ?? []).map((h) => h.contributed_at));
    const todayStr = new Date().toISOString().slice(0, 10);
    let s = 0;
    let cursor = new Date(todayStr);
    // If no contribution today, start from yesterday
    if (!dates.has(todayStr)) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (true) {
      const iso = cursor.toISOString().slice(0, 10);
      if (dates.has(iso)) {
        s += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    setStreak(s);

    // Load profile settings (for persisted preferences)
    const { data: me } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", user.id)
      .maybeSingle();
    const settings = (me as any)?.settings ?? null;
    if (settings) {
      setProfileSettings(settings);
      if (typeof settings.customer_skip_confirm === "boolean") {
        setSkipConfirm(settings.customer_skip_confirm);
      }
      if (typeof settings.customer_auto_mark === "boolean") {
        setAutoMark(settings.customer_auto_mark);
      }
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

  // Realtime: refresh data when contributions for this user change
  useEffect(() => {
    let channel: any = null;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
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
                    setJustMarked(true);
                    setTimeout(() => setJustMarked(false), 900);
                  }
                }
              }
            } catch { }

            // Refresh data (wallet, KPIs, streak, settings)
            await loadData();
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
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);


  // Persist auto-mark preference when toggled
  const toggleAutoMark = async (val: boolean) => {
    setAutoMark(val);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const nextSettings = { ...(profileSettings || {}), customer_auto_mark: val };
      await supabase.from("profiles").update({ settings: nextSettings }).eq("id", user.id);
      setProfileSettings(nextSettings);
      toast.message(val ? "Auto-mark enabled" : "Auto-mark disabled");
    } catch { }
  };

  // Auto-mark today's contribution once when enabled and not yet contributed
  useEffect(() => {
    if (!autoMark) return;
    const today = new Date().toISOString().slice(0, 10);
    const hasToday = history.some((h) => h.contributed_at === today);
    if (hasToday) return;
    try {
      const last = localStorage.getItem("cust_auto_mark_last");
      if (last === today) return;
    } catch { }
    if (autoBusy) return;
    setAutoBusy(true);
    (async () => {
      try {
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

      const { error } = await supabase.from("contributions").insert({
        user_id: user.id,
        amount_kobo: amt * 100,
        method: "wallet",
        status: "confirmed",
        contributed_at: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      setMessage(`Marked contribution: ₦${amt}`);
      toast.success(`Marked contribution: ₦${amt}`);
      setAmount(200);
      form.reset({ amount: 200, proofUrl: "" });
      await loadData();
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

  return (
    <DashboardShell role="customer" title="Customer Dashboard">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 p-4 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            <div className="text-sm opacity-70">Last 7 days</div>
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
            <div className="text-sm opacity-70">Total contributions</div>
            <div className={`mt-1 text-2xl font-semibold ${walletPulse ? "animate-pulse" : ""}`}>₦{walletNaira.toLocaleString()}</div>
            <div className="mt-1 text-xs opacity-70">All time</div>
          </div>
        </div>
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
          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
            <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)] cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Digital Wallet</CardTitle>
                  <ToggleGroup
                    type="single"
                    value={walletType}
                    onValueChange={(value: 'ngn' | 'crypto') => handleWalletToggle(value as 'ngn' | 'crypto')}
                    className="bg-white/5 p-0.5 rounded-lg border border-white/10 h-8"
                  >
                    <ToggleGroupItem
                      value="ngn"
                      className={`h-7 px-2 text-xs ${walletType === 'ngn' ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'}`}
                    >
                      <Coins className="h-3 w-3 mr-1.5" />
                      NGN
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="crypto"
                      className={`h-7 px-2 text-xs ${walletType === 'crypto' ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'}`}
                    >
                      <Bitcoin className="h-3 w-3 mr-1.5" />
                      Crypto
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardHeader>
              <CardContent
                className="group-hover:bg-white/5 transition-colors rounded-b-lg"
                onClick={() => router.push(`/wallet/${walletType}`)}
              >
                <div className={`text-3xl font-semibold transition-all ${walletPulse ? "animate-pulse" : ""}`}>
                  {walletType === 'crypto' ? (
                    <>
                      <div>0.00000000 BTC</div>
                      <div className="text-sm text-muted-foreground">≈ $0.00</div>
                    </>
                  ) : (
                    `₦${walletNaira.toLocaleString()}`
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="opacity-70">
                    {walletType === 'crypto' ? 'Multi-chain support' : 'Personal savings wallet'}
                  </span>
                  <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                    View details →
                  </div>
                </div>
              </CardContent>
            </Card>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="amount" className="text-sm">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={200}
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))}
                    className="w-28 sm:w-32"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="auto" checked={autoMark} onCheckedChange={toggleAutoMark} />
                  <Label htmlFor="auto" className="text-sm">Auto-mark</Label>
                </div>
              </div>

              <ToggleGroup type="single" value={String(amount)} aria-label="Quick amounts" className="justify-center sm:justify-start gap-2">
                {quick.map((q) => (
                  <ToggleGroupItem
                    key={q}
                    value={String(q)}
                    aria-label={`₦${q}`}
                    onClick={() => setAmount(q)}
                    className="h-11 sm:h-9 px-3 min-w-[4.5rem]"
                  >
                    ₦{q}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <div className="flex gap-3">
                <Button onClick={() => void submit()} disabled={loading} className="h-11 sm:h-10">
                  {loading ? "Submitting..." : "Submit"}
                </Button>
                <Button variant="outline" onClick={() => void fund()} className="h-11 sm:h-10">
                  Fund Wallet
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="h-11 sm:h-10">Contribute now…</Button>
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
