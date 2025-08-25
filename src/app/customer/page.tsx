"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import DashboardShell from "@/components/dashboard/Shell";
import Image from "next/image";
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

export default function CustomerPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [amount, setAmount] = useState(200);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [walletNaira, setWalletNaira] = useState<number>(0);
  const [walletPulse, setWalletPulse] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ id: string; amount_kobo: number; contributed_at: string }>>([]);
  const [streak, setStreak] = useState<number>(0);
  const [autoMark, setAutoMark] = useState<boolean>(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState<"history" | "calendar">("history");
  const [windowOffset, setWindowOffset] = useState(0); // 0 = last 30 days ending today, 1 = previous 30-day window, etc.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [justMarked, setJustMarked] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState<number>(200);
  const [skipConfirm, setSkipConfirm] = useState<boolean>(false);
  const [profileSettings, setProfileSettings] = useState<Record<string, any> | null>(null);

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
            // Refresh data
            await loadData();
            // Pulse wallet subtly
            try {
              setWalletPulse(true);
              setTimeout(() => setWalletPulse(false), 600);
            } catch {}
            // Toast if today's contribution was recorded
            try {
              if (payload?.eventType === "INSERT") {
                const contributedAt = payload?.new?.contributed_at as string | undefined;
                const todayStr = new Date().toISOString().slice(0, 10);
                if (contributedAt === todayStr) {
                  toast.success("Contribution recorded");
                }
              }
            } catch {}
          }
        )
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    try {
      const v = localStorage.getItem("cust_skip_confirm");
      setSkipConfirm(v === "1");
    } catch {}
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

  const joinCluster = async () => {
    setJoining(true);
    try {
      const code = joinCode.trim();
      if (!code) throw new Error("Enter a join code");
      try { if (typeof navigator !== "undefined" && "vibrate" in navigator) (navigator as any).vibrate?.(8); } catch {}
      toast.loading("Joining cluster…", { id: "join" });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in");

      // Try flexible lookup: by join_code, then id, then name
      let clusterId: string | null = null;
      let errMsg = "Cluster not found";
      {
        const { data, error } = await supabase
          .from("clusters")
          .select("id")
          .eq("join_code", code)
          .maybeSingle();
        if (error) errMsg = error.message;
        if (data?.id) clusterId = data.id;
      }
      if (!clusterId) {
        const { data } = await supabase.from("clusters").select("id").eq("id", code).maybeSingle();
        if (data?.id) clusterId = data.id;
      }
      if (!clusterId) {
        const { data } = await supabase
          .from("clusters")
          .select("id")
          .ilike("name", code)
          .maybeSingle();
        if (data?.id) clusterId = data.id;
      }
      if (!clusterId) throw new Error(errMsg);

      const { error: upErr } = await supabase.from("profiles").update({ cluster_id: clusterId }).eq("id", user.id);
      if (upErr) throw upErr;
      toast.success("Joined cluster", { id: "join" });
      setJoinCode("");
    } catch (e: any) {
      toast.error(e.message || "Failed to join", { id: "join" });
    } finally {
      setJoining(false);
    }
  };

  return (
    <DashboardShell role="customer" title="Customer Dashboard">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl rounded-2xl p-3 shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="relative h-7 w-7">
              <Image src="/aj2.png" alt="Ajopay" fill className="object-contain" />
            </div>
            <h1 className="text-xl font-semibold">Customer Dashboard</h1>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
          <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            <CardHeader>
              <CardTitle>Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-semibold transition-all ${walletPulse ? "animate-pulse" : ""}`}>
                ₦{walletNaira.toLocaleString()}
              </div>
              <div className="text-xs opacity-70">Total contributed</div>
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
            <div className="flex items-center justify-between">
              <CardTitle>Quick Contribution</CardTitle>
              <span className="text-xs opacity-70">Minimum ₦200</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="amount" className="text-sm">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min={200}
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))}
                  className="w-32"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="auto" checked={autoMark} onCheckedChange={setAutoMark} />
                <Label htmlFor="auto" className="text-sm">Auto-mark</Label>
              </div>
            </div>

            <ToggleGroup type="single" value={String(amount)} aria-label="Quick amounts">
              {quick.map((q) => (
                <ToggleGroupItem
                  key={q}
                  value={String(q)}
                  aria-label={`₦${q}`}
                  onClick={() => setAmount(q)}
                >
                  ₦{q}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <div className="flex gap-3">
              <Button onClick={() => void submit()} disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Contribute now…</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Contribute</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = form.getValues();
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
                      <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit"}</Button>
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
          <TabsList>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="calendar">Card Grid</TabsTrigger>
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
                  return (
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
                  );
                })()}
              </CardContent>
            </Card>
            </motion.div>
          </TabsContent>
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
                    try { if (typeof navigator !== "undefined" && "vibrate" in navigator) (navigator as any).vibrate?.(10); } catch {}
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
        </Tabs>
      </div>
    </DashboardShell>
  );
}
