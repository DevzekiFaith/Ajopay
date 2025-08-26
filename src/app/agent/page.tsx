"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import DashboardShell from "@/components/dashboard/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { motion } from "framer-motion";

const COMMISSION_PERCENT = Number(process.env.NEXT_PUBLIC_AGENT_COMMISSION_PERCENT ?? "10");

export default function AgentPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState(200);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [isAgentOrAdmin, setIsAgentOrAdmin] = useState(false);
  const [clusterId, setClusterId] = useState<string | null>(null);
  const [recent, setRecent] = useState<Array<{ id: string; user_id: string; amount_kobo: number; contributed_at: string }>>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Array<{ id: string; full_name: string | null; email: string | null }>>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newBusiness, setNewBusiness] = useState("");
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [last7Naira, setLast7Naira] = useState<number>(0);
  const [prev7Naira, setPrev7Naira] = useState<number>(0);
  const [sparkPoints, setSparkPoints] = useState<string>("");
  const [activeDays30, setActiveDays30] = useState<number>(0);
  const [activePct30, setActivePct30] = useState<number>(0);

  const loadRecent = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("contributions")
      .select("id, user_id, amount_kobo, contributed_at")
      .eq("agent_id", user.id)
      .eq("method", "cash")
      .order("contributed_at", { ascending: false })
      .limit(25);
    if (!error && data) setRecent(data);
  };

  const toggleAgentMode = async (checked: boolean) => {
    setRoleLoading(true);
    try {
      const res = await fetch("/api/agent-mode/toggle", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to toggle");
      if (data.role === "agent") {
        setIsAgentOrAdmin(true);
        setClusterId(data.cluster_id || null);
        toast.success("Agent mode enabled");
      } else {
        setIsAgentOrAdmin(false);
        // keep cluster id as returned (may be null)
        setClusterId(data.cluster_id || null);
        toast.success("Agent mode disabled");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to toggle agent mode");
    } finally {
      setRoleLoading(false);
    }
  };

  const createCluster = async () => {
    setRoleLoading(true);
    try {
      const res = await fetch("/api/clusters/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create cluster");
      setClusterId(data.id);
      setIsAgentOrAdmin(true);
      toast.success(`Cluster created: ${data.name || data.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create cluster");
    } finally {
      setRoleLoading(false);
    }
  };

  // Check current user's role to gate create-customer UI and capture cluster
  useEffect(() => {
    (async () => {
      setRoleLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsAgentOrAdmin(false);
          setClusterId(null);
          return;
        }
        const { data: me } = await supabase.from("profiles").select("role, cluster_id").eq("id", user.id).maybeSingle();
        setIsAgentOrAdmin(!!me && (me as any).role && ["agent", "admin"].includes((me as any).role));
        setClusterId((me as any)?.cluster_id ?? null);
      } catch {
        setIsAgentOrAdmin(false);
        setClusterId(null);
      } finally {
        setRoleLoading(false);
      }
    })();
  }, [supabase]);

  const createCustomer = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (!newEmail) throw new Error("Email is required");
      const res = await fetch("/api/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: newEmail,
          full_name: newName || undefined,
          business_name: newBusiness || undefined,
          cluster_id: clusterId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Forbidden: Your account must be an agent or admin to create customers");
        }
        throw new Error(data?.error || "Failed to create customer");
      }
      setCustomerId(data.id);
      setMessage(`Created customer ${data.email}`);
      toast.success(`Created customer ${data.email}`);
      setNewEmail("");
      setNewName("");
      setNewBusiness("");
    } catch (e: any) {
      setMessage(e.message || "Error creating customer");
      toast.error(e.message || "Error creating customer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadKpis = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date();
    const toIso = (d: Date) => d.toISOString().slice(0, 10);
    const end = new Date(toIso(today));
    const start30 = new Date(end);
    start30.setDate(end.getDate() - 29);
    const { data: rows } = await supabase
      .from("contributions")
      .select("amount_kobo, contributed_at")
      .eq("agent_id", user.id)
      .eq("method", "cash")
      .gte("contributed_at", toIso(start30))
      .lte("contributed_at", toIso(end));
    const list = (rows as any[]) ?? [];
    const last7Start = new Date(end);
    last7Start.setDate(end.getDate() - 6);
    const prev7Start = new Date(end);
    prev7Start.setDate(end.getDate() - 13);
    const prev7End = new Date(end);
    prev7End.setDate(end.getDate() - 7);
    let last7 = 0,
      prev7 = 0;
    for (const r of list) {
      const d = (r.contributed_at || "").slice(0, 10);
      if (!d) continue;
      if (d >= toIso(last7Start) && d <= toIso(end)) last7 += r.amount_kobo ?? 0;
      else if (d >= toIso(prev7Start) && d <= toIso(prev7End)) prev7 += r.amount_kobo ?? 0;
    }
    setLast7Naira(Math.round(last7 / 100));
    setPrev7Naira(Math.round(prev7 / 100));

    // Build sparkline points over 14 days (₦ per day)
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (13 - i));
      return toIso(d);
    });
    const daySums: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
    for (const r of list) {
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

    // Active days over the last 30 days
    const days30 = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (29 - i));
      return toIso(d);
    });
    const hit: Record<string, boolean> = Object.fromEntries(days30.map((d) => [d, false]));
    for (const r of list) {
      const d = (r.contributed_at || "").slice(0, 10);
      if (d && d in hit) hit[d] = true;
    }
    const active = days30.reduce((acc, d) => acc + (hit[d] ? 1 : 0), 0);
    setActiveDays30(active);
    setActivePct30(Math.round((active / 30) * 100));
  };

  // Realtime: refresh recent and totals on contributions changes for this agent
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const channel = supabase
        .channel("agent-contributions")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "contributions", filter: `agent_id=eq.${user.id}` },
          async () => {
            await loadRecent();
            await loadKpis();
            if (results.length) {
              const ids = results.map((d) => d.id);
              const { data: sums } = await supabase
                .from("contributions")
                .select("user_id, total:amount_kobo.sum()")
                .in("user_id", ids as any)
                .eq("status", "confirmed");
              const map: Record<string, number> = {};
              (sums ?? []).forEach((s: any) => {
                map[s.user_id] = Math.round(((s.total ?? 0) as number) / 100);
              });
              setTotals(map);
            }
          }
        )
        .subscribe();
      unsub = () => {
        try {
          supabase.removeChannel(channel);
        } catch {}
      };
    })();
    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.length]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q || q.length < 2) {
        setResults([]);
        setTotals({});
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "customer")
        .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
      if (!error && data) {
        setResults(data);
        // Aggregate total deposited per found customer (confirmed contributions)
        const ids = (data ?? []).map((d: any) => d.id);
        if (ids.length) {
          const { data: sums } = await supabase
            .from("contributions")
            .select("user_id, total:amount_kobo.sum()")
            .in("user_id", ids as any)
            .eq("status", "confirmed");
          const map: Record<string, number> = {};
          (sums ?? []).forEach((s: any) => {
            map[s.user_id] = Math.round(((s.total ?? 0) as number) / 100);
          });
          setTotals(map);
        } else {
          setTotals({});
        }
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    loadKpis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recordCash = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (amount < 200) throw new Error("Minimum is ₦200");
      if (!customerId) throw new Error("Provide customer user ID");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in");

      const { error } = await supabase.from("contributions").insert({
        user_id: customerId,
        agent_id: user.id,
        amount_kobo: amount * 100,
        method: "cash",
        status: "confirmed",
        contributed_at: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      setMessage(`Recorded cash contribution ₦${amount}`);
      toast.success(`Recorded cash contribution ₦${amount}`);
      setAmount(200);
      setCustomerId("");
      await loadRecent();
    } catch (e: any) {
      setMessage(e.message ?? "Failed to record cash");
      toast.error(e.message ?? "Failed to record cash");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell role="agent" title="Agent Dashboard">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 p-4 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
            <div className="text-sm opacity-70">My last 7 days (cash)</div>
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
            <div className="text-sm font-medium">Active Days • 30</div>
            <div className="mt-1 flex items-center justify-between text-xs opacity-80">
              <span>{activeDays30}/30 days with contributions</span>
              <span>{activePct30}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: `${activePct30}%` }} />
            </div>
          </div>
        </div>
        {/* Status header */}
        <div className="flex items-center justify-between border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl rounded-2xl p-3 shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="relative h-6 w-6 sm:h-7 sm:w-7">
              <Image src="/aj2.png" alt="Ajopay" fill sizes="(max-width: 640px) 24px, 28px" className="object-contain" />
            </div>
            <span className="text-sm opacity-80">Status</span>
            <span className={`flex items-center gap-2 text-sm ${!roleLoading && isAgentOrAdmin && clusterId ? "text-green-500" : "text-yellow-500"}`}>
              <span className={`w-2 h-2 rounded-full ${!roleLoading && isAgentOrAdmin && clusterId ? "bg-green-500" : "bg-yellow-500"}`} />
              {!roleLoading && isAgentOrAdmin && clusterId ? "Active" : !roleLoading && isAgentOrAdmin ? "Awaiting cluster" : "Unauthorized"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="opacity-80">Agent mode</span>
              <Switch
                checked={!roleLoading && isAgentOrAdmin && !!clusterId}
                onCheckedChange={toggleAgentMode}
                disabled={roleLoading}
              />
            </div>
            {!roleLoading && (!isAgentOrAdmin || !clusterId) && (
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-80 hidden sm:inline">{isAgentOrAdmin ? "No cluster yet" : "You can self-create a cluster"}</span>
                <Button size="sm" variant="secondary" onClick={createCluster} disabled={roleLoading}>
                  {roleLoading ? "Working…" : "Create my cluster"}
                </Button>
              </div>
            )}
          </div>
        </div>
        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
        <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
          <CardHeader>
            <CardTitle>Create Customer</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!roleLoading && !isAgentOrAdmin && (
              <div className="text-xs p-2 rounded border border-yellow-500/40 bg-yellow-500/10">
                You are currently not authorized to create customers. Ask an admin to set your role to <b>agent</b> or <b>admin</b>.
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Customer email</Label>
              <Input id="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={!isAgentOrAdmin} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Full name (optional)</Label>
              <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={!isAgentOrAdmin} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business">Business name (optional)</Label>
              <Input id="business" value={newBusiness} onChange={(e) => setNewBusiness(e.target.value)} disabled={!isAgentOrAdmin} />
            </div>
            <Button onClick={createCustomer} disabled={loading || !isAgentOrAdmin}>{loading ? "Creating..." : "Create Customer"}</Button>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
        <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
          <CardHeader>
            <CardTitle>Record Cash Contribution</CardTitle>
            <p className="text-xs opacity-70 mt-1">
              Commission: {COMMISSION_PERCENT}% per confirmed cash contribution · On ₦{amount.toLocaleString()} → ₦{Math.floor((amount * COMMISSION_PERCENT) / 100).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid gap-2">
              <Label htmlFor="search">Search customer</Label>
              <Input
                id="search"
                placeholder="Search by email or name"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {results.length > 0 && (
              <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email / Deposited</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.slice(0, 6).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.full_name || r.email || r.id}</TableCell>
                          <TableCell className="opacity-80">
                            <div className="flex flex-col">
                              <span className="text-sm">{r.email}</span>
                              <span className="text-xs opacity-70">Deposited: ₦{(totals[r.id] ?? 0).toLocaleString()}</span>
                              <span className="text-xs opacity-70">Commission to date: ₦{Math.floor(((totals[r.id] ?? 0) * COMMISSION_PERCENT) / 100).toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setCustomerId(r.id);
                                setResults([]);
                                setQ("");
                              }}
                            >
                              Select
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-2">
              <Label htmlFor="customerId">Customer user ID (UUID)</Label>
              <Input id="customerId" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
            </div>

            <div className="flex items-end gap-3">
              <div className="grid gap-2 w-40">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" min={200} value={amount} onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))} />
              </div>
              <div className="flex-1 text-xs opacity-70 mb-1">
                You’ll earn ₦{Math.floor((amount * COMMISSION_PERCENT) / 100).toLocaleString()} on this contribution
              </div>
              <Button onClick={recordCash} disabled={loading}>{loading ? "Recording..." : "Record"}</Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {message && <p className="text-sm opacity-80">{message}</p>}

        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}>
        <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
          <CardHeader>
            <CardTitle>My recent cash records</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length > 0 && (
              <div className="flex items-center justify-end mb-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    try {
                      const header = ["date","amount_naira"]; 
                      const rows = recent.map(r => [r.contributed_at, String(Math.round((r.amount_kobo ?? 0)/100))]);
                      const csv = [header, ...rows].map(cols => cols.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
                      a.href = url;
                      a.download = `agent_transactions_${ts}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    } catch {}
                  }}
                >
                  Download CSV
                </Button>
              </div>
            )}
            {recent.length === 0 ? (
              <p className="opacity-70 text-sm">No records yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{format(new Date(r.contributed_at), "PPP")}</TableCell>
                      <TableCell className="text-right">₦{Math.round((r.amount_kobo ?? 0) / 100).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
