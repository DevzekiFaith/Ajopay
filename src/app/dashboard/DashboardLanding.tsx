"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavingsGoals } from "@/components/Savings/SavingsGoals";
import { Gamification } from "@/components/Game/Gamification";
import { PeerChallenges } from "@/components/Peer/PeerChallenges";
import { SavingsCircles } from "@/components/Circle/SavingsCircle";
import { Target, Award, Users, CircleDot, ArrowRight, Rocket, TrendingUp, Gamepad2, HandHeart } from "lucide-react";

type Role = "customer" | "agent" | "admin";

export default function DashboardLanding({ defaultRole = "customer" as Role }) {
  const [tab, setTab] = useState<Role>(defaultRole);

  const tabs: { key: Role; label: string }[] = useMemo(
    () => [
      { key: "customer", label: "Customer" },
      { key: "agent", label: "Agent" },
      { key: "admin", label: "Admin (read-only)" },
    ],
    []
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 sm:h-10 sm:w-10">
            <Image src="/aj2.png" alt="Ajopay" fill sizes="(max-width: 640px) 32px, 40px" className="object-contain" />
          </div>
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-purple-700 to-violet-500 bg-clip-text text-transparent">
            Choose your workspace
          </h1>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/contact" className="border border-violet-500/30 rounded px-3 py-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 transition-all duration-200 text-violet-700 dark:text-violet-300 font-medium backdrop-blur-xl">
            Contact Support
          </Link>
          <Link href="/customer" className="border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors">Customer</Link>
          <Link href="/agent" className="border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors">Agent</Link>
          <Link href="/admin" className="border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors">Admin</Link>
        </div>
      </div>

      <SegmentedTabs
        items={tabs}
        value={tab}
        onChange={(v) => setTab(v as Role)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "customer" && <CustomerSection />}
          {tab === "agent" && <AgentSection />}
          {tab === "admin" && <AdminSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AnimatedCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}
      className={`rounded-2xl border p-4 sm:p-6 shadow-lg bg-white/10 dark:bg-zinc-900/30 border-white/30 dark:border-white/10 backdrop-blur-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</div>
      {sub && <div className="text-xs text-neutral-500 dark:text-neutral-400">{sub}</div>}
    </div>
  );
}

function CustomerSection() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("Loading…");
  const [last4, setLast4] = useState<string>("0000");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [walletTotalNaira, setWalletTotalNaira] = useState<number>(0);
  const [todayNaira, setTodayNaira] = useState<number>(0);
  const [walletPulse, setWalletPulse] = useState<boolean>(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState("overview");

  // Real-time advanced features data
  const [savingsGoalsCount, setSavingsGoalsCount] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [userXP, setUserXP] = useState<number>(0);
  const [activeChallenges, setActiveChallenges] = useState<number>(0);
  const [savingsCircles, setSavingsCircles] = useState<number>(0);
  const [featuresUpdated, setFeaturesUpdated] = useState<boolean>(false);

  // Load current user and profile, then subscribe for live updates
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let contribChannel: ReturnType<typeof supabase.channel> | null = null;
    let featuresChannel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: ures } = await supabase.auth.getUser();
      const uid = ures?.user?.id ?? null;
      const email = ures?.user?.email ?? "";
      const metaName = (ures?.user as any)?.user_metadata?.full_name as string | undefined;
      setUserId(uid);
      if (uid) setLast4(uid.replace(/[^0-9a-f]/gi, "").slice(-4).padStart(4, "0"));

      // Initial profile fetch (select * to avoid unknown-column errors)
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .maybeSingle();
        const name = (profile as any)?.full_name || (profile as any)?.name || metaName || email || "Customer";
        setDisplayName(name);
        setNewName(name);

        // Load advanced features data
        await loadAdvancedFeaturesData(uid);

        // Initial wallet load (total and today)
        try {
          const { data: sumRows } = await supabase
            .from("contributions")
            .select("amount_kobo, contributed_at")
            .eq("user_id", uid);
          const totalKobo = (sumRows ?? []).reduce((acc: number, r: any) => acc + (r.amount_kobo ?? 0), 0);
          setWalletTotalNaira(Math.round(totalKobo / 100));
          const todayStr = new Date().toISOString().slice(0, 10);
          const todayKobo = (sumRows ?? [])
            .filter((r: any) => r.contributed_at === todayStr)
            .reduce((acc: number, r: any) => acc + (r.amount_kobo ?? 0), 0);
          setTodayNaira(Math.round(todayKobo / 100));
        } catch { }

        // Realtime subscription for live updates
        channel = supabase
          .channel("realtime:profiles:self")
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${uid}` },
            (payload) => {
              const rec: any = payload.new ?? {};
              const nm = rec.full_name || rec.name || metaName || email || "Customer";
              setDisplayName(nm);
            }
          )
          .subscribe();

        // Realtime: update wallet when contributions change for this user
        contribChannel = supabase
          .channel("realtime:contributions:self:landing")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "contributions", filter: `user_id=eq.${uid}` },
            async (payload) => {
              try {
                const { data: sumRows } = await supabase
                  .from("contributions")
                  .select("amount_kobo, contributed_at")
                  .eq("user_id", uid);
                const totalKobo = (sumRows ?? []).reduce((acc: number, r: any) => acc + (r.amount_kobo ?? 0), 0);
                setWalletTotalNaira(Math.round(totalKobo / 100));
                const todayStr = new Date().toISOString().slice(0, 10);
                const todayKobo = (sumRows ?? [])
                  .filter((r: any) => r.contributed_at === todayStr)
                  .reduce((acc: number, r: any) => acc + (r.amount_kobo ?? 0), 0);
                setTodayNaira(Math.round(todayKobo / 100));
                setWalletPulse(true);
                setTimeout(() => setWalletPulse(false), 600);

                // Update advanced features when wallet changes
                await loadAdvancedFeaturesData(uid);
              } catch { }
            }
          )
          .subscribe();

        // Real-time subscription for advanced features
        featuresChannel = supabase
          .channel("realtime:advanced_features")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "savings_goals", filter: `user_id=eq.${uid}` },
            () => loadAdvancedFeaturesData(uid)
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "user_stats", filter: `user_id=eq.${uid}` },
            () => loadAdvancedFeaturesData(uid)
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "challenges", filter: `user_id=eq.${uid}` },
            () => loadAdvancedFeaturesData(uid)
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "savings_circles_members", filter: `user_id=eq.${uid}` },
            () => loadAdvancedFeaturesData(uid)
          )
          .subscribe();
      } else {
        const fallback = metaName || email || "Customer";
        setDisplayName(fallback);
        setNewName(fallback);
      }
    })();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (contribChannel) {
        supabase.removeChannel(contribChannel);
      }
      if (featuresChannel) {
        supabase.removeChannel(featuresChannel);
      }
    };
  }, [supabase]);

  // Function to load advanced features data
  const loadAdvancedFeaturesData = async (uid: string) => {
    try {
      // Load savings goals count
      const { data: goals } = await supabase
        .from("savings_goals")
        .select("id")
        .eq("user_id", uid);
      setSavingsGoalsCount(goals?.length || 0);

      // Load user stats (level and XP)
      const { data: stats } = await supabase
        .from("user_stats")
        .select("level, xp")
        .eq("user_id", uid)
        .maybeSingle();
      setUserLevel(stats?.level || 1);
      setUserXP(stats?.xp || 0);

      // Load active challenges count
      const { data: challenges } = await supabase
        .from("challenges")
        .select("id")
        .eq("user_id", uid)
        .eq("status", "active");
      setActiveChallenges(challenges?.length || 0);

      // Load savings circles count
      const { data: circles } = await supabase
        .from("savings_circles_members")
        .select("circle_id")
        .eq("user_id", uid);
      setSavingsCircles(circles?.length || 0);

      // Trigger update animation
      setFeaturesUpdated(true);
      setTimeout(() => setFeaturesUpdated(false), 1000);
    } catch (error) {
      console.error("Error loading advanced features data:", error);
    }
  };

  const quick = [200, 500, 1000];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <AnimatedCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Wallet Balance</div>
                <div className={`text-3xl sm:text-4xl font-bold tracking-tight ${walletPulse ? "animate-pulse" : ""}`}>₦{walletTotalNaira.toLocaleString()}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Today: ₦{todayNaira.toLocaleString()}</div>
              </div>
              <Link href="/customer" className="rounded-xl px-4 py-2 bg-violet-600 text-white hover:bg-violet-700 shadow">Open Wallet</Link>
            </div>
            <div className="mt-4">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Quick amounts</div>
              <div className="flex gap-2">
                {quick.map((q) => (
                  <motion.button
                    key={q}
                    whileTap={{ scale: 0.98 }}
                    className="px-3 h-9 rounded border border-white/30 dark:border-white/10 bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    ₦{q}
                  </motion.button>
                ))}
              </div>
            </div>
          </AnimatedCard>
          <AnimatedCard>
            <div className="flex items-center justify-between">
              <Stat label="Streak" value="5 days" sub="Keep it up!" />
              <Link href="/customer" className="text-sm border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors">Mark Today</Link>
            </div>
          </AnimatedCard>
        </div>
        <div className="space-y-4">
          <AnimatedCard>
            <div className="text-sm font-medium mb-3">Digital Card</div>
            <motion.div
              layout
              className="relative overflow-hidden rounded-3xl p-5 sm:p-6 border text-neutral-900 dark:text-neutral-100 shadow-[8px_8px_24px_rgba(0,0,0,0.45),_-8px_-8px_24px_rgba(255,255,255,0.06)] bg-neutral-900/70 dark:bg-neutral-900/70 border-white/10 backdrop-blur-2xl"
            >
              <div className="absolute -top-16 -right-20 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -bottom-14 -left-14 w-48 h-48 rounded-full bg-black/20 blur-2xl" />

              <div className="flex items-center justify-between">
                <div>
                  <div className="uppercase text-[10px] tracking-widest opacity-80">Ajopay</div>
                  <div className="mt-1 text-xl font-semibold">Virtual Wallet Card</div>
                </div>
                <div className="w-10 h-7 rounded bg-white/70 shadow-inner" />
              </div>

              <div className="mt-6 text-2xl font-mono tracking-widest drop-shadow">
                **** **** **** {last4}
              </div>

              <div className="mt-6 flex items-center justify-between text-xs">
                <div>
                  <div className="opacity-80">Cardholder</div>
                  {!editingName ? (
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium truncate max-w-[200px]">{displayName}</div>
                      <button
                        onClick={() => setEditingName(true)}
                        className="text-[10px] underline opacity-90 hover:opacity-100"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <form
                      className="flex items-center gap-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!userId) return;
                        setSavingName(true);
                        try {
                          const name = newName.trim();
                          if (name.length < 2) throw new Error("Enter your full name");
                          await supabase.from("profiles").upsert({ id: userId, full_name: name }, { onConflict: "id" });
                          await supabase.auth.updateUser({ data: { full_name: name } as any });
                          setDisplayName(name);
                          setEditingName(false);
                          toast.success("Name updated");
                        } catch (err: any) {
                          toast.error(err?.message || "Failed to update name");
                        } finally {
                          setSavingName(false);
                        }
                      }}
                    >
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-7 rounded px-2 text-neutral-900"
                      />
                      <button disabled={savingName} className="h-7 px-2 rounded bg-white/80 text-neutral-900 disabled:opacity-60">
                        {savingName ? "Saving…" : "Save"}
                      </button>
                      <button type="button" className="h-7 px-2 rounded border border-white/50" onClick={() => { setEditingName(false); setNewName(displayName); }}>
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
                <div className="text-right">
                  <div className="opacity-80">Live</div>
                  <motion.span
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="inline-flex items-center gap-1"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-300" />
                    Updating
                  </motion.span>
                </div>
              </div>
            </motion.div>
          </AnimatedCard>
          <AnimatedCard>
            <div className="text-sm font-medium mb-2">Join a Cluster</div>
            <Link href="/customer" className="w-full inline-flex items-center justify-center h-9 rounded border border-white/30 dark:border-white/10 bg-white/10 hover:bg-white/20 transition-colors">Open</Link>
          </AnimatedCard>
        </div>
      </div>

      {/* Advanced Savings Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="group"
      >
        <AnimatedCard className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[8px_8px_24px_rgba(0,0,0,0.15),_-8px_-8px_24px_rgba(255,255,255,0.05)] hover:shadow-[12px_12px_32px_rgba(0,0,0,0.2),_-12px_-12px_32px_rgba(255,255,255,0.08)] transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-black text-2xl font-bold">Advanced Savings Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl rounded-2xl shadow">
              <div className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-2xl rounded-t-2xl">
                <button
                  onClick={() => setActiveFeatureTab("overview")}
                  className={`px-4 py-3 text-black text-sm font-medium rounded-tl-2xl border-r border-white/20 hover:bg-white/30 transition-all duration-200 ${activeFeatureTab === "overview"
                    ? "text-black bg-white/20"
                    : "text-black/70 hover:text-black"
                    }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveFeatureTab("goals")}
                  className={`px-4 py-3 text-sm font-medium border-r border-white/20 hover:bg-white/30 transition-all duration-200 ${activeFeatureTab === "goals"
                    ? "text-black bg-white/20"
                    : "text-black/70 hover:text-black"
                    }`}
                >
                  Goals
                </button>
                <button
                  onClick={() => setActiveFeatureTab("gamification")}
                  className={`px-4 py-3 text-sm font-medium border-r border-white/20 hover:bg-white/30 transition-all duration-200 ${activeFeatureTab === "gamification"
                    ? "text-black bg-white/20"
                    : "text-black/70 hover:text-black"
                    }`}
                >
                  Rewards
                </button>
                <button
                  onClick={() => setActiveFeatureTab("challenges")}
                  className={`px-4 py-3 text-sm font-medium border-r border-white/20 hover:bg-white/30 transition-all duration-200 ${activeFeatureTab === "challenges"
                    ? "text-black bg-white/20"
                    : "text-black/70 hover:text-black"
                    }`}
                >
                  Community
                </button>
                <button
                  onClick={() => setActiveFeatureTab("circles")}
                  className={`px-4 py-3 text-sm font-medium rounded-tr-2xl hover:bg-white/30 transition-all duration-200 ${activeFeatureTab === "circles"
                    ? "text-black bg-white/20"
                    : "text-black/70 hover:text-black"
                    }`}
                >
                  Circles
                </button>
              </div>

              <div className="p-6">
                {activeFeatureTab === "overview" && (
                  <div className="space-y-6">
                    {/* Feature Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <motion.div
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        onClick={() => setActiveFeatureTab("goals")}
                        className="cursor-pointer group"
                      >
                        <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-cyan-900/40 backdrop-blur-2xl p-6 shadow-[8px_8px_24px_rgba(0,0,0,0.4),_-8px_-8px_24px_rgba(59,130,246,0.1)] hover:shadow-[12px_12px_32px_rgba(0,0,0,0.5),_-12px_-12px_32px_rgba(59,130,246,0.15)] transition-all duration-300">
                          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-blue-500/20 blur-2xl group-hover:bg-blue-500/30 transition-all duration-300" />
                          <div className="relative z-10 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/30 border border-blue-400/50 flex items-center justify-center backdrop-blur-xl">
                              <Target className="w-6 h-6 text-blue-300" />
                            </div>
                            <h3 className="font-bold text-black mb-2 text-lg">Savings Goals</h3>
                            <p className="text-black/80 text-sm leading-relaxed font-medium">Set and track personal savings targets with progress visualization</p>
                            <div className="mt-3 flex items-center justify-center gap-2">
                              <div className={`text-lg font-bold text-blue-600 ${featuresUpdated ? 'animate-pulse' : ''}`}>
                                {savingsGoalsCount}
                              </div>
                              <div className="text-xs text-black/70">active goals</div>
                            </div>
                            <div className="mt-2 inline-flex items-center text-xs text-blue-600 font-bold">
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Click to explore
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        onClick={() => setActiveFeatureTab("gamification")}
                        className="cursor-pointer group"
                      >
                        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-pink-900/40 backdrop-blur-2xl p-6 shadow-[8px_8px_24px_rgba(0,0,0,0.4),_-8px_-8px_24px_rgba(147,51,234,0.1)] hover:shadow-[12px_12px_32px_rgba(0,0,0,0.5),_-12px_-12px_32px_rgba(147,51,234,0.15)] transition-all duration-300">
                          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-purple-500/20 blur-2xl group-hover:bg-purple-500/30 transition-all duration-300" />
                          <div className="relative z-10 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center backdrop-blur-xl">
                              <Award className="w-6 h-6 text-purple-300" />
                            </div>
                            <h3 className="font-bold text-black mb-2 text-lg">Rewards & Badges</h3>
                            <p className="text-black/80 text-sm leading-relaxed font-medium">Earn XP, unlock achievements and level up your savings journey</p>
                            <div className="mt-3 flex items-center justify-center gap-4">
                              <div className="text-center">
                                <div className={`text-lg font-bold text-purple-600 ${featuresUpdated ? 'animate-pulse' : ''}`}>
                                  Level {userLevel}
                                </div>
                                <div className="text-xs text-black/70">current level</div>
                              </div>
                              <div className="text-center">
                                <div className={`text-lg font-bold text-purple-600 ${featuresUpdated ? 'animate-pulse' : ''}`}>
                                  {userXP}
                                </div>
                                <div className="text-xs text-black/70">XP earned</div>
                              </div>
                            </div>
                            <div className="mt-2 inline-flex items-center text-xs text-purple-600 font-bold">
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Click to explore
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        onClick={() => setActiveFeatureTab("challenges")}
                        className="cursor-pointer group"
                      >
                        <div className="relative overflow-hidden rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-900/40 via-green-800/30 to-emerald-900/40 backdrop-blur-2xl p-6 shadow-[8px_8px_24px_rgba(0,0,0,0.4),_-8px_-8px_24px_rgba(34,197,94,0.1)] hover:shadow-[12px_12px_32px_rgba(0,0,0,0.5),_-12px_-12px_32px_rgba(34,197,94,0.15)] transition-all duration-300">
                          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-green-500/20 blur-2xl group-hover:bg-green-500/30 transition-all duration-300" />
                          <div className="relative z-10 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/30 border border-green-400/50 flex items-center justify-center backdrop-blur-xl">
                              <Users className="w-6 h-6 text-green-300" />
                            </div>
                            <h3 className="font-bold text-black mb-2 text-lg">Peer Challenges</h3>
                            <p className="text-black/80 text-sm leading-relaxed font-medium">Compete with friends and community in savings challenges</p>
                            <div className="mt-3 flex items-center justify-center gap-2">
                              <div className={`text-lg font-bold text-green-600 ${featuresUpdated ? 'animate-pulse' : ''}`}>
                                {activeChallenges}
                              </div>
                              <div className="text-xs text-black/70">active challenges</div>
                            </div>
                            <div className="mt-2 inline-flex items-center text-xs text-green-600 font-bold">
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Click to explore
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        onClick={() => setActiveFeatureTab("circles")}
                        className="cursor-pointer group"
                      >
                        <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-900/40 via-orange-800/30 to-red-900/40 backdrop-blur-2xl p-6 shadow-[8px_8px_24px_rgba(0,0,0,0.4),_-8px_-8px_24px_rgba(249,115,22,0.1)] hover:shadow-[12px_12px_32px_rgba(0,0,0,0.5),_-12px_-12px_32px_rgba(249,115,22,0.15)] transition-all duration-300">
                          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-orange-500/20 blur-2xl group-hover:bg-orange-500/30 transition-all duration-300" />
                          <div className="relative z-10 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-500/30 border border-orange-400/50 flex items-center justify-center backdrop-blur-xl">
                              <CircleDot className="w-6 h-6 text-orange-300" />
                            </div>
                            <h3 className="font-bold text-black mb-2 text-lg">Savings Circles</h3>
                            <p className="text-black/80 text-sm leading-relaxed font-medium">Join digital ajo/esusu groups for collaborative savings</p>
                            <div className="mt-3 flex items-center justify-center gap-2">
                              <div className={`text-lg font-bold text-orange-600 ${featuresUpdated ? 'animate-pulse' : ''}`}>
                                {savingsCircles}
                              </div>
                              <div className="text-xs text-black/70">joined circles</div>
                            </div>
                            <div className="mt-2 inline-flex items-center text-xs text-orange-600 font-bold">
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Click to explore
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Enhanced Info Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-900/40 via-violet-800/30 to-fuchsia-900/40 backdrop-blur-2xl p-8 shadow-[8px_8px_24px_rgba(0,0,0,0.4),_-8px_-8px_24px_rgba(139,92,246,0.1)]"
                    >
                      <div className="absolute -top-16 -right-20 w-60 h-60 rounded-full bg-violet-500/10 blur-3xl" />
                      <div className="absolute -bottom-14 -left-14 w-48 h-48 rounded-full bg-fuchsia-500/10 blur-2xl" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <Rocket className="w-8 h-8 text-violet-300" />
                          <h4 className="font-bold text-black text-xl">Transform Your Savings Journey</h4>
                        </div>
                        <p className="text-black/90 text-base leading-relaxed mb-6 font-medium">
                          Discover powerful new ways to save money, stay motivated, and achieve your financial goals with our advanced features.
                          Set personal goals, earn rewards, challenge friends, and join savings circles to make saving fun and social!
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-black/20 backdrop-blur-xl border border-white/10 hover:bg-black/30 transition-all duration-200">
                            <TrendingUp className="w-6 h-6 text-blue-300" />
                            <div>
                              <div className="font-bold text-black text-sm">Track Progress</div>
                              <div className="text-black/70 text-xs font-medium">Visual goal tracking</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-black/20 backdrop-blur-xl border border-white/10 hover:bg-black/30 transition-all duration-200">
                            <Gamepad2 className="w-6 h-6 text-purple-300" />
                            <div>
                              <div className="font-bold text-black text-sm">Gamification</div>
                              <div className="text-black/70 text-xs font-medium">Earn rewards & badges</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-black/20 backdrop-blur-xl border border-white/10 hover:bg-black/30 transition-all duration-200">
                            <HandHeart className="w-6 h-6 text-green-300" />
                            <div>
                              <div className="font-bold text-black text-sm">Social Saving</div>
                              <div className="text-black/70 text-xs font-medium">Community challenges</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {activeFeatureTab === "goals" && (
                  <SavingsGoals />
                )}

                {activeFeatureTab === "gamification" && (
                  <Gamification />
                )}

                {activeFeatureTab === "challenges" && (
                  <PeerChallenges />
                )}

                {activeFeatureTab === "circles" && (
                  <SavingsCircles />
                )}
              </div>
            </div>
          </CardContent>
        </AnimatedCard>
      </motion.div>
    </div>
  );
}

function AgentSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <AnimatedCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Approvals Queue</div>
              <ul className="text-sm mt-2 space-y-1">
                <li className="flex justify-between"><span>Uche – ₦1,000</span><button className="text-xs border rounded px-2">Approve</button></li>
                <li className="flex justify-between"><span>Bola – ₦500</span><button className="text-xs border rounded px-2">Approve</button></li>
              </ul>
            </div>
            <Link href="/agent" className="text-sm border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors">Open Agent</Link>
          </div>
        </AnimatedCard>
        <AnimatedCard>
          <div className="text-sm font-medium">Commission Summary</div>
          <div className="text-xl font-semibold">₦6,200</div>
          <div className="mt-2 text-xs opacity-70">MVP preview</div>
        </AnimatedCard>
      </div>
      <div className="space-y-4">
        <AnimatedCard>
          <div className="text-sm font-medium">Customers</div>
          <ul className="text-sm mt-2 space-y-1">
            <li>ade@mail.com</li>
            <li>joan@mail.com</li>
            <li>chidi@mail.com</li>
          </ul>
        </AnimatedCard>
      </div>
    </div>
  );
}

function AdminSection() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [total, setTotal] = useState<number>(0);
  const [todayTotal, setTodayTotal] = useState<number>(0);
  const [todayStr, setTodayStr] = useState<string>(new Date().toISOString().slice(0, 10));
  const [spark, setSpark] = useState<string>("");
  const [pulse, setPulse] = useState<boolean>(false);

  const load = async () => {
    const { data: ures } = await supabase.auth.getUser();
    const uid = ures?.user?.id ?? null;
    if (!uid) return;
    const { data: me } = await supabase.from("profiles").select("cluster_id").eq("id", uid).maybeSingle();
    const cid = (me as any)?.cluster_id ?? null;

    // gather cluster member ids
    const ids = cid
      ? ((await supabase.from("profiles").select("id").eq("cluster_id", cid)).data?.map((p: any) => p.id) ?? [])
      : [];

    // all rows in scope
    const { data: allRows } = await supabase
      .from("contributions")
      .select("amount_kobo, contributed_at, user_id")
      .in("user_id", (ids as any) ?? []);
    const totalKobo = (allRows ?? []).reduce((acc: number, r: any) => acc + (r.amount_kobo ?? 0), 0);
    setTotal(Math.round(totalKobo / 100));

    const today = new Date().toISOString().slice(0, 10);
    setTodayStr(today);
    const { data: todayRows } = await supabase
      .from("contributions")
      .select("amount_kobo, user_id")
      .eq("contributed_at", today)
      .in("user_id", (ids as any) ?? []);
    const todayKobo = (todayRows ?? []).reduce((acc: number, r: any) => acc + (r.amount_kobo ?? 0), 0);
    setTodayTotal(Math.round(todayKobo / 100));

    // Build sparkline (last 14 days)
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().slice(0, 10);
    });
    const sums: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
    for (const r of allRows ?? []) {
      const d = (r as any).contributed_at?.slice(0, 10);
      if (d && d in sums) sums[d] += Math.round(((r as any).amount_kobo ?? 0) / 100);
    }
    const series = days.map((d) => sums[d] ?? 0);
    const maxVal = Math.max(1, ...series);
    const pts = series
      .map((v, i) => {
        const x = (i / (series.length - 1)) * 100;
        const y = 30 - (v / maxVal) * 30;
        return `${x},${y}`;
      })
      .join(" ");
    setSpark(pts);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-admin-overview")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        async () => {
          await load();
          setPulse(true);
          setTimeout(() => setPulse(false), 600);
        }
      )
      .subscribe();
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch { }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <AnimatedCard>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded p-4 bg-white/10 dark:bg-white/5 border-white/30 dark:border-white/10 backdrop-blur-xl">
              <h3 className="font-medium">Total Collected</h3>
              <p className={`text-2xl font-semibold ${pulse ? "animate-pulse" : ""}`}>₦{total.toLocaleString()}</p>
              <p className="opacity-70 text-xs">All time (cluster)</p>
              <svg viewBox="0 0 100 30" className="mt-2 w-full h-8 opacity-80">
                <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={spark} />
              </svg>
            </div>
            <div className="border rounded p-4 bg-white/10 dark:bg-white/5 border-white/30 dark:border-white/10 backdrop-blur-xl">
              <h3 className="font-medium">Today</h3>
              <p className={`text-2xl font-semibold ${pulse ? "animate-pulse" : ""}`}>₦{todayTotal.toLocaleString()}</p>
              <p className="opacity-70 text-xs">{todayStr}</p>
            </div>
            <div className="border rounded p-4 bg-white/10 dark:bg-white/5 border-white/30 dark:border-white/10 backdrop-blur-xl">
              <h3 className="font-medium">Clusters</h3>
              <p className="opacity-70 text-sm">Per-cluster breakdown coming soon…</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/admin" className="text-sm border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors">Open Admin</Link>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}

function SegmentedTabs({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative inline-flex items-center p-1 rounded-2xl border border-white/30 dark:border-white/10 bg-white/10 dark:bg-white/5 backdrop-blur-xl">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={`relative z-[1] px-4 py-2 rounded-xl text-sm transition font-medium ${value === it.key ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400"
            }`}
        >
          {it.label}
        </button>
      ))}
      <motion.div
        layout
        layoutId="segmented-pill"
        className="absolute z-0 h-[34px] rounded-xl bg-white/80 dark:bg-neutral-800/80 shadow"
        initial={false}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{
          width: `${100 / items.length}%`,
          left: `${items.findIndex((i) => i.key === value) * (100 / items.length)}%`,
        }}
      />
    </div>
  );
}
