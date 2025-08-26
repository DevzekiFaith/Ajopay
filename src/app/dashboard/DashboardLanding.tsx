"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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

  // Load current user and profile, then subscribe for live updates
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let contribChannel: ReturnType<typeof supabase.channel> | null = null;
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
        } catch {}

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
              } catch {}
            }
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
    };
  }, [supabase]);

  const quick = [200, 500, 1000];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
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
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <Stat label="Streak" value="5 days" sub="Keep it up!" />
            <Link href="/customer" className="text-sm border border-white/30 dark:border-white/10 rounded px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors">Mark Today</Link>
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <div className="text-sm font-medium mb-3">Digital Card</div>
          <motion.div
            layout
            className="relative overflow-hidden rounded-3xl p-5 sm:p-6 border text-white shadow-[8px_8px_24px_rgba(0,0,0,0.45),_-8px_-8px_24px_rgba(255,255,255,0.06)] bg-neutral-900/70 dark:bg-neutral-900/70 border-white/10 backdrop-blur-2xl"
          >
            <div className="absolute -top-16 -right-20 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-14 -left-14 w-48 h-48 rounded-full bg-black/20 blur-2xl" />

            <div className="flex items-center justify-between">
              <div>
                <div className="uppercase text-[10px] tracking-widest opacity-80">Thriftly</div>
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
        </Card>
        <Card>
          <div className="text-sm font-medium mb-2">Join a Cluster</div>
          <Link href="/customer" className="w-full inline-flex items-center justify-center h-9 rounded border border-white/30 dark:border-white/10 bg-white/10 hover:bg-white/20 transition-colors">Open</Link>
        </Card>
      </div>
    </div>
  );
}

function AgentSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
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
        </Card>
        <Card>
          <div className="text-sm font-medium">Commission Summary</div>
          <div className="text-xl font-semibold">₦6,200</div>
          <div className="mt-2 text-xs opacity-70">MVP preview</div>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <div className="text-sm font-medium">Customers</div>
          <ul className="text-sm mt-2 space-y-1">
            <li>ade@mail.com</li>
            <li>joan@mail.com</li>
            <li>chidi@mail.com</li>
          </ul>
        </Card>
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
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <Card>
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
        </Card>
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
